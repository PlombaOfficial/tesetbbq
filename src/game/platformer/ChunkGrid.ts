import { TileId, ChestData } from '../../types/platformerGame';
import { WorldGenerator2D } from './WorldGenerator';
import { TILE_DEFINITIONS, WALL_DEFINITIONS } from './tileRegistry';

export const CHUNK_W = 16;
export const CHUNK_H = 32;
export const TILE_PX = 20; // 20 pixels per tile on screen

export class Chunk2D {
  public cx: number;
  public cy: number;
  public tiles: Uint8Array;
  public walls: Uint8Array;

  constructor(cx: number, cy: number, tiles: Uint8Array, walls: Uint8Array) {
    this.cx = cx;
    this.cy = cy;
    this.tiles = tiles;
    this.walls = walls;
  }

  public getIndex(lx: number, ly: number): number {
    return ly * CHUNK_W + lx;
  }

  public getTile(lx: number, ly: number): TileId {
    if (lx < 0 || lx >= CHUNK_W || ly < 0 || ly >= CHUNK_H) return 0;
    return this.tiles[this.getIndex(lx, ly)];
  }

  public setTile(lx: number, ly: number, id: TileId) {
    if (lx < 0 || lx >= CHUNK_W || ly < 0 || ly >= CHUNK_H) return;
    this.tiles[this.getIndex(lx, ly)] = id;
  }

  public getWall(lx: number, ly: number): number {
    if (lx < 0 || lx >= CHUNK_W || ly < 0 || ly >= CHUNK_H) return 0;
    return this.walls[this.getIndex(lx, ly)];
  }

  public setWall(lx: number, ly: number, id: number) {
    if (lx < 0 || lx >= CHUNK_W || ly < 0 || ly >= CHUNK_H) return;
    this.walls[this.getIndex(lx, ly)] = id;
  }
}

export class ChunkGrid2D {
  public generator: WorldGenerator2D;
  public chunks: Map<string, Chunk2D> = new Map();
  public modifiedTiles: Map<string, TileId> = new Map();
  public modifiedWalls: Map<string, number> = new Map();
  public chests: Map<string, ChestData> = new Map();

  constructor(seed: number) {
    this.generator = new WorldGenerator2D(seed);
  }

  public getChunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public getCoordKey(gx: number, gy: number): string {
    return `${gx},${gy}`;
  }

  // Get Foreground Tile at global coordinate
  public getTile(gx: number, gy: number): TileId {
    if (gy < 0 || gy >= WorldGenerator2D.WORLD_HEIGHT) return 0;

    const mod = this.modifiedTiles.get(this.getCoordKey(gx, gy));
    if (mod !== undefined) return mod;

    const cx = Math.floor(gx / CHUNK_W);
    const cy = Math.floor(gy / CHUNK_H);
    const chunk = this.getOrCreateChunk(cx, cy);

    const lx = ((gx % CHUNK_W) + CHUNK_W) % CHUNK_W;
    const ly = ((gy % CHUNK_H) + CHUNK_H) % CHUNK_H;
    return chunk.getTile(lx, ly);
  }

  // Set Foreground Tile at global coordinate
  public setTile(gx: number, gy: number, tileId: TileId) {
    if (gy < 0 || gy >= WorldGenerator2D.WORLD_HEIGHT) return;

    this.modifiedTiles.set(this.getCoordKey(gx, gy), tileId);

    const cx = Math.floor(gx / CHUNK_W);
    const cy = Math.floor(gy / CHUNK_H);
    const chunk = this.chunks.get(this.getChunkKey(cx, cy));
    if (chunk) {
      const lx = ((gx % CHUNK_W) + CHUNK_W) % CHUNK_W;
      const ly = ((gy % CHUNK_H) + CHUNK_H) % CHUNK_H;
      chunk.setTile(lx, ly, tileId);
    }
  }

