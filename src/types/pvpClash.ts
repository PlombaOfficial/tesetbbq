export type Faction = 'PLANTS' | 'ZOMBIES';

export type MapType = 'verdant_grove' | 'necro_swamp' | 'bio_lab' | 'astral_wasteland';

export type TileHazard = 'none' | 'boost_speed' | 'sun_well' | 'toxic_puddle' | 'obstacle';

export interface PlantCardDef {
  id: string;
  name: string;
  description: string;
  cost: number; // Sun cost
  cooldown: number; // Seconds
  health: number;
  attackDamage: number;
  attackInterval: number; // Seconds per shot
  range: number; // Tiles or whole lane
  projectileType: 'pea' | 'frost' | 'plasma' | 'melon' | 'thorn' | 'none';
  plantRole: 'shooter' | 'sun' | 'wall' | 'slow' | 'bomb' | 'trap' | 'support' | 'special';
  color: string;
  accentColor: string;
  isInstantBomb?: boolean;
}

export interface ZombieCardDef {
  id: string;
  name: string;
  description: string;
  cost: number; // Brains cost
  cooldown: number; // Seconds
  health: number;
  speed: number; // Tiles per second (e.g. 0.6)
  biteDamage: number;
  biteInterval: number; // Seconds per bite
  armor: number; // Bonus damage reduction
  zombieRole: 'basic' | 'tank' | 'runner' | 'vault' | 'burrow' | 'ranged' | 'flying' | 'boss';
  color: string;
  accentColor: string;
  canVault?: boolean;
  canBurrow?: boolean;
  isFlying?: boolean;
}

export interface CommanderSpellDef {
  id: string;
  name: string;
  description: string;
  faction: Faction;
  cost: number;
  cooldown: number;
  color: string;
}

export interface PlantInstance {
  id: string;
  cardId: string;
  col: number; // 0 to 7
  row: number; // 0 to 4 (lane)
  health: number;
  maxHealth: number;
  lastAttackTime: number;
  boostTimer: number;
  chewTimer?: number; // For Chomper
}

export interface ZombieInstance {
  id: string;
  cardId: string;
  lane: number; // 0 to 4
  x: number; // 0.0 to 9.0 float
  health: number;
  maxHealth: number;
  speed: number;
  biteDamage: number;
  lastBiteTime: number;
  isSlowed: boolean;
  slowTimer: number;
  isVaulted?: boolean;
  isBurrowed?: boolean;
  isFlying?: boolean;
  isHypnotized?: boolean; // Moves right attacking other zombies!
}

export interface ProjectileInstance {
  id: string;
  lane: number;
  x: number; // Float
  y: number; // Row center
  vx: number;
  damage: number;
  type: 'pea' | 'frost' | 'plasma' | 'melon' | 'thorn';
  isPiercing?: boolean;
  isLobbed?: boolean;
}

export interface ParticleClash {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface ClashRoomState {
  roomCode: string;
  hostId: string;
  guestId: string | null;
  worldName: string;
  map: MapType;
  phase: 'LOBBY' | 'ROLE_REVEAL' | 'DECK_SELECT' | 'MATCH' | 'SUMMARY';
  roles: Record<string, Faction>; // playerId -> 'PLANTS' | 'ZOMBIES'
  playerNames: Record<string, string>;
  playerColors: Record<string, string>;
  plantDeck: string[]; // 8 card IDs
  zombieDeck: string[]; // 8 card IDs
  matchState: {
    matchTime: number; // Elapsed seconds
    plantSun: number;
    zombieBrains: number;
    plantBaseHp: number; // 100 max
    laneCleaners: boolean[]; // 5 lanes: true if lawn mower is ready
    plants: Record<string, PlantInstance>; // key: "col_row"
    zombies: ZombieInstance[];
    projectiles: ProjectileInstance[];
    winner: Faction | null;
    stats: {
      plantDamage: number;
      zombieDamage: number;
      plantsSummoned: number;
      zombiesSummoned: number;
      bestLane: number;
    };
  };
  chatMessages: Array<{
    id: string;
    sender: string;
    text: string;
    color: string;
    timestamp: number;
  }>;
  lastUpdated: number;
}

export interface PlayerStats {
  totalMatches: number;
  plantWins: number;
  zombieWins: number;
  rating: number;
  level: number;
  xp: number;
}
