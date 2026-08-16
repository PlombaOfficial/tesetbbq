import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { ClashRoomState, Faction, MapType } from '../types/pvpClash';

export class ClashNetManager {
  private currentUnsubscribe: Unsubscribe | null = null;
  private localRoomState: ClashRoomState | null = null;
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
  public async createRoom(
    hostId: string,
    hostName: string,
    hostColor: string,
    worldName: string = 'CLASH ARENA',
    map: MapType = 'verdant_grove'
  ): Promise<ClashRoomState> {
    const roomCode = this.generateCode();

    const initialRoom: ClashRoomState = {
      roomCode,
      hostId,
      guestId: null,
      worldName,
      map,
      phase: 'LOBBY',
      roles: {},
      playerNames: { [hostId]: hostName },
      playerColors: { [hostId]: hostColor },
      plantDeck: [
        'plant_sunsprout',
        'plant_peablaster',
        'plant_thornnut',
        'plant_frostwillow',
        'plant_spikemoss',
        'plant_cherrybomb',
        'plant_plasmaorchid',
        'plant_chomper'
      ],
      zombieDeck: [
        'zomb_walker',
        'zomb_buckethead',
        'zomb_imprunner',
        'zomb_polevault',
        'zomb_miner',
        'zomb_necromancer',
        'zomb_gargantuar',
        'zomb_plaguespitter'
      ],
      matchState: {
        matchTime: 0,
        plantSun: 150,
        zombieBrains: 150,
        plantBaseHp: 100,
        laneCleaners: [true, true, true, true, true],
        plants: {},
        zombies: [],
        projectiles: [],
        winner: null,
        stats: {
          plantDamage: 0,
          zombieDamage: 0,
          plantsSummoned: 0,
          zombiesSummoned: 0,
          bestLane: 2
        }
      },
      chatMessages: [
        {
          id: 'msg_init_' + Date.now(),
          sender: 'SYSTEM',
          text: `Arena ready. Share code [${roomCode}] with your opponent.`,
          color: '#10b981',
          timestamp: Date.now()
        }
      ],
      lastUpdated: Date.now()
    };

    try {
      const roomRef = doc(db, 'pvp_clash_rooms', roomCode);
      await setDoc(roomRef, initialRoom);
      this.isOfflineMode = false;
    } catch (err) {
      console.warn('Firestore fallback to local:', err);
      this.isOfflineMode = true;
      this.localRoomState = initialRoom;
    }

    return initialRoom;
  }