  // Get Background Wall at global coordinate
  public getWall(gx: number, gy: number): number {
    if (gy < 0 || gy >= WorldGenerator2D.WORLD_HEIGHT) return 0;

    const mod = this.modifiedWalls.get(this.getCoordKey(gx, gy));
    if (mod !== undefined) return mod;

    const cx = Math.floor(gx / CHUNK_W);
    const cy = Math.floor(gy / CHUNK_H);
    const chunk = this.getOrCreateChunk(cx, cy);

    const lx = ((gx % CHUNK_W) + CHUNK_W) % CHUNK_W;
    const ly = ((gy % CHUNK_H) + CHUNK_H) % CHUNK_H;
    return chunk.getWall(lx, ly);
  }

  // Set Background Wall at global coordinate
  public setWall(gx: number, gy: number, wallId: number) {
    if (gy < 0 || gy >= WorldGenerator2D.WORLD_HEIGHT) return;

    this.modifiedWalls.set(this.getCoordKey(gx, gy), wallId);

    const cx = Math.floor(gx / CHUNK_W);
    const cy = Math.floor(gy / CHUNK_H);
    const chunk = this.chunks.get(this.getChunkKey(cx, cy));
    if (chunk) {
      const lx = ((gx % CHUNK_W) + CHUNK_W) % CHUNK_W;
      const ly = ((gy % CHUNK_H) + CHUNK_H) % CHUNK_H;
      chunk.setWall(lx, ly, wallId);
    }
  }

  public getOrCreateChunk(cx: number, cy: number): Chunk2D {
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const gen = this.generator.generateChunk(cx, cy);
      chunk = new Chunk2D(cx, cy, gen.tiles, gen.walls);

      // Apply modifications
      for (let lx = 0; lx < CHUNK_W; lx++) {
        for (let ly = 0; ly < CHUNK_H; ly++) {
          const gx = cx * CHUNK_W + lx;
          const gy = cy * CHUNK_H + ly;
          const modTile = this.modifiedTiles.get(this.getCoordKey(gx, gy));
          if (modTile !== undefined) {
            chunk.setTile(lx, ly, modTile);
          }
          const modWall = this.modifiedWalls.get(this.getCoordKey(gx, gy));
          if (modWall !== undefined) {
            chunk.setWall(lx, ly, modWall);
          }
        }
      }

      // Generate procedural structures (trees, wild herbs, loot chests)
      gen.structures.forEach((st) => {
        if (st.type === 'tree') {
          this.plantTree(st.x, st.y);
        } else if (st.type === 'herb') {
          if (this.getTile(st.x, st.y) === 0 && this.getTile(st.x, st.y + 1) === 1) {
            this.setTile(st.x, st.y, 27); // Wild Herb
          }
        }
      });

      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  private plantTree(baseX: number, surfaceY: number) {
    const height = 5 + Math.floor(Math.random() * 4);
    // Trunk
    for (let dy = 0; dy < height; dy++) {
      const ty = surfaceY - dy;
      if (this.getTile(baseX, ty) === 0) {
        this.setTile(baseX, ty, 4); // Sunwood Log
      }
    }
    // Foliage canopy
    const topY = surfaceY - height;
    for (let fx = -2; fx <= 2; fx++) {
      for (let fy = -2; fy <= 1; fy++) {
        if (Math.abs(fx) === 2 && Math.abs(fy) === 2) continue;
        const tx = baseX + fx;
        const ty = topY + fy;
        if (this.getTile(tx, ty) === 0) {
          this.setTile(tx, ty, 5); // Leaves
        }
      }
    }
  }

  // Toggle Door (Open/Close)
  public toggleDoor(gx: number, gy: number): boolean {
    const tile = this.getTile(gx, gy);
    if (tile === 16) {
      this.setTile(gx, gy, 17); // Open door
      return true;
    } else if (tile === 17) {
      this.setTile(gx, gy, 16); // Close door
      return true;
    }
    return false;
  }
}
