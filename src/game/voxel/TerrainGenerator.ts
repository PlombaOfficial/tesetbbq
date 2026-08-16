import { BiomeType, BlockId } from '../../types/voxelGame';

// High-performance 2D & 3D Simplex noise implementation
class SimplexNoise {
  private perm: number[] = [];

  constructor(seed: number) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    // Shuffle with seed
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

  public noise2D(x: number, y: number): number {
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

    let n0 = this.contrib2D(ii, jj, x0, y0);
    let n1 = this.contrib2D(ii + i1, jj + j1, x1, y1);
    let n2 = this.contrib2D(ii + 1, jj + 1, x2, y2);

    return 70.0 * (n0 + n1 + n2);
  }

  private contrib2D(ii: number, jj: number, x: number, y: number): number {
    let t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    t *= t;
    const gi = this.perm[ii + this.perm[jj]] % 8;
    const grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]][gi];
    return t * t * (grad[0] * x + grad[1] * y);
  }

  public noise3D(x: number, y: number, z: number): number {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);

    let i1 = 0, j1 = 0, k1 = 0, i2 = 0, j2 = 0, k2 = 0;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }

    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0*G3, y2 = y0 - j2 + 2.0*G3, z2 = z0 - k2 + 2.0*G3;
    const x3 = x0 - 1.0 + 3.0*G3, y3 = y0 - 1.0 + 3.0*G3, z3 = z0 - 1.0 + 3.0*G3;

    const ii = i & 255, jj = j & 255, kk = k & 255;
    const n0 = this.contrib3D(ii, jj, kk, x0, y0, z0);
    const n1 = this.contrib3D(ii+i1, jj+j1, kk+k1, x1, y1, z1);
    const n2 = this.contrib3D(ii+i2, jj+j2, kk+k2, x2, y2, z2);
    const n3 = this.contrib3D(ii+1, jj+1, kk+1, x3, y3, z3);

    return 32.0 * (n0 + n1 + n2 + n3);
  }

  private contrib3D(ii: number, jj: number, kk: number, x: number, y: number, z: number): number {
    let t = 0.6 - x*x - y*y - z*z;
    if (t < 0) return 0;
    t *= t;
    const gi = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    const grad = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ][gi];
    return t * t * (grad[0]*x + grad[1]*y + grad[2]*z);
  }
}

export class TerrainGenerator {
  private heightNoise: SimplexNoise;
  private detailNoise: SimplexNoise;
  private tempNoise: SimplexNoise;
  private moistureNoise: SimplexNoise;
  private caveNoise: SimplexNoise;
  private oreNoise: SimplexNoise;

  public static readonly SEA_LEVEL = 18;
  public static readonly CHUNK_SIZE_X = 16;
  public static readonly CHUNK_SIZE_Z = 16;
  public static readonly CHUNK_HEIGHT = 48;

  constructor(seed: number) {
    this.heightNoise = new SimplexNoise(seed);
    this.detailNoise = new SimplexNoise(seed + 101);
    this.tempNoise = new SimplexNoise(seed + 202);
    this.moistureNoise = new SimplexNoise(seed + 303);
    this.caveNoise = new SimplexNoise(seed + 404);
    this.oreNoise = new SimplexNoise(seed + 505);
  }

  // Determine Biome at world coordinate
  public getBiome(wx: number, wz: number): BiomeType {
    const temp = this.tempNoise.noise2D(wx * 0.003, wz * 0.003);
    const moist = this.moistureNoise.noise2D(wx * 0.003, wz * 0.003);

    if (temp < -0.35) return 'frosted_peaks';
    if (temp > 0.4 && moist < -0.1) return 'scorched_dunes';
    if (moist > 0.4 && temp > 0.1) return 'bioluminescent_marsh';
    if (moist > 0.2) return 'redwood_forest';
    if (temp > 0.6 && moist > 0.6) return 'astral_chasm';
    return 'verdant_plains';
  }

  // Calculate surface height
  public getHeight(wx: number, wz: number, biome: BiomeType): number {
    const base = this.heightNoise.noise2D(wx * 0.008, wz * 0.008) * 12 + 22;
    const detail = this.detailNoise.noise2D(wx * 0.04, wz * 0.04) * 3;

    let height = base + detail;
    if (biome === 'frosted_peaks') {
      height += Math.max(0, this.heightNoise.noise2D(wx * 0.015, wz * 0.015)) * 14;
    } else if (biome === 'bioluminescent_marsh') {
      height = Math.min(height, TerrainGenerator.SEA_LEVEL + 1.5);
    }
    return Math.floor(Math.max(4, Math.min(TerrainGenerator.CHUNK_HEIGHT - 6, height)));
  }

