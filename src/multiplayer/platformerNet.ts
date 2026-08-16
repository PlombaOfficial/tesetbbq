import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { PlatformerRoomState, PlatformerPlayer } from '../types/platformerGame';

export class PlatformerNetManager {
  private currentUnsubscribe: Unsubscribe | null = null;
  private heartbeatInterval: number | null = null;
  private localRoomState: PlatformerRoomState | null = null;
  private isOfflineMode: boolean = false;

  public generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create World Room
  public async createWorld(
    hostPlayer: PlatformerPlayer,
    worldName: string = 'AETHERIA EXPEDITION',
    seed: number = Math.floor(Math.random() * 900000) + 100000,
    initialTiles: Record<string, number> = {},
    initialWalls: Record<string, number> = {}
  ): Promise<PlatformerRoomState> {
    const roomCode = this.generateCode();

    const initialRoom: PlatformerRoomState = {
      roomCode,
      hostId: hostPlayer.id,
      worldName,
      seed,
      gameTime: 6000,
      phase: 'LOBBY',
      players: {
        [hostPlayer.id]: {
          ...hostPlayer,
          isHost: true,
          isReady: true,
          lastPing: Date.now()
        }
      },
      modifiedTiles: initialTiles,
      modifiedWalls: initialWalls,
      chests: {},
      mobs: {},
      chatMessages: [
        {
          id: 'msg_init_' + Date.now(),
          sender: 'SYSTEM',
          text: `Expedition [${worldName}] initialized (Seed: ${seed}). Room Code: ${roomCode}`,
          color: '#10b981',
          timestamp: Date.now()
        }
      ],
      lastUpdated: Date.now()
    };

    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      await setDoc(roomRef, initialRoom);
      this.isOfflineMode = false;
    } catch (err) {
      console.warn('Firestore fallback:', err);
      this.isOfflineMode = true;
      this.localRoomState = initialRoom;
    }

