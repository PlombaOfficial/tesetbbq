import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  deleteDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  RoomData, 
  Player, 
  PlayerRole, 
  OperationTarget, 
  ChatMessage, 
  SecurityEvent,
  NetworkNode
} from '../types/game';
import { generateNetworkTopology } from '../game/networkGenerator';
import { playerStore } from '../progression/playerStore';
import { SOFTWARE_TOOLS } from '../data/arsenalData';

export class RoomManager {
  private currentUnsubscribe: Unsubscribe | null = null;
  private heartbeatTimer: number | null = null;
  private localRoomState: RoomData | null = null;
  private isOfflineMode: boolean = false;

  // Generate 6-char clean alphanumeric room code (e.g. CYBER8)
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new multiplayer room in Firestore
  public async createRoom(hostPlayer: Player, defaultOperation?: OperationTarget): Promise<RoomData> {
    const roomCode = this.generateRoomCode();
    const newRoom: RoomData = {
      roomCode,
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      players: {
        [hostPlayer.id]: {
          ...hostPlayer,
          isHost: true,
          isReady: true,
          lastPing: Date.now()
        }
      },
      selectedOperation: defaultOperation || null,
      operationState: null,
      chatMessages: [
        {
          id: 'sys_init_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: 'CYBERNET_AI',
          text: `Encrypted network operational room [${roomCode}] initialized. Share this code with your team.`,
          timestamp: Date.now(),
          isSystem: true,
          type: 'chat'
        }
      ],
      countdown: null
    };

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await setDoc(roomRef, newRoom);
      this.isOfflineMode = false;
    } catch (err) {
      console.warn('Firestore room creation failed, falling back to local session:', err);
      this.isOfflineMode = true;
      this.localRoomState = newRoom;
    }

