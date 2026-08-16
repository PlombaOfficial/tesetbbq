import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { VoxelRoomState, VoxelPlayer } from '../types/voxelGame';

export class VoxelNetManager {
  private currentUnsubscribe: Unsubscribe | null = null;
  private heartbeatInterval: number | null = null;
  private localRoomState: VoxelRoomState | null = null;
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
    hostPlayer: VoxelPlayer, 
    worldName: string = 'AETHERIA REALM',
    customSeed?: number
  ): Promise<VoxelRoomState> {
    const roomCode = this.generateCode();
    const seed = customSeed || Math.floor(Math.random() * 900000) + 100000;

    const initialRoom: VoxelRoomState = {
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
      modifiedBlocks: {},
      mobs: {},
      chatMessages: [
        {
          id: 'msg_init_' + Date.now(),
          sender: 'SYSTEM',
          text: `Realm [${worldName}] initialized (Seed: ${seed}). Room code: ${roomCode}`,
          color: '#10b981',
          timestamp: Date.now()
        }
      ],
      lastUpdated: Date.now()
    };

    try {
      const roomRef = doc(db, 'voxel_worlds', roomCode);
      await setDoc(roomRef, initialRoom);
      this.isOfflineMode = false;
    } catch (err) {
      console.warn('Firestore offline fallback:', err);
      this.isOfflineMode = true;
      this.localRoomState = initialRoom;
    }

    return initialRoom;
  }

  // Join World Room
  public async joinWorld(
    roomCode: string, 
    player: VoxelPlayer
  ): Promise<{ success: boolean; error?: string; room?: VoxelRoomState }> {
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
      const roomRef = doc(db, 'voxel_worlds', code);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'World not found. Check the code.' };
      }

      const room = snapshot.data() as VoxelRoomState;
      const count = Object.keys(room.players || {}).length;

      if (!room.players[player.id] && count >= 8) {
        return { success: false, error: 'World is at maximum capacity (8 players).' };
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
        text: `Traveler [${player.name}] joined the realm.`,
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

  // Subscribe to Realtime Updates
  public subscribeToWorld(
    roomCode: string,
    localPlayerId: string,
    onUpdate: (room: VoxelRoomState) => void,
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
      const roomRef = doc(db, 'voxel_worlds', code);
      this.currentUnsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          onError('The world was closed.');
          return;
        }

        const room = snapshot.data() as VoxelRoomState;

        // Clean stale ghost players (inactive > 35s)
        const activePlayers: Record<string, VoxelPlayer> = {};
        const now = Date.now();

        Object.entries(room.players || {}).forEach(([pId, p]) => {
          if (pId === localPlayerId || (p.lastPing && now - p.lastPing < 35000)) {
            activePlayers[pId] = p;
          }
        });

        // Host failover
        const playerIds = Object.keys(activePlayers);
        if (playerIds.length > 0 && (!activePlayers[room.hostId] || now - (activePlayers[room.hostId]?.lastPing || 0) > 35000)) {
          const newHostId = playerIds[0];
          if (newHostId === localPlayerId) {
            updateDoc(roomRef, {
              hostId: newHostId,
              [`players.${newHostId}.isHost`]: true,
              players: activePlayers,
              lastUpdated: Date.now()
            }).catch(() => {});
          }
        }

        room.players = activePlayers;
        onUpdate(room);
      }, () => {
        onError('Network connection interrupted.');
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
        const roomRef = doc(db, 'voxel_worlds', roomCode);
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

  // Set Player Ready
  public async setPlayerReady(roomCode: string, playerId: string, isReady: boolean) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].isReady = isReady;
      return;
    }

    try {
      const roomRef = doc(db, 'voxel_worlds', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.isReady`]: isReady,
        [`players.${playerId}.lastPing`]: Date.now(),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Sync Player Transform
  public async syncPlayerTransform(
    roomCode: string,
    playerId: string,
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    health: number,
    hunger: number,
    selectedSlot: number
  ) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      const p = this.localRoomState.players[playerId];
      p.x = x; p.y = y; p.z = z; p.yaw = yaw; p.pitch = pitch;
      p.health = health; p.hunger = hunger; p.selectedSlot = selectedSlot;
      return;
    }

    try {
      const roomRef = doc(db, 'voxel_worlds', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.x`]: x,
        [`players.${playerId}.y`]: y,
        [`players.${playerId}.z`]: z,
        [`players.${playerId}.yaw`]: yaw,
        [`players.${playerId}.pitch`]: pitch,
        [`players.${playerId}.health`]: health,
        [`players.${playerId}.hunger`]: hunger,
        [`players.${playerId}.selectedSlot`]: selectedSlot,
        [`players.${playerId}.lastPing`]: Date.now()
      });
    } catch {}
  }

  // Sync Modified Block Delta
  public async syncBlockDelta(roomCode: string, x: number, y: number, z: number, blockId: number) {
    const key = `${x},${y},${z}`;

    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.modifiedBlocks[key] = blockId;
      return;
    }

    try {
      const roomRef = doc(db, 'voxel_worlds', roomCode);
      await updateDoc(roomRef, {
        [`modifiedBlocks.${key}`]: blockId,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Start World Game
  public async startWorld(roomCode: string) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.phase = 'PLAYING';
      return;
    }

    try {
      const roomRef = doc(db, 'voxel_worlds', roomCode);
      await updateDoc(roomRef, {
        phase: 'PLAYING',
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Send Chat
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
      const roomRef = doc(db, 'voxel_worlds', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const r = snap.data() as VoxelRoomState;

      const msgs = [...(r.chatMessages || []), msg];
      await updateDoc(roomRef, {
        chatMessages: msgs.slice(-40),
        lastUpdated: Date.now()
      });
    } catch {}
  }
}

export const voxelNet = new VoxelNetManager();