    return initialRoom;
  }

  // Join World Room
  public async joinWorld(
    roomCode: string,
    player: PlatformerPlayer
  ): Promise<{ success: boolean; error?: string; room?: PlatformerRoomState }> {
    const code = roomCode.trim().toUpperCase();

    if (this.isOfflineMode && this.localRoomState && this.localRoomState.roomCode === code) {
      this.localRoomState.players[player.id] = {
        ...player,
        isHost: false,
        isReady: false,
        lastPing: Date.now()
      };
      return { success: true, room: this.localRoomState };
    }

    try {
      const roomRef = doc(db, 'platformer_worlds', code);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'World not found. Check the room code.' };
      }

      const room = snapshot.data() as PlatformerRoomState;
      const count = Object.keys(room.players || {}).length;

      if (!room.players[player.id] && count >= 8) {
        return { success: false, error: 'World is full (8 players max).' };
      }

      const updatedPlayers = {
        ...room.players,
        [player.id]: {
          ...player,
          isHost: room.hostId === player.id || count === 0,
          isReady: false,
          lastPing: Date.now()
        }
      };

      const joinMsg = {
        id: 'msg_' + Date.now(),
        sender: 'SYSTEM',
        text: `Adventurer [${player.name}] joined the expedition.`,
        color: player.color,
        timestamp: Date.now()
      };

      await updateDoc(roomRef, {
        players: updatedPlayers,
        lastUpdated: Date.now(),
        chatMessages: [...(room.chatMessages || []).slice(-35), joinMsg]
      });

      return { success: true, room };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Join failed';
      return { success: false, error: msg };
    }
  }

  // Subscribe to updates
  public subscribeToWorld(
    roomCode: string,
    localPlayerId: string,
    onUpdate: (room: PlatformerRoomState) => void,
    onError: (err: string) => void
  ): () => void {
    if (this.currentUnsubscribe) {
      this.currentUnsubscribe();
    }

    const code = roomCode.trim().toUpperCase();
    this.startHeartbeat(code, localPlayerId);

    if (this.isOfflineMode) {
      const timer = window.setInterval(() => {
        if (this.localRoomState) onUpdate({ ...this.localRoomState });
      }, 500);
      return () => clearInterval(timer);
    }

    try {
      const roomRef = doc(db, 'platformer_worlds', code);
      this.currentUnsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          onError('World session closed.');
          return;
        }

        const room = snapshot.data() as PlatformerRoomState;
        const activePlayers: Record<string, PlatformerPlayer> = {};
        const now = Date.now();

        Object.entries(room.players || {}).forEach(([pId, p]) => {
          if (pId === localPlayerId || (p.lastPing && now - p.lastPing < 35000)) {
            activePlayers[pId] = p;
          }
        });

        room.players = activePlayers;
        onUpdate(room);
      }, () => {
        onError('Connection interrupted.');
      });
    } catch {
      onError('Real-time connection error.');
    }

    return () => {
      if (this.currentUnsubscribe) {
        this.currentUnsubscribe();
        this.currentUnsubscribe = null;
      }
      this.stopHeartbeat();
    };
  }

  private startHeartbeat(roomCode: string, playerId: string) {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(async () => {
      if (this.isOfflineMode) return;
      try {
        const roomRef = doc(db, 'platformer_worlds', roomCode);
        await updateDoc(roomRef, {
          [`players.${playerId}.lastPing`]: Date.now()
        });
      } catch {}
    }, 6000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public async setPlayerReady(roomCode: string, playerId: string, isReady: boolean) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].isReady = isReady;
      return;
    }
    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.isReady`]: isReady,
        [`players.${playerId}.lastPing`]: Date.now(),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  public async syncPlayerTransform(
    roomCode: string,
    playerId: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    facingLeft: boolean,
    isGrounded: boolean,
    health: number,
    stamina: number,
    selectedSlot: number
  ) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      const p = this.localRoomState.players[playerId];
      p.x = x; p.y = y; p.vx = vx; p.vy = vy;
      p.facingLeft = facingLeft; p.isGrounded = isGrounded;
      p.health = health; p.stamina = stamina; p.selectedSlot = selectedSlot;
      return;
    }
    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.x`]: x,
        [`players.${playerId}.y`]: y,
        [`players.${playerId}.vx`]: vx,
        [`players.${playerId}.vy`]: vy,
        [`players.${playerId}.facingLeft`]: facingLeft,
        [`players.${playerId}.isGrounded`]: isGrounded,
        [`players.${playerId}.health`]: health,
        [`players.${playerId}.stamina`]: stamina,
        [`players.${playerId}.selectedSlot`]: selectedSlot,
        [`players.${playerId}.lastPing`]: Date.now()
      });
    } catch {}
  }

  public async syncTileDelta(roomCode: string, x: number, y: number, tileId: number) {
    const key = `${x},${y}`;
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.modifiedTiles[key] = tileId;
      return;
    }
    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      await updateDoc(roomRef, {
        [`modifiedTiles.${key}`]: tileId,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  public async syncWallDelta(roomCode: string, x: number, y: number, wallId: number) {
    const key = `${x},${y}`;
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.modifiedWalls[key] = wallId;
      return;
    }
    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      await updateDoc(roomRef, {
        [`modifiedWalls.${key}`]: wallId,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  public async startWorld(roomCode: string) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.phase = 'PLAYING';
      return;
    }
    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      await updateDoc(roomRef, {
        phase: 'PLAYING',
        lastUpdated: Date.now()
      });
    } catch {}
  }

  public async sendChat(roomCode: string, sender: string, text: string, color: string) {
    const msg = {
      id: 'chat_' + Date.now(),
      sender,
      text,
      color,
      timestamp: Date.now()
    };
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.chatMessages.push(msg);
      return;
    }
    try {
      const roomRef = doc(db, 'platformer_worlds', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const r = snap.data() as PlatformerRoomState;
      await updateDoc(roomRef, {
        chatMessages: [...(r.chatMessages || []).slice(-40), msg],
        lastUpdated: Date.now()
      });
    } catch {}
  }
}

export const platformerNet = new PlatformerNetManager();
