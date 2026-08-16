import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  BackroomsRoomState, 
  BackroomsPlayer, 
  HazmatColor, 
  RadioMessage, 
  WallMark 
} from '../types/horrorGame';

export class BackroomsNetManager {
  private currentUnsubscribe: Unsubscribe | null = null;
  private heartbeatInterval: number | null = null;
  private localRoomState: BackroomsRoomState | null = null;
  private isOfflineMode: boolean = false;

  public generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create Room
  public async createLobby(
    hostPlayer: BackroomsPlayer, 
    levelIndex: number = 0
  ): Promise<BackroomsRoomState> {
    const roomCode = this.generateCode();
    const seed = Math.floor(Math.random() * 900000) + 100000;

    const initialRoom: BackroomsRoomState = {
      roomCode,
      hostId: hostPlayer.id,
      seed,
      currentLevel: levelIndex,
      phase: 'LOBBY',
      players: {
        [hostPlayer.id]: {
          ...hostPlayer,
          isHost: true,
          isReady: true,
          isAlive: true,
          lastPing: Date.now()
        }
      },
      doors: {},
      items: {},
      wallMarks: {},
      entities: {},
      radioMessages: [
        {
          id: 'radio_init_' + Date.now(),
          senderId: 'SYS',
          senderName: 'MEG_COMM',
          senderColor: '#10b981',
          text: `EXPEDITION FREQUENCY ESTABLISHED [CODE: ${roomCode}]. MAINTAIN RADIO DISCIPLINE.`,
          timestamp: Date.now(),
          frequency: 104.5
        }
      ],
      elevatorUnlocked: false,
      lastUpdated: Date.now()
    };

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await setDoc(roomRef, initialRoom);
      this.isOfflineMode = false;
    } catch (err) {
      console.warn('Firestore offline fallback:', err);
      this.isOfflineMode = true;
      this.localRoomState = initialRoom;
    }

