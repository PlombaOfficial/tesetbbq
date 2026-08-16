export type BlockId = number;

export interface BlockDef {
  id: BlockId;
  name: string;
  hardness: number; // Seconds to break with hand
  bestTool: 'pickaxe' | 'axe' | 'shovel' | 'none';
  minToolTier: number; // 0=Hand, 1=Wood, 2=Stone, 3=Ironite, 4=Cobalt, 5=Prism
  isSolid: boolean;
  isTransparent: boolean;
  isLiquid: boolean;
  lightEmission: number; // 0-15
  dropItem: string;
  dropCount: number;
  textureIndices: {
    top: number;
    bottom: number;
    side: number;
  };
}

export type ItemCategory = 'block' | 'tool' | 'weapon' | 'armor' | 'material' | 'consumable' | 'automation';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  maxStack: number;
  placeBlockId?: BlockId;
  toolType?: 'pickaxe' | 'axe' | 'shovel' | 'sword' | 'bow';
  toolTier?: number;
  damage?: number;
  miningSpeed?: number;
  durability?: number;
  armorValue?: number;
  healAmount?: number;
  hungerAmount?: number;
}

export interface InventorySlot {
  itemId: string | null;
  count: number;
  durability?: number;
}

export interface CraftingRecipe {
  id: string;
  resultItemId: string;
  resultCount: number;
  category: 'tools' | 'blocks' | 'weapons' | 'automation' | 'survival';
  stationRequired: 'hand' | 'workbench' | 'forge' | 'assembler';
  ingredients: Array<{ itemId: string; count: number }>;
}

export type BiomeType = 
  | 'verdant_plains' 
  | 'redwood_forest' 
  | 'scorched_dunes' 
  | 'frosted_peaks' 
  | 'bioluminescent_marsh' 
  | 'astral_chasm';

export interface VoxelPlayer {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number; // 0-20 (10 hearts)
  hunger: number; // 0-20
  selectedSlot: number; // 0-8
  lastPing: number;
}

export interface MobState {
  id: string;
  type: 'boar' | 'golem' | 'crawler' | 'lurker' | 'boss_titan';
  name: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  health: number;
  maxHealth: number;
  state: 'idle' | 'wandering' | 'chasing' | 'attacking';
  targetPlayerId?: string | null;
}

export interface WorldDeltaBlock {
  x: number;
  y: number;
  z: number;
  blockId: BlockId;
}

export interface VoxelRoomState {
  roomCode: string;
  hostId: string;
  worldName: string;
  seed: number;
  gameTime: number; // 0 to 24000 ticks
  phase: 'LOBBY' | 'PLAYING';
  players: Record<string, VoxelPlayer>;
  modifiedBlocks: Record<string, number>; // key: "x,y,z" => blockId
  mobs: Record<string, MobState>;
  chatMessages: Array<{
    id: string;
    sender: string;
    text: string;
    color: string;
    timestamp: number;
  }>;
  lastUpdated: number;
}
