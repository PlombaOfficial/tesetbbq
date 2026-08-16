import { TileId } from '../../types/platformerGame';

// 2D Simplex Noise generator for procedural terrain
class SimplexNoise2D {
  private perm: number[] = [];

  constructor(seed: number) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      const temp = p[i]; p[i] = p[j]; p[j] = temp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  public noise(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    let s = (x + y) * F2;
    let i = Math.floor(x + s);
    let j = Math.floor(y + s);
    let t = (i + j) * G2;
    let X0 = i - t;
    let Y0 = j - t;
    let x0 = x - X0;
    let y0 = y - Y0;

    let i1 = x0 > y0 ? 1 : 0;
    let j1 = x0 > y0 ? 0 : 1;

    let x1 = x0 - i1 + G2;
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2;
    let y2 = y0 - 1.0 + 2.0 * G2;

    let ii = i & 255;
    let jj = j & 255;

    let n0 = this.contrib(ii, jj, x0, y0);
    let n1 = this.contrib(ii + i1, jj + j1, x1, y1);
    let n2 = this.contrib(ii + 1, jj + 1, x2, y2);

    return 70.0 * (n0 + n1 + n2);
  }

  private contrib(ii: number, jj: number, x: number, y: number): number {
    let t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    t *= t;
    const gi = this.perm[ii + this.perm[jj]] % 8;
    const grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]][gi];
    return t * t * (grad[0] * x + grad[1] * y);
  }
}

export class WorldGenerator2D {
  private heightNoise: SimplexNoise2D;
  private detailNoise: SimplexNoise2D;
  private caveNoise: SimplexNoise2D;
  private caveDetailNoise: SimplexNoise2D;
  private biomeNoise: SimplexNoise2D;
  private oreNoise: SimplexNoise2D;

  public static readonly WORLD_HEIGHT = 180; // Total world depth in tiles
  public static readonly SEA_LEVEL = 42; // Surface baseline Y

  constructor(seed: number) {
    this.heightNoise = new SimplexNoise2D(seed);
    this.detailNoise = new SimplexNoise2D(seed + 101);
    this.caveNoise = new SimplexNoise2D(seed + 202);
    this.caveDetailNoise = new SimplexNoise2D(seed + 303);
    this.biomeNoise = new SimplexNoise2D(seed + 404);
    this.oreNoise = new SimplexNoise2D(seed + 505);
  }

  // Get Surface Height at X
  public getSurfaceHeight(x: number): number {
    const base = this.heightNoise.noise(x * 0.012, 0) * 12 + WorldGenerator2D.SEA_LEVEL;
    const detail = this.detailNoise.noise(x * 0.06, 0) * 3;
    return Math.floor(base + detail);
  }

  // Get Biome at X
  public getBiomeAt(x: number): 'forest' | 'desert' | 'snow' {
    const val = this.biomeNoise.noise(x * 0.005, 0);
    if (val < -0.3) return 'snow';
    if (val > 0.3) return 'desert';
    return 'forest';
  }

  // Generate 16x32 Chunk Data
  public generateChunk(
    chunkX: number, 
    chunkY: number
  ): { 
    tiles: Uint8Array; 
    walls: Uint8Array; 
    structures: Array<{ type: string; x: number; y: number; data?: Record<string, unknown> }> 
  } {
    const width = 16;
    const height = 32;
    const tiles = new Uint8Array(width * height);
    const walls = new Uint8Array(width * height);
    const structures: Array<{ type: string; x: number; y: number; data?: Record<string, unknown> }> = [];

    const getIdx = (lx: number, ly: number) => ly * width + lx;

    for (let lx = 0; lx < width; lx++) {
      const gx = chunkX * width + lx;
      const surfaceY = this.getSurfaceHeight(gx);
      const biome = this.getBiomeAt(gx);

      for (let ly = 0; ly < height; ly++) {
        const gy = chunkY * height + ly;
        const idx = getIdx(lx, ly);

        // Above surface: Air
        if (gy < surfaceY) {
          tiles[idx] = 0; // Air
          walls[idx] = 0; // Sky
          continue;
        }

        // 1. Check Caves
        const isUnderground = gy >= surfaceY + 3;
        let isCave = false;

        if (isUnderground && gy < WorldGenerator2D.WORLD_HEIGHT - 6) {
          const c1 = this.caveNoise.noise(gx * 0.04, gy * 0.04);
          const c2 = this.caveDetailNoise.noise(gx * 0.08, gy * 0.08);
          isCave = (c1 * c1 + c2 * 0.3) > 0.32;
        }

        if (isCave) {
          // Bottom Lava Lakes
          if (gy >= 150) {
            tiles[idx] = 29; // Magma Core
          } else {
            tiles[idx] = 0; // Cave Air
          }
          // Underground walls behind caves
          walls[idx] = gy > 75 ? 102 : 103; // Stone Wall or Dirt Wall
          continue;
        }

        // 2. Solid Strata Generations
        if (gy === surfaceY) {
          // Surface Top Layer
          if (biome === 'desert') {
            tiles[idx] = 7; // Sand
          } else if (biome === 'snow') {
            tiles[idx] = 9; // Snow
          } else {
            tiles[idx] = 1; // Grass Turf
          }
          walls[idx] = 0;

          // Tree generation on surface
          if (biome === 'forest' && (gx % 7 === 0 || gx % 11 === 0) && lx >= 2 && lx <= 13) {
            structures.push({ type: 'tree', x: gx, y: surfaceY - 1 });
          } else if (biome === 'forest' && Math.random() < 0.25) {
            structures.push({ type: 'herb', x: gx, y: surfaceY - 1 });
          }
        } else if (gy < surfaceY + 6) {
          // Subsurface Dirt / Sandstone / Ice Layer
          tiles[idx] = biome === 'desert' ? 8 : biome === 'snow' ? 10 : 2; // Sandstone/Ice/Loam
          walls[idx] = 103; // Dirt wall
        } else if (gy < 80) {
          // Upper Stone Layer + Ironite Ores
          const ore = this.oreNoise.noise(gx * 0.12, gy * 0.12);
          if (ore > 0.52) {
            tiles[idx] = 11; // Ironite Ore
          } else {
            tiles[idx] = 3; // Granite Stone
          }
          walls[idx] = 102; // Stone wall
        } else if (gy < 140) {
          // Deep Stone Layer + Cobalt & Prism Ores
          const ore = this.oreNoise.noise(gx * 0.12, gy * 0.12);
          if (ore > 0.6) {
            tiles[idx] = 13; // Prism Crystal Ore
          } else if (ore > 0.48) {
            tiles[idx] = 12; // Cobalt Ore
          } else {
            tiles[idx] = 3; // Granite Stone
          }
          walls[idx] = 102;
        } else {
          // Deep Core (Obsidian & Voidstone)
          const ore = this.oreNoise.noise(gx * 0.12, gy * 0.12);
          if (ore > 0.58) {
            tiles[idx] = 14; // Voidstone Ore
          } else {
            tiles[idx] = 28; // Obsidian Strata
          }
          walls[idx] = 102;
        }
      }
    }

    return { tiles, walls, structures };
  }
}