    return initialRoom;
  }

  // Join Room
  public async joinLobby(
    roomCode: string, 
    player: BackroomsPlayer
  ): Promise<{ success: boolean; error?: string; room?: BackroomsRoomState }> {
    const code = roomCode.trim().toUpperCase();

    if (this.isOfflineMode && this.localRoomState && this.localRoomState.roomCode === code) {
      this.localRoomState.players[player.id] = {
        ...player,
        isHost: false,
        isReady: false,
        isAlive: true,
        lastPing: Date.now()
      };
      return { success: true, room: this.localRoomState };
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', code);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Expedition squad not found. Check the code.' };
      }

      const room = snapshot.data() as BackroomsRoomState;
      const count = Object.keys(room.players || {}).length;

      if (!room.players[player.id] && count >= 6) {
        return { success: false, error: 'Expedition party is full (Max 6).' };
      }

      const updatedPlayers = {
        ...room.players,
        [player.id]: {
          ...player,
          isHost: room.hostId === player.id || count === 0,
          isReady: false,
          isAlive: true,
          lastPing: Date.now()
        }
      };

      const joinMsg: RadioMessage = {
        id: 'msg_' + Date.now(),
        senderId: 'SYS',
        senderName: 'RADIO',
        senderColor: player.color,
        text: `Operative [${player.name}] joined the frequency.`,
        timestamp: Date.now(),
        frequency: 104.5
      };

      await updateDoc(roomRef, {
        players: updatedPlayers,
        lastUpdated: Date.now(),
        radioMessages: [...(room.radioMessages || []).slice(-30), joinMsg]
      });

      return { success: true, room };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Join failed';
      return { success: false, error: msg };
    }
  }

  // Subscribe to Realtime Updates with Ghost / Stale Player Filtering & Host Migration
  public subscribeToRoom(
    roomCode: string,
    localPlayerId: string,
    onUpdate: (room: BackroomsRoomState) => void,
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
      const roomRef = doc(db, 'backrooms_rooms', code);
      this.currentUnsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          onError('The room was dissolved or closed.');
          return;
        }

        const room = snapshot.data() as BackroomsRoomState;

        // Clean stale ghost players (inactive > 30s) except local player
        const activePlayers: Record<string, BackroomsPlayer> = {};
        const now = Date.now();
        let cleanedAny = false;

        Object.entries(room.players || {}).forEach(([pId, p]) => {
          if (pId === localPlayerId || (p.lastPing && now - p.lastPing < 30000)) {
            activePlayers[pId] = p;
          } else {
            cleanedAny = true;
          }
        });

        // Host Migration check
        const playerIds = Object.keys(activePlayers);
        if (playerIds.length > 0 && (!activePlayers[room.hostId] || now - (activePlayers[room.hostId]?.lastPing || 0) > 30000)) {
          const newHostId = playerIds[0];
          if (newHostId === localPlayerId) {
            updateDoc(roomRef, {
              hostId: newHostId,
              [`players.${newHostId}.isHost`]: true,
              players: activePlayers,
              lastUpdated: Date.now()
            }).catch(() => {});
          }
        } else if (cleanedAny && room.hostId === localPlayerId) {
          // If we are host, persist cleaned players list
          updateDoc(roomRef, {
            players: activePlayers,
            lastUpdated: Date.now()
          }).catch(() => {});
        }

        room.players = activePlayers;
        onUpdate(room);
      }, () => {
        onError('Connection interrupted. Reconnecting...');
      });
    } catch {
      onError('Real-time synchronization error.');
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
        const roomRef = doc(db, 'backrooms_rooms', roomCode);
        await updateDoc(roomRef, {
          [`players.${playerId}.lastPing`]: Date.now()
        });
      } catch {}
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Set Player Ready state (Synchronized to all players)
  public async setPlayerReady(roomCode: string, playerId: string, isReady: boolean) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].isReady = isReady;
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.isReady`]: isReady,
        [`players.${playerId}.lastPing`]: Date.now(),
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.warn('Failed to set ready:', err);
    }
  }

  // Set Player Color
  public async setPlayerColor(roomCode: string, playerId: string, color: HazmatColor) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].color = color;
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.color`]: color,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Set Player Callsign Name
  public async setPlayerName(roomCode: string, playerId: string, name: string) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].name = name;
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.name`]: name,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Sync Player Movement Transform
  public async syncPlayerTransform(
    roomCode: string,
    playerId: string,
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    flashlightOn: boolean,
    health: number,
    sanity: number,
    battery: number
  ) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      const p = this.localRoomState.players[playerId];
      p.x = x; p.y = y; p.z = z; p.yaw = yaw; p.pitch = pitch;
      p.flashlightOn = flashlightOn; p.health = health; p.sanity = sanity; p.battery = battery;
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.x`]: x,
        [`players.${playerId}.y`]: y,
        [`players.${playerId}.z`]: z,
        [`players.${playerId}.yaw`]: yaw,
        [`players.${playerId}.pitch`]: pitch,
        [`players.${playerId}.flashlightOn`]: flashlightOn,
        [`players.${playerId}.health`]: health,
        [`players.${playerId}.sanity`]: sanity,
        [`players.${playerId}.battery`]: battery,
        [`players.${playerId}.lastPing`]: Date.now()
      });
    } catch {}
  }

  // Start Expedition (Host only)
  public async startExpedition(roomCode: string) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.phase = 'EXPLORATION';
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        phase: 'EXPLORATION',
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Toggle Door State
  public async toggleDoor(roomCode: string, doorId: string, isOpen: boolean) {
    if (this.isOfflineMode && this.localRoomState) {
      if (this.localRoomState.doors[doorId]) {
        this.localRoomState.doors[doorId].isOpen = isOpen;
      }
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`doors.${doorId}.isOpen`]: isOpen,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Pick up World Item
  public async collectItem(roomCode: string, itemId: string) {
    if (this.isOfflineMode && this.localRoomState) {
      if (this.localRoomState.items[itemId]) {
        this.localRoomState.items[itemId].collected = true;
      }
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`items.${itemId}.collected`]: true,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Place Wall Mark (Chalk)
  public async placeWallMark(roomCode: string, mark: WallMark) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.wallMarks[mark.id] = mark;
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`wallMarks.${mark.id}`]: mark,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Send Radio Walkie-Talkie message
  public async broadcastRadio(roomCode: string, message: RadioMessage) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.radioMessages.push(message);
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const r = snap.data() as BackroomsRoomState;

      const msgs = [...(r.radioMessages || []), message];
      await updateDoc(roomRef, {
        radioMessages: msgs.slice(-35),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Transition to Next Level
  public async transitionLevel(roomCode: string, nextLevel: number) {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;

    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.currentLevel = nextLevel;
      this.localRoomState.seed = newSeed;
      this.localRoomState.doors = {};
      this.localRoomState.items = {};
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        currentLevel: nextLevel,
        seed: newSeed,
        doors: {},
        items: {},
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Mark Player Death
  public async recordPlayerDeath(roomCode: string, playerId: string) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].isAlive = false;
      return;
    }

    try {
      const roomRef = doc(db, 'backrooms_rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.isAlive`]: false,
        lastUpdated: Date.now()
      });
    } catch {}
  }
}

export const backroomsNet = new BackroomsNetManager();
