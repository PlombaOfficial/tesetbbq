export type PlayerRole = 'operator' | 'analyst' | 'engineer' | 'recon' | 'support';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  title: string;
  level: number;
  rep: number;
  role: PlayerRole;
  isReady: boolean;
  isHost: boolean;
  lastPing: number;
  currentAction?: string;
  activeNodeId?: string | null;
  selectedRigId: string;
  selectedTools: string[];
}

export type OperationDifficulty = 'novice' | 'intermediate' | 'advanced' | 'black_ops' | 'story';

export interface OperationTarget {
  id: string;
  title: string;
  organization: string;
  category: 'small' | 'medium' | 'large' | 'story';
  difficulty: OperationDifficulty;
  recommendedRole?: PlayerRole;
  requiredRep: number;
  baseReward: number;
  bonusReward: number;
  baseXp: number;
  baseRep: number;
  description: string;
  loreSnippet: string;
  storyChapter?: number;
  securityType: 'Standard Firewall' | 'Adaptive AI Sentinel' | 'Quantum Encryption' | 'Military Grade ICE' | 'Zero-Trust Mesh';
  traceSpeedMultiplier: number;
  nodeCount: number;
  isStoryMission?: boolean;
}

export type NodeType = 
  | 'gateway' 
  | 'router' 
  | 'firewall' 
  | 'auth_server' 
  | 'database' 
  | 'mainframe' 
  | 'vault' 
  | 'honeypot' 
  | 'audit_node'
  | 'sentinel_relay';

export type NodeStatus = 'locked' | 'accessible' | 'in_progress' | 'breached' | 'hardened' | 'honey_triggered';

export type PuzzleType = 'cipher_matrix' | 'frequency_tuner' | 'logic_circuit' | 'packet_stream' | 'terminal_exploit';

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  securityLevel: number; // 1 to 5
  puzzleType: PuzzleType;
  x: number; // 0-100 percentage for UI rendering
  y: number; // 0-100 percentage for UI rendering
  connectedTo: string[]; // array of node IDs
  lockedUntil: string[]; // prerequisite node IDs needed before this can be probed
  currentHackerId?: string | null;
  currentHackerName?: string | null;
  hackProgress: number; // 0-100%
  dataReward?: number;
  intelPayload?: string;
  isSecondaryObjective?: boolean;
  isCriticalObjective?: boolean;
}

export type RoomPhase = 'LOBBY' | 'PREPARATION' | 'INFILTRATION' | 'EXTRACTION' | 'RESULTS';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: PlayerRole;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  type?: 'chat' | 'ping' | 'breach' | 'alert' | 'extract';
}

export interface SecurityEvent {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  timestamp: number;
}

export interface OperationState {
  targetId: string;
  targetInfo: OperationTarget;
  startTime: number;
  nodes: Record<string, NetworkNode>;
  traceLevel: number; // 0 to 100
  isLockdownActive: boolean;
  lockdownTimer?: number; // seconds left when 100% reached
  dataExtracted: number;
  criticalBreached: boolean;
  securityEvents: SecurityEvent[];
  claimedBy: Record<string, boolean>; // Idempotent reward keys
  payoutSummary?: {
    credits: number;
    xp: number;
    rep: number;
    stealthMultiplier: number;
    teamPerformance: number;
    dataLoot: string[];
  };
}

export interface RoomData {
  roomCode: string;
  hostId: string;
  phase: RoomPhase;
  createdAt: number;
  lastUpdated: number;
  players: Record<string, Player>;
  selectedOperation: OperationTarget | null;
  operationState: OperationState | null;
  chatMessages: ChatMessage[];
  countdown?: number | null;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: 'rig' | 'cpu' | 'ram' | 'uplink' | 'cooling';
  tier: number;
  price: number;
  requiredRep: number;
  description: string;
  stats: {
    bandwidth: number; // for equipping tools
    stealthBonus: number; // reduces trace generation %
    hackSpeedBonus: number; // increases hack efficiency %
    heatDissipation: number; // cooling / stability
  };
  iconName: string;
}

export interface SoftwareTool {
  id: string;
  name: string;
  code: string;
  tier: number;
  price: number;
  bandwidthCost: number;
  requiredRep: number;
  description: string;
  effectDescription: string;
  roleAffinity?: PlayerRole;
  cooldownSeconds: number;
  iconName: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCredits: number;
  rewardXp: number;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface PlayerStats {
  operationsStarted: number;
  operationsCompleted: number;
  operationsFailed: number;
  totalCreditsEarned: number;
  nodesBreached: number;
  stealthRuns: number;
  lockdownEscapes: number;
  toolsUsed: number;
  playTimeMinutes: number;
  favoriteRole: PlayerRole;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  credits: number;
  rep: number;
  ownedHardware: string[]; // IDs
  ownedTools: string[]; // IDs
  equippedRig: string;
  equippedCpu: string;
  equippedRam: string;
  equippedUplink: string;
  equippedCooling: string;
  equippedTools: string[];
  unlockedIntel: string[]; // Intel log IDs
  stats: PlayerStats;
  achievements: Record<string, boolean>;
  settings: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    crtEffect: boolean;
    screenShake: boolean;
    highContrast: boolean;
  };
}
