export type HazmatColor = '#eab308' | '#06b6d4' | '#f97316' | '#10b981' | '#ec4899' | '#8b5cf6' | '#f43f5e';

export interface BackroomsPlayer {
  id: string;
  name: string;
  color: HazmatColor;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  flashlightOn: boolean;
  currentLevel: number;
  health: number; // 0-100
  sanity: number; // 0-100
  battery: number; // 0-100%
  activeItem: string | null;
  lastPing: number;
  spectatingPlayerId?: string | null;
}

export type ItemType = 
  | 'flashlight' 
  | 'battery' 
  | 'almond_water' 
  | 'walkie_talkie' 
  | 'chalk' 
  | 'flare' 
  | 'master_key' 
  | 'fuse' 
  | 'scanner';

export interface WorldItem {
  id: string;
  type: ItemType;
  name: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  levelIndex: number;
}

export interface WallMark {
  id: string;
  x: number;
  y: number;
  z: number;
  normalX: number;
  normalZ: number;
  symbol: 'arrow' | 'cross' | 'help' | 'exit';
  color: string;
  levelIndex: number;
}

export interface DoorState {
  id: string;
  isOpen: boolean;
  isLocked: boolean;
  requiredKeyType?: string;
  levelIndex: number;
}

export type EntityType = 'listener' | 'mimic' | 'stalker' | 'smiler';

export interface EntityState {
  id: string;
  type: EntityType;
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  state: 'idle' | 'wandering' | 'investigating' | 'stalking' | 'hunting';
  targetPlayerId?: string | null;
  levelIndex: number;
}

export interface RadioMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  frequency: number; // e.g. 104.5 MHz
  isGlitch?: boolean;
}

export interface BackroomsRoomState {
  roomCode: string;
  hostId: string;
  seed: number;
  currentLevel: number;
  phase: 'LOBBY' | 'EXPLORATION' | 'COLLAPSE' | 'VICTORY';
  players: Record<string, BackroomsPlayer>;
  doors: Record<string, DoorState>;
  items: Record<string, WorldItem>;
  wallMarks: Record<string, WallMark>;
  entities: Record<string, EntityState>;
  radioMessages: RadioMessage[];
  elevatorUnlocked: boolean;
  lastUpdated: number;
}

export interface LevelDefinition {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  survivalClass: 'Class 0 (Safe)' | 'Class 1 (Habitable)' | 'Class 2 (Insecure)' | 'Class 3 (Unsafe)' | 'Class 4 (Hazardous)' | 'Class 5 (Deadly)' | 'Class Unknown';
  wallTextureType: 'yellow_wallpaper' | 'concrete' | 'pipe_corridor' | 'industrial_brick' | 'office_panel' | 'hotel_wallpaper' | 'pitch_black';
  floorTextureType: 'damp_carpet' | 'wet_concrete' | 'grated_metal' | 'tiled_floor' | 'hotel_carpet' | 'void';
  ceilingTextureType: 'acoustic_tiles' | 'concrete_slab' | 'pipes_ceiling' | 'hotel_ceiling' | 'darkness';
  ambientColor: string;
  fogColor: string;
  fogDensity: number;
  ceilingHeight: number;
  dronePitch: number; // Hz for ambient sound
  hasWaterPuddles: boolean;
  entitiesAllowed: EntityType[];
  anomalyFrequency: number; // 0-1
  exitCondition: 'find_elevator' | 'fuse_puzzle' | 'valve_sequence' | 'darkness_leap';
}