  // Join Room
  public async joinRoom(
    roomCode: string,
    guestId: string,
    guestName: string,
    guestColor: string
  ): Promise<{ success: boolean; error?: string; room?: ClashRoomState }> {
    const code = roomCode.trim().toUpperCase();

    if (this.isOfflineMode && this.localRoomState && this.localRoomState.roomCode === code) {
      this.localRoomState.guestId = guestId;
      this.localRoomState.playerNames[guestId] = guestName;
      this.localRoomState.playerColors[guestId] = guestColor;
      return { success: true, room: this.localRoomState };
    }

    try {
      const roomRef = doc(db, 'pvp_clash_rooms', code);
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        return { success: false, error: 'Match room not found. Check the code.' };
      }

      const room = snap.data() as ClashRoomState;
      if (room.guestId && room.guestId !== guestId) {
        return { success: false, error: 'Match room is already full (1v1).' };
      }

      const updatedNames = { ...room.playerNames, [guestId]: guestName };
      const updatedColors = { ...room.playerColors, [guestId]: guestColor };

      const joinMsg = {
        id: 'msg_' + Date.now(),
        sender: 'SYSTEM',
        text: `Opponent [${guestName}] entered the arena!`,
        color: guestColor,
        timestamp: Date.now()
      };

      await updateDoc(roomRef, {
        guestId,
        playerNames: updatedNames,
        playerColors: updatedColors,
        lastUpdated: Date.now(),
        chatMessages: [...(room.chatMessages || []).slice(-30), joinMsg]
      });

      return { success: true, room };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Join failed';
      return { success: false, error: msg };
    }
  }

  // Subscribe to Room State
  public subscribeToRoom(
    roomCode: string,
    onUpdate: (room: ClashRoomState) => void,
    onError: (err: string) => void
  ): () => void {
    if (this.currentUnsubscribe) {
      this.currentUnsubscribe();
    }

    const code = roomCode.trim().toUpperCase();

    if (this.isOfflineMode) {
      const timer = window.setInterval(() => {
        if (this.localRoomState) onUpdate({ ...this.localRoomState });
      }, 300);
      return () => clearInterval(timer);
    }

    try {
      const roomRef = doc(db, 'pvp_clash_rooms', code);
      this.currentUnsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          onError('Room closed.');
          return;
        }
        const room = snapshot.data() as ClashRoomState;
        onUpdate(room);
      }, () => {
        onError('Network error.');
      });
    } catch {
      onError('Real-time sync unavailable.');
    }

    return () => {
      if (this.currentUnsubscribe) {
        this.currentUnsubscribe();
        this.currentUnsubscribe = null;
      }
    };
  }

  // Roll Random Roles and Advance to Deck Select
  public async rollRandomRoles(roomCode: string, hostId: string, guestId: string) {
    const isHostPlants = Math.random() < 0.5;
    const roles: Record<string, Faction> = {
      [hostId]: isHostPlants ? 'PLANTS' : 'ZOMBIES',
      [guestId]: isHostPlants ? 'ZOMBIES' : 'PLANTS'
    };

    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.roles = roles;
      this.localRoomState.phase = 'ROLE_REVEAL';
      return;
    }

    try {
      const roomRef = doc(db, 'pvp_clash_rooms', roomCode);
      await updateDoc(roomRef, {
        roles,
        phase: 'ROLE_REVEAL',
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Rematch: Invert Roles & Reset Field
  public async requestRematch(roomCode: string) {
    if (this.isOfflineMode && this.localRoomState) {
      const hostId = this.localRoomState.hostId;
      const guestId = this.localRoomState.guestId || 'ai_opponent';
      const prevHostRole = this.localRoomState.roles[hostId];
      const newRoles: Record<string, Faction> = {
        [hostId]: prevHostRole === 'PLANTS' ? 'ZOMBIES' : 'PLANTS',
        [guestId]: prevHostRole === 'PLANTS' ? 'PLANTS' : 'ZOMBIES'
      };

      this.localRoomState.roles = newRoles;
      this.localRoomState.phase = 'ROLE_REVEAL';
      this.localRoomState.matchState = {
        matchTime: 0,
        plantSun: 150,
        zombieBrains: 150,
        plantBaseHp: 100,
        laneCleaners: [true, true, true, true, true],
        plants: {},
        zombies: [],
        projectiles: [],
        winner: null,
        stats: {
          plantDamage: 0,
          zombieDamage: 0,
          plantsSummoned: 0,
          zombiesSummoned: 0,
          bestLane: 2
        }
      };
      return;
    }

    try {
      const roomRef = doc(db, 'pvp_clash_rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as ClashRoomState;

      const hostId = room.hostId;
      const guestId = room.guestId!;
      const prevHostRole = room.roles[hostId];
      const newRoles: Record<string, Faction> = {
        [hostId]: prevHostRole === 'PLANTS' ? 'ZOMBIES' : 'PLANTS',
        [guestId]: prevHostRole === 'PLANTS' ? 'PLANTS' : 'ZOMBIES'
      };

      await updateDoc(roomRef, {
        roles: newRoles,
        phase: 'ROLE_REVEAL',
        matchState: {
          matchTime: 0,
          plantSun: 150,
          zombieBrains: 150,
          plantBaseHp: 100,
          laneCleaners: [true, true, true, true, true],
          plants: {},
          zombies: [],
          projectiles: [],
          winner: null,
          stats: {
            plantDamage: 0,
            zombieDamage: 0,
            plantsSummoned: 0,
            zombiesSummoned: 0,
            bestLane: 2
          }
        },
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Update Decks & Start Match
  public async submitDecksAndStart(roomCode: string, plantDeck: string[], zombieDeck: string[]) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.plantDeck = plantDeck;
      this.localRoomState.zombieDeck = zombieDeck;
      this.localRoomState.phase = 'MATCH';
      return;
    }

    try {
      const roomRef = doc(db, 'pvp_clash_rooms', roomCode);
      await updateDoc(roomRef, {
        plantDeck,
        zombieDeck,
        phase: 'MATCH',
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Send In-Game Chat
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
      const roomRef = doc(db, 'pvp_clash_rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const r = snap.data() as ClashRoomState;
      await updateDoc(roomRef, {
        chatMessages: [...(r.chatMessages || []).slice(-30), msg],
        lastUpdated: Date.now()
      });
    } catch {}
  }
}

export const clashNet = new ClashNetManager();
