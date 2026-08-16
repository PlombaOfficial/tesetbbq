export type TileId = number;

export interface TileDef {
  id: TileId;
  name: string;
  hardness: number; // Breaking duration in seconds
  bestTool: 'pickaxe' | 'axe' | 'hammer' | 'none';
  minToolTier: number;
  isSolid: boolean;
  isPlatform: boolean; // One-way platform (can drop down)
  isDoor: boolean;
  isOpenDoor?: boolean;
  isChest: boolean;
  isWorkbench: boolean;
  isFurnace: boolean;
  isAnvil: boolean;
  isLadder: boolean;
  lightEmission: number; // 0 - 15
  color: string;
  accentColor?: string;
  dropItemId: string;
  dropCount: number;
}

export type ItemCategory = 'tile' | 'wall' | 'tool' | 'weapon' | 'armor' | 'material' | 'consumable' | 'furniture';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  maxStack: number;
  placeTileId?: TileId;
  placeWallId?: TileId;
  toolType?: 'pickaxe' | 'axe' | 'hammer' | 'sword' | 'bow';
  toolTier?: number;
  damage?: number;
  miningSpeed?: number;
  armorValue?: number;
  healAmount?: number;
  staminaAmount?: number;
}

export interface InventorySlot {
  itemId: string | null;
  count: number;
}

export interface CraftingRecipe2D {
  id: string;
  resultItemId: string;
  resultCount: number;
  category: 'tools' | 'weapons' | 'tiles' | 'furniture' | 'armor' | 'survival';
  stationRequired: 'hand' | 'workbench' | 'furnace' | 'anvil';
  ingredients: Array<{ itemId: string; count: number }>;
}

export interface ChestData {
  id: string;
  x: number;
  y: number;
  items: InventorySlot[];
}

export interface PlatformerPlayer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  x: number; // Tile units
  y: number;
  vx: number;
  vy: number;
  facingLeft: boolean;
  isGrounded: boolean;
  isClimbing: boolean;
  health: number; // 0 - 100
  maxHealth: number;
  stamina: number; // 0 - 100
  selectedSlot: number; // 0 - 8
  lastPing: number;
  toolSwingProgress: number; // 0 - 1.0 for attack animation
}

export interface MobEntity {
  id: string;
  type: 'boar' | 'slime' | 'crawler' | 'bat' | 'guardian' | 'boss_titan';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  damage: number;
  facingLeft: boolean;
  isGrounded: boolean;
  state: 'idle' | 'patrol' | 'chase' | 'attack';
  targetPlayerId?: string | null;
}

export interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface SavedWorld {
  id: string;
  name: string;
  seed: number;
  gameTime: number;
  lastSaved: number;
  modifiedTiles: Record<string, number>; // "x,y" => TileId (0 for air)
  modifiedWalls: Record<string, number>; // "x,y" => WallId (0 for no wall)
  chests: Record<string, ChestData>;
  playerState: {
    x: number;
    y: number;
    health: number;
    stamina: number;
    inventory: InventorySlot[];
    hotbar: InventorySlot[];
    selectedSlot: number;
  };
}

export interface PlatformerRoomState {
  roomCode: string;
  hostId: string;
  worldName: string;
  seed: number;
  gameTime: number; // 0 to 24000
  phase: 'LOBBY' | 'PLAYING';
  players: Record<string, PlatformerPlayer>;
  modifiedTiles: Record<string, number>;
  modifiedWalls: Record<string, number>;
  chests: Record<string, ChestData>;
  mobs: Record<string, MobEntity>;
  chatMessages: Array<{
    id: string;
    sender: string;
    text: string;
    color: string;
    timestamp: number;
  }>;
  lastUpdated: number;
}