    return newRoom;
  }

  // Join an existing room
  public async joinRoom(roomCode: string, player: Player): Promise<{ success: boolean; error?: string; room?: RoomData }> {
    const cleanCode = roomCode.trim().toUpperCase();

    if (this.isOfflineMode && this.localRoomState && this.localRoomState.roomCode === cleanCode) {
      this.localRoomState.players[player.id] = {
        ...player,
        isHost: false,
        isReady: false,
        lastPing: Date.now()
      };
      return { success: true, room: this.localRoomState };
    }

    try {
      const roomRef = doc(db, 'rooms', cleanCode);
      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        return { success: false, error: 'Room not found. Check the code and try again.' };
      }

      const room = snapshot.data() as RoomData;
      const playerCount = Object.keys(room.players || {}).length;

      // Reconnect check: if player already in list, allow rejoin
      if (!room.players[player.id] && playerCount >= 5) {
        return { success: false, error: 'Room is at maximum capacity (5 players).' };
      }

      // Check if room is already deep in operation
      if (room.phase === 'RESULTS') {
        return { success: false, error: 'Operation has already concluded. Wait for the team to return to lobby.' };
      }

      const updatedPlayers = {
        ...room.players,
        [player.id]: {
          ...player,
          isHost: room.hostId === player.id || playerCount === 0,
          isReady: false,
          lastPing: Date.now()
        }
      };

      const joinMsg: ChatMessage = {
        id: 'msg_join_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: 'CYBERNET_AI',
        text: `Operative [${player.name}] joined the uplink.`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'chat'
      };

      await updateDoc(roomRef, {
        players: updatedPlayers,
        lastUpdated: Date.now(),
        chatMessages: [...(room.chatMessages || []).slice(-40), joinMsg]
      });

      return { success: true, room };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join room';
      return { success: false, error: errorMsg };
    }
  }

  // Subscribe to real-time room updates with host migration & heartbeat
  public subscribeToRoom(
    roomCode: string, 
    localPlayerId: string,
    onUpdate: (room: RoomData) => void,
    onError: (err: string) => void
  ): () => void {
    if (this.currentUnsubscribe) {
      this.currentUnsubscribe();
    }

    const cleanCode = roomCode.trim().toUpperCase();

    // Start local player heartbeat ping
    this.startHeartbeat(cleanCode, localPlayerId);

    if (this.isOfflineMode) {
      const interval = window.setInterval(() => {
        if (this.localRoomState) {
          onUpdate({ ...this.localRoomState });
        }
      }, 500);
      return () => {
        clearInterval(interval);
        this.stopHeartbeat();
      };
    }

    try {
      const roomRef = doc(db, 'rooms', cleanCode);
      this.currentUnsubscribe = onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
          onError('The room was closed or no longer exists.');
          return;
        }

        const room = snapshot.data() as RoomData;

        // Perform Host Migration if current host is missing or disconnected
        const playerIds = Object.keys(room.players || {});
        if (playerIds.length > 0 && (!room.players[room.hostId] || Date.now() - (room.players[room.hostId]?.lastPing || 0) > 45000)) {
          // Elect first active player as host
          const nextHostId = playerIds[0];
          if (nextHostId === localPlayerId) {
            updateDoc(roomRef, {
              hostId: nextHostId,
              [`players.${nextHostId}.isHost`]: true,
              lastUpdated: Date.now()
            }).catch(() => {});
          }
        }

        onUpdate(room);
      }, (err) => {
        console.warn('Firestore subscription error:', err);
        onError('Network connection interrupted. Retrying...');
      });
    } catch (err) {
      console.warn('Subscription failed:', err);
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

  // Heartbeat ping every 10 seconds
  private startHeartbeat(roomCode: string, playerId: string) {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(async () => {
      if (this.isOfflineMode) {
        if (this.localRoomState && this.localRoomState.players[playerId]) {
          this.localRoomState.players[playerId].lastPing = Date.now();
        }
        return;
      }

      try {
        const roomRef = doc(db, 'rooms', roomCode);
        await updateDoc(roomRef, {
          [`players.${playerId}.lastPing`]: Date.now()
        });
      } catch {
        // Silent heartbeat fail
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Leave room gracefully
  public async leaveRoom(roomCode: string, playerId: string) {
    this.stopHeartbeat();
    if (this.currentUnsubscribe) {
      this.currentUnsubscribe();
      this.currentUnsubscribe = null;
    }

    if (this.isOfflineMode && this.localRoomState) {
      delete this.localRoomState.players[playerId];
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snapshot = await getDoc(roomRef);
      if (!snapshot.exists()) return;

      const room = snapshot.data() as RoomData;
      const updatedPlayers = { ...room.players };
      delete updatedPlayers[playerId];

      const remainingIds = Object.keys(updatedPlayers);
      if (remainingIds.length === 0) {
        await deleteDoc(roomRef);
      } else {
        const newHostId = room.hostId === playerId ? remainingIds[0] : room.hostId;
        if (updatedPlayers[newHostId]) {
          updatedPlayers[newHostId].isHost = true;
        }

        const leaveMsg: ChatMessage = {
          id: 'msg_leave_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: 'CYBERNET_AI',
          text: `Operative disconnected from uplink.`,
          timestamp: Date.now(),
          isSystem: true,
          type: 'chat'
        };

        await updateDoc(roomRef, {
          players: updatedPlayers,
          hostId: newHostId,
          lastUpdated: Date.now(),
          chatMessages: [...(room.chatMessages || []).slice(-40), leaveMsg]
        });
      }
    } catch {
      // Ignored
    }
  }

  // Ready / Role changes
  public async setPlayerReady(roomCode: string, playerId: string, isReady: boolean) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].isReady = isReady;
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.isReady`]: isReady,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  public async setPlayerRole(roomCode: string, playerId: string, role: PlayerRole) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.players[playerId]) {
      this.localRoomState.players[playerId].role = role;
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}.role`]: role,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  public async setSelectedOperation(roomCode: string, op: OperationTarget) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.selectedOperation = op;
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        selectedOperation: op,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Launch Operation (Host only)
  public async launchOperation(roomCode: string, target: OperationTarget) {
    const nodes = generateNetworkTopology(target);

    const initialOpState = {
      targetId: target.id,
      targetInfo: target,
      startTime: Date.now(),
      nodes,
      traceLevel: 0,
      isLockdownActive: false,
      dataExtracted: 0,
      criticalBreached: false,
      securityEvents: [
        {
          id: 'sec_01',
          title: 'Perimeter Breached',
          message: `Infiltration initiated into ${target.organization} subnet. Gateway exposed.`,
          severity: 'info' as const,
          timestamp: Date.now()
        }
      ],
      claimedBy: {}
    };

    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.phase = 'INFILTRATION';
      this.localRoomState.operationState = initialOpState;
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        phase: 'INFILTRATION',
        operationState: initialOpState,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Node Hack Progress update
  public async updateNodeHackProgress(
    roomCode: string, 
    nodeId: string, 
    progress: number, 
    hackerId: string, 
    hackerName: string,
    isBreached: boolean
  ) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.operationState) {
      const node = this.localRoomState.operationState.nodes[nodeId];
      if (node) {
        node.hackProgress = progress;
        node.currentHackerId = hackerId;
        node.currentHackerName = hackerName;
        if (isBreached) {
          node.status = 'breached';
          if (node.isCriticalObjective) {
            this.localRoomState.operationState.criticalBreached = true;
          }
          this.localRoomState.operationState.dataExtracted += node.dataReward || 200;
          this.unlockAdjacentNodes(this.localRoomState.operationState.nodes, nodeId);
        }
      }
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snapshot = await getDoc(roomRef);
      if (!snapshot.exists()) return;

      const room = snapshot.data() as RoomData;
      if (!room.operationState || !room.operationState.nodes[nodeId]) return;

      const updatedNodes = { ...room.operationState.nodes };
      const node = { ...updatedNodes[nodeId] };

      node.hackProgress = progress;
      node.currentHackerId = hackerId;
      node.currentHackerName = hackerName;

      let criticalBreached = room.operationState.criticalBreached;
      let dataExtracted = room.operationState.dataExtracted;
      const securityEvents = [...room.operationState.securityEvents];

      if (isBreached) {
        node.status = 'breached';
        if (node.isCriticalObjective) {
          criticalBreached = true;
          securityEvents.push({
            id: 'evt_' + Date.now(),
            title: 'Critical Objective Extracted',
            message: `Primary mainframe core successfully decrypted by ${hackerName}!`,
            severity: 'warning',
            timestamp: Date.now()
          });
        }

        dataExtracted += node.dataReward || 200;
        this.unlockAdjacentNodes(updatedNodes, nodeId);
      }

      updatedNodes[nodeId] = node;

      await updateDoc(roomRef, {
        'operationState.nodes': updatedNodes,
        'operationState.criticalBreached': criticalBreached,
        'operationState.dataExtracted': dataExtracted,
        'operationState.securityEvents': securityEvents.slice(-20),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  private unlockAdjacentNodes(nodes: Record<string, NetworkNode>, breachedNodeId: string) {
    const breachedNode = nodes[breachedNodeId];
    if (!breachedNode) return;

    breachedNode.connectedTo.forEach((targetId) => {
      const targetNode = nodes[targetId];
      if (targetNode && targetNode.status === 'locked') {
        const allPrereqsMet = targetNode.lockedUntil.every((prereqId) => nodes[prereqId]?.status === 'breached');
        if (allPrereqsMet) {
          targetNode.status = 'accessible';
        }
      }
    });
  }

  // Adjust Trace Level and trigger alarm events
  public async adjustTrace(roomCode: string, delta: number, reason?: string) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.operationState) {
      const cur = this.localRoomState.operationState.traceLevel;
      const next = Math.max(0, Math.min(100, cur + delta));
      this.localRoomState.operationState.traceLevel = next;
      if (next >= 100 && !this.localRoomState.operationState.isLockdownActive) {
        this.localRoomState.operationState.isLockdownActive = true;
      }
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;

      const room = snap.data() as RoomData;
      if (!room.operationState) return;

      const cur = room.operationState.traceLevel;
      const next = Math.max(0, Math.min(100, cur + delta));
      const isLockdown = next >= 100 || room.operationState.isLockdownActive;

      const events = [...room.operationState.securityEvents];
      if (next >= 100 && !room.operationState.isLockdownActive) {
        events.push({
          id: 'sec_lockdown_' + Date.now(),
          title: 'SYSTEM LOCKDOWN INITIATED',
          message: 'Security AI has detected intrusion vector. Emergency extraction recommended immediately!',
          severity: 'danger',
          timestamp: Date.now()
        });
      } else if (reason) {
        events.push({
          id: 'sec_trace_' + Date.now(),
          title: delta > 0 ? 'Security Anomaly' : 'Trace Suppressed',
          message: reason,
          severity: delta > 0 ? 'warning' : 'info',
          timestamp: Date.now()
        });
      }

      await updateDoc(roomRef, {
        'operationState.traceLevel': next,
        'operationState.isLockdownActive': isLockdown,
        'operationState.securityEvents': events.slice(-20),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Use Arsenal Software Tool
  public async useTool(roomCode: string, _playerId: string, playerName: string, toolId: string) {
    const tool = SOFTWARE_TOOLS.find((t) => t.id === toolId);
    if (!tool) return;

    playerStore.recordToolUsed();

    if (tool.id === 'tool_ghost_proxy' || tool.id === 'tool_audit_scrub') {
      await this.adjustTrace(roomCode, -20, `${playerName} deployed ${tool.name} (-20% Trace).`);
    } else if (tool.id === 'tool_overclock_daemon') {
      await this.postSecurityEvent(roomCode, {
        id: 'buff_' + Date.now(),
        title: 'Neural Bus Overclocked',
        message: `${playerName} activated ${tool.name}. Team hack speed boosted +50%!`,
        severity: 'info',
        timestamp: Date.now()
      });
    } else if (tool.id === 'tool_ice_shatter') {
      await this.postSecurityEvent(roomCode, {
        id: 'buff_' + Date.now(),
        title: 'ICE Scrambled',
        message: `${playerName} executed ${tool.name}. Sentinel sweeps disabled!`,
        severity: 'info',
        timestamp: Date.now()
      });
    }
  }

  public async postSecurityEvent(roomCode: string, event: SecurityEvent) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.operationState) {
      this.localRoomState.operationState.securityEvents.push(event);
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as RoomData;
      if (!room.operationState) return;

      const events = [...(room.operationState.securityEvents || []), event];
      await updateDoc(roomRef, {
        'operationState.securityEvents': events.slice(-20),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Send Team Chat
  public async sendChatMessage(roomCode: string, message: ChatMessage) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.chatMessages.push(message);
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as RoomData;

      const msgs = [...(room.chatMessages || []), message];
      await updateDoc(roomRef, {
        chatMessages: msgs.slice(-50),
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Complete & Extract Operation (Calculates Payout idempotently)
  public async finishOperation(roomCode: string, isSuccess: boolean) {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.operationState) {
      const op = this.localRoomState.operationState;
      const stealthMult = op.traceLevel < 30 ? 1.5 : op.traceLevel < 60 ? 1.2 : 1.0;
      const teamPerf = Math.min(100, Math.round((op.dataExtracted / (op.targetInfo.baseReward + 500)) * 100));

      const payout = {
        credits: Math.round((op.dataExtracted + (isSuccess ? op.targetInfo.baseReward : 0)) * stealthMult),
        xp: Math.round((op.targetInfo.baseXp + (isSuccess ? 300 : 50)) * stealthMult),
        rep: isSuccess ? op.targetInfo.baseRep : 1,
        stealthMultiplier: stealthMult,
        teamPerformance: teamPerf,
        dataLoot: op.criticalBreached ? [op.targetInfo.title + ' Core Archive'] : []
      };

      this.localRoomState.phase = 'RESULTS';
      this.localRoomState.operationState.payoutSummary = payout;
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as RoomData;
      if (!room.operationState) return;

      const op = room.operationState;
      const stealthMult = op.traceLevel < 30 ? 1.5 : op.traceLevel < 60 ? 1.2 : 1.0;
      const teamPerf = Math.min(100, Math.round((op.dataExtracted / (op.targetInfo.baseReward + 500)) * 100));

      const payout = {
        credits: Math.round((op.dataExtracted + (isSuccess ? op.targetInfo.baseReward : 0)) * stealthMult),
        xp: Math.round((op.targetInfo.baseXp + (isSuccess ? 300 : 50)) * stealthMult),
        rep: isSuccess ? op.targetInfo.baseRep : 1,
        stealthMultiplier: stealthMult,
        teamPerformance: teamPerf,
        dataLoot: op.criticalBreached ? [op.targetInfo.title + ' Core Archive'] : []
      };

      await updateDoc(roomRef, {
        phase: 'RESULTS',
        'operationState.payoutSummary': payout,
        lastUpdated: Date.now()
      });
    } catch {}
  }

  // Claim payout once per player (prevents double payout)
  public async claimPayout(roomCode: string, playerId: string): Promise<boolean> {
    if (this.isOfflineMode && this.localRoomState && this.localRoomState.operationState) {
      if (this.localRoomState.operationState.claimedBy[playerId]) return false;
      this.localRoomState.operationState.claimedBy[playerId] = true;
      const p = this.localRoomState.operationState.payoutSummary;
      if (p) {
        playerStore.addRewards(p.credits, p.xp, p.rep);
      }
      return true;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return false;
      const room = snap.data() as RoomData;
      if (!room.operationState || !room.operationState.payoutSummary) return false;

      if (room.operationState.claimedBy[playerId]) {
        return false;
      }

      const p = room.operationState.payoutSummary;
      playerStore.addRewards(p.credits, p.xp, p.rep);

      await updateDoc(roomRef, {
        [`operationState.claimedBy.${playerId}`]: true
      });
      return true;
    } catch {
      return false;
    }
  }

  // Return from Results back to Lobby
  public async returnToLobby(roomCode: string) {
    if (this.isOfflineMode && this.localRoomState) {
      this.localRoomState.phase = 'LOBBY';
      this.localRoomState.operationState = null;
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        phase: 'LOBBY',
        operationState: null,
        lastUpdated: Date.now()
      });
    } catch {}
  }
}

export const roomManager = new RoomManager();