  // Generate 3D Voxel Array for a Chunk (Flat Uint8Array size: 16 * 48 * 16)
  public generateChunkVoxels(chunkX: number, chunkZ: number): Uint8Array {
    const voxels = new Uint8Array(TerrainGenerator.CHUNK_SIZE_X * TerrainGenerator.CHUNK_HEIGHT * TerrainGenerator.CHUNK_SIZE_Z);

    const getIndex = (x: number, y: number, z: number) => {
      return y * (TerrainGenerator.CHUNK_SIZE_X * TerrainGenerator.CHUNK_SIZE_Z) + z * TerrainGenerator.CHUNK_SIZE_X + x;
    };

    const treesToPlant: Array<{ x: number; y: number; z: number; type: 'sunwood' | 'redwood' }> = [];

    for (let x = 0; x < TerrainGenerator.CHUNK_SIZE_X; x++) {
      for (let z = 0; z < TerrainGenerator.CHUNK_SIZE_Z; z++) {
        const wx = chunkX * TerrainGenerator.CHUNK_SIZE_X + x;
        const wz = chunkZ * TerrainGenerator.CHUNK_SIZE_Z + z;

        const biome = this.getBiome(wx, wz);
        const surfaceHeight = this.getHeight(wx, wz, biome);

        // Bedrock layer
        voxels[getIndex(x, 0, z)] = 18; // Obsidian / Bedrock

        for (let y = 1; y < TerrainGenerator.CHUNK_HEIGHT; y++) {
          const idx = getIndex(x, y, z);

          if (y <= surfaceHeight) {
            // Check 3D Cave Carvers
            const caveVal = this.caveNoise.noise3D(wx * 0.04, y * 0.06, wz * 0.04);
            const isCave = caveVal > 0.42 && y > 2 && y < surfaceHeight - 1;

            if (isCave) {
              // Underground fluid lakes
              if (y < 6) {
                voxels[idx] = 26; // Magma Flux at bottom
              } else if (y <= TerrainGenerator.SEA_LEVEL - 6 && y > 8) {
                voxels[idx] = 25; // Water
              } else {
                voxels[idx] = 0; // Cave air
              }
              continue;
            }

            // Solid blocks distribution
            if (y === surfaceHeight) {
              // Top block by biome
              if (biome === 'scorched_dunes') voxels[idx] = 7; // Sand
              else if (biome === 'frosted_peaks') voxels[idx] = 9; // Snow
              else if (biome === 'bioluminescent_marsh') voxels[idx] = 31; // Bio Moss
              else if (biome === 'astral_chasm') voxels[idx] = 32; // Astral stone
              else voxels[idx] = 1; // Aether Grass

              // Chance to spawn tree
              if (y >= TerrainGenerator.SEA_LEVEL && x > 2 && x < 13 && z > 2 && z < 13) {
                const treeRand = Math.abs(this.detailNoise.noise2D(wx * 0.3, wz * 0.3));
                if (biome === 'verdant_plains' && treeRand > 0.72) {
                  treesToPlant.push({ x, y: y + 1, z, type: 'sunwood' });
                } else if (biome === 'redwood_forest' && treeRand > 0.55) {
                  treesToPlant.push({ x, y: y + 1, z, type: 'redwood' });
                }
              }
            } else if (y > surfaceHeight - 4) {
              // Subsurface layer
              voxels[idx] = biome === 'scorched_dunes' ? 8 : biome === 'frosted_peaks' ? 10 : 2; // Sandstone/Ice/Dirt
            } else {
              // Deep Stone & Ore generation
              const oreVal = this.oreNoise.noise3D(wx * 0.1, y * 0.1, wz * 0.1);
              if (oreVal > 0.65 && y < 14) {
                voxels[idx] = 14; // Prism Crystal Ore
              } else if (oreVal > 0.55 && y < 24) {
                voxels[idx] = 13; // Cobalt Ore
              } else if (oreVal > 0.45 && y < 36) {
                voxels[idx] = 12; // Ironite Ore
              } else if (oreVal > 0.7 && y < 8) {
                voxels[idx] = 15; // Voidstone Ore
              } else {
                voxels[idx] = 3; // Granite Stone
              }
            }
          } else if (y <= TerrainGenerator.SEA_LEVEL) {
            // Water ocean level
            voxels[idx] = 25; // Water
          } else {
            voxels[idx] = 0; // Air
          }
        }
      }
    }

    // Plant procedural trees
    treesToPlant.forEach((t) => {
      this.growTree(voxels, t.x, t.y, t.z, t.type);
    });

    return voxels;
  }

  private growTree(
    voxels: Uint8Array, 
    bx: number, 
    by: number, 
    bz: number, 
    type: 'sunwood' | 'redwood'
  ) {
    const getIndex = (x: number, y: number, z: number) => {
      if (x < 0 || x >= 16 || y < 0 || y >= TerrainGenerator.CHUNK_HEIGHT || z < 0 || z >= 16) return -1;
      return y * (16 * 16) + z * 16 + x;
    };

    const trunkHeight = type === 'redwood' ? 8 : 5;
    const logId: BlockId = type === 'redwood' ? 29 : 4;
    const leafId: BlockId = 6;

    // Trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      const idx = getIndex(bx, by + dy, bz);
      if (idx !== -1) voxels[idx] = logId;
    }

    // Leaf canopy
    const topY = by + trunkHeight;
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = 0; ly <= 2; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 2) continue;
          const idx = getIndex(bx + lx, topY + ly - 1, bz + lz);
          if (idx !== -1 && voxels[idx] === 0) {
            voxels[idx] = leafId;
          }
        }
      }
    }
  }
}
