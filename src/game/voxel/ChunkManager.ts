import * as THREE from 'three';
import { BlockId } from '../../types/voxelGame';
import { TerrainGenerator } from './TerrainGenerator';
import { VoxelAtlas, ATLAS_COLS, ATLAS_ROWS, BLOCK_DEFINITIONS } from './VoxelAtlas';

export interface VoxelHitResult {
  hit: boolean;
  blockX: number;
  blockY: number;
  blockZ: number;
  faceNormal: THREE.Vector3;
  blockId: BlockId;
  distance: number;
}

export class VoxelChunk {
  public chunkX: number;
  public chunkZ: number;
  public voxels: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public transparentMesh: THREE.Mesh | null = null;
  public isDirty: boolean = false;

  constructor(chunkX: number, chunkZ: number, voxels: Uint8Array) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.voxels = voxels;
  }

  public getIndex(x: number, y: number, z: number): number {
    return y * (16 * 16) + z * 16 + x;
  }

  public getBlock(x: number, y: number, z: number): BlockId {
    if (x < 0 || x >= 16 || y < 0 || y >= TerrainGenerator.CHUNK_HEIGHT || z < 0 || z >= 16) {
      return 0;
    }
    return this.voxels[this.getIndex(x, y, z)];
  }

  public setBlock(x: number, y: number, z: number, blockId: BlockId) {
    if (x < 0 || x >= 16 || y < 0 || y >= TerrainGenerator.CHUNK_HEIGHT || z < 0 || z >= 16) return;
    this.voxels[this.getIndex(x, y, z)] = blockId;
    this.isDirty = true;
  }
}

export class ChunkManager {
  public chunks: Map<string, VoxelChunk> = new Map();
  public generator: TerrainGenerator;
  public scene: THREE.Scene;
  public solidMaterial: THREE.MeshStandardMaterial;
  public transparentMaterial: THREE.MeshStandardMaterial;

  public renderDistance: number = 4; // 4 chunks radius = 9x9 = 81 chunks
  private modifiedBlocks: Map<string, BlockId> = new Map();

  constructor(scene: THREE.Scene, seed: number) {
    this.scene = scene;
    this.generator = new TerrainGenerator(seed);

    const atlasTex = VoxelAtlas.getTexture();

    this.solidMaterial = new THREE.MeshStandardMaterial({
      map: atlasTex,
      roughness: 0.8,
      metalness: 0.1
    });

    this.transparentMaterial = new THREE.MeshStandardMaterial({
      map: atlasTex,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getBlockKey(wx: number, wy: number, wz: number): string {
    return `${wx},${wy},${wz}`;
  }

  // Get block at global world coordinate
  public getBlock(wx: number, wy: number, wz: number): BlockId {
    if (wy < 0 || wy >= TerrainGenerator.CHUNK_HEIGHT) return 0;

    const mod = this.modifiedBlocks.get(this.getBlockKey(wx, wy, wz));
    if (mod !== undefined) return mod;

    const cx = Math.floor(wx / 16);
    const cz = Math.floor(wz / 16);
    const key = this.getChunkKey(cx, cz);

    let chunk = this.chunks.get(key);
    if (!chunk) {
      const voxels = this.generator.generateChunkVoxels(cx, cz);
      chunk = new VoxelChunk(cx, cz, voxels);
      this.chunks.set(key, chunk);
    }

    const lx = ((wx % 16) + 16) % 16;
    const lz = ((wz % 16) + 16) % 16;
    return chunk.getBlock(lx, wy, lz);
  }

  // Set block at global world coordinate & rebuild chunk meshes
  public setBlock(wx: number, wy: number, wz: number, blockId: BlockId) {
    if (wy < 0 || wy >= TerrainGenerator.CHUNK_HEIGHT) return;

    this.modifiedBlocks.set(this.getBlockKey(wx, wy, wz), blockId);

    const cx = Math.floor(wx / 16);
    const cz = Math.floor(wz / 16);
    const key = this.getChunkKey(cx, cz);

    const chunk = this.chunks.get(key);
    if (chunk) {
      const lx = ((wx % 16) + 16) % 16;
      const lz = ((wz % 16) + 16) % 16;
      chunk.setBlock(lx, wy, lz, blockId);
      this.buildChunkMesh(chunk);

      // Rebuild adjacent chunks if on borders
      if (lx === 0) this.rebuildChunkAt(cx - 1, cz);
      if (lx === 15) this.rebuildChunkAt(cx + 1, cz);
      if (lz === 0) this.rebuildChunkAt(cx, cz - 1);
      if (lz === 15) this.rebuildChunkAt(cx, cz + 1);
    }
  }

  private rebuildChunkAt(cx: number, cz: number) {
    const adj = this.chunks.get(this.getChunkKey(cx, cz));
    if (adj) this.buildChunkMesh(adj);
  }

  // Update chunk loading around player
  public update(playerWx: number, playerWz: number) {
    const centerCx = Math.floor(playerWx / 16);
    const centerCz = Math.floor(playerWz / 16);

    const activeKeys = new Set<string>();

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const cx = centerCx + dx;
        const cz = centerCz + dz;
        const key = this.getChunkKey(cx, cz);
        activeKeys.add(key);

        let chunk = this.chunks.get(key);
        if (!chunk) {
          const voxels = this.generator.generateChunkVoxels(cx, cz);

          // Apply saved modifications for this chunk
          for (let lx = 0; lx < 16; lx++) {
            for (let lz = 0; lz < 16; lz++) {
              for (let ly = 0; ly < TerrainGenerator.CHUNK_HEIGHT; ly++) {
                const gwx = cx * 16 + lx;
                const gwz = cz * 16 + lz;
                const mod = this.modifiedBlocks.get(this.getBlockKey(gwx, ly, gwz));
                if (mod !== undefined) {
                  voxels[ly * 256 + lz * 16 + lx] = mod;
                }
              }
            }
          }

          chunk = new VoxelChunk(cx, cz, voxels);
          this.chunks.set(key, chunk);
          this.buildChunkMesh(chunk);
        }
      }
    }

    // Unload distant chunks to preserve memory
    this.chunks.forEach((chunk, key) => {
      if (!activeKeys.has(key)) {
        if (chunk.mesh) {
          this.scene.remove(chunk.mesh);
          chunk.mesh.geometry.dispose();
        }
        if (chunk.transparentMesh) {
          this.scene.remove(chunk.transparentMesh);
          chunk.transparentMesh.geometry.dispose();
        }
        this.chunks.delete(key);
      }
    });
  }

  // Build Face-Culled Voxel BufferGeometry for Chunk
  public buildChunkMesh(chunk: VoxelChunk) {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const transPositions: number[] = [];
    const transNormals: number[] = [];
    const transUvs: number[] = [];

    const cx = chunk.chunkX;
    const cz = chunk.chunkZ;

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y < TerrainGenerator.CHUNK_HEIGHT; y++) {
          const blockId = chunk.getBlock(x, y, z);
          if (blockId === 0) continue;

          const def = BLOCK_DEFINITIONS[blockId];
          if (!def) continue;

          const wx = cx * 16 + x;
          const wy = y;
          const wz = cz * 16 + z;

          const isTrans = def.isTransparent || def.isLiquid;
          const targetPos = isTrans ? transPositions : positions;
          const targetNorm = isTrans ? transNormals : normals;
          const targetUv = isTrans ? transUvs : uvs;

          // Check all 6 face neighbors (Hidden Face Culling)
          // Top Face (+Y)
          if (this.isFaceVisible(wx, wy + 1, wz, isTrans)) {
            this.addQuad(targetPos, targetNorm, targetUv, wx, wy, wz, 'top', def.textureIndices.top);
          }
          // Bottom Face (-Y)
          if (this.isFaceVisible(wx, wy - 1, wz, isTrans)) {
            this.addQuad(targetPos, targetNorm, targetUv, wx, wy, wz, 'bottom', def.textureIndices.bottom);
          }
          // North Face (-Z)
          if (this.isFaceVisible(wx, wy, wz - 1, isTrans)) {
            this.addQuad(targetPos, targetNorm, targetUv, wx, wy, wz, 'north', def.textureIndices.side);
          }
          // South Face (+Z)
          if (this.isFaceVisible(wx, wy, wz + 1, isTrans)) {
            this.addQuad(targetPos, targetNorm, targetUv, wx, wy, wz, 'south', def.textureIndices.side);
          }
          // West Face (-X)
          if (this.isFaceVisible(wx - 1, wy, wz, isTrans)) {
            this.addQuad(targetPos, targetNorm, targetUv, wx, wy, wz, 'west', def.textureIndices.side);
          }
          // East Face (+X)
          if (this.isFaceVisible(wx + 1, wy, wz, isTrans)) {
            this.addQuad(targetPos, targetNorm, targetUv, wx, wy, wz, 'east', def.textureIndices.side);
          }
        }
      }
    }

    // Build Solid Mesh
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }

    if (positions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

      chunk.mesh = new THREE.Mesh(geo, this.solidMaterial);
      chunk.mesh.castShadow = true;
      chunk.mesh.receiveShadow = true;
      this.scene.add(chunk.mesh);
    }

    // Build Transparent Mesh
    if (chunk.transparentMesh) {
      this.scene.remove(chunk.transparentMesh);
      chunk.transparentMesh.geometry.dispose();
      chunk.transparentMesh = null;
    }

    if (transPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(transPositions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(transNormals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(transUvs, 2));

      chunk.transparentMesh = new THREE.Mesh(geo, this.transparentMaterial);
      this.scene.add(chunk.transparentMesh);
    }
  }

  private isFaceVisible(wx: number, wy: number, wz: number, currentIsTrans: boolean): boolean {
    const neighborId = this.getBlock(wx, wy, wz);
    if (neighborId === 0) return true; // Air is visible

    const neighborDef = BLOCK_DEFINITIONS[neighborId];
    if (!neighborDef) return true;

    if (neighborDef.isTransparent && !currentIsTrans) return true;
    if (neighborDef.isLiquid && !currentIsTrans) return true;
    return false;
  }

  private addQuad(
    pos: number[],
    norm: number[],
    uvs: number[],
    x: number, y: number, z: number,
    face: 'top' | 'bottom' | 'north' | 'south' | 'west' | 'east',
    tileIdx: number
  ) {
    const tileCol = tileIdx % ATLAS_COLS;
    const tileRow = Math.floor(tileIdx / ATLAS_COLS);

    const u0 = tileCol / ATLAS_COLS;
    const v0 = 1.0 - (tileRow + 1) / ATLAS_ROWS;
    const u1 = (tileCol + 1) / ATLAS_COLS;
    const v1 = 1.0 - tileRow / ATLAS_ROWS;

    if (face === 'top') {
      pos.push(x, y + 1, z,  x, y + 1, z + 1,  x + 1, y + 1, z + 1,  x, y + 1, z,  x + 1, y + 1, z + 1,  x + 1, y + 1, z);
      norm.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0);
      uvs.push(u0, v1,  u0, v0,  u1, v0,  u0, v1,  u1, v0,  u1, v1);
    } else if (face === 'bottom') {
      pos.push(x, y, z,  x + 1, y, z,  x + 1, y, z + 1,  x, y, z,  x + 1, y, z + 1,  x, y, z + 1);
      norm.push(0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0);
      uvs.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);
    } else if (face === 'north') {
      pos.push(x, y, z,  x, y + 1, z,  x + 1, y + 1, z,  x, y, z,  x + 1, y + 1, z,  x + 1, y, z);
      norm.push(0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1);
      uvs.push(u1, v0,  u1, v1,  u0, v1,  u1, v0,  u0, v1,  u0, v0);
    } else if (face === 'south') {
      pos.push(x, y, z + 1,  x + 1, y, z + 1,  x + 1, y + 1, z + 1,  x, y, z + 1,  x + 1, y + 1, z + 1,  x, y + 1, z + 1);
      norm.push(0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1);
      uvs.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);
    } else if (face === 'west') {
      pos.push(x, y, z,  x, y, z + 1,  x, y + 1, z + 1,  x, y, z,  x, y + 1, z + 1,  x, y + 1, z);
      norm.push(-1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0);
      uvs.push(u0, v0,  u1, v0,  u1, v1,  u0, v0,  u1, v1,  u0, v1);
    } else if (face === 'east') {
      pos.push(x + 1, y, z,  x + 1, y + 1, z,  x + 1, y + 1, z + 1,  x + 1, y, z,  x + 1, y + 1, z + 1,  x + 1, y, z + 1);
      norm.push(1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0);
      uvs.push(u1, v0,  u1, v1,  u0, v1,  u1, v0,  u0, v1,  u0, v0);
    }
  }

  // Fast Raycast against voxel blocks (for mining and placing)
  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDist: number = 6.0): VoxelHitResult {
    let px = origin.x;
    let py = origin.y;
    let pz = origin.z;

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    const step = 0.05;
    let dist = 0;

    let prevBx = Math.floor(px);
    let prevBy = Math.floor(py);
    let prevBz = Math.floor(pz);

    while (dist < maxDist) {
      px += dx * step;
      py += dy * step;
      pz += dz * step;
      dist += step;

      const bx = Math.floor(px);
      const by = Math.floor(py);
      const bz = Math.floor(pz);

      if (bx !== prevBx || by !== prevBy || bz !== prevBz) {
        const blockId = this.getBlock(bx, by, bz);
        const def = BLOCK_DEFINITIONS[blockId];

        if (blockId !== 0 && def && def.isSolid) {
          // Compute normal from previous step
          const norm = new THREE.Vector3(prevBx - bx, prevBy - by, prevBz - bz);
          return {
            hit: true,
            blockX: bx,
            blockY: by,
            blockZ: bz,
            faceNormal: norm,
            blockId,
            distance: dist
          };
        }

        prevBx = bx;
        prevBy = by;
        prevBz = bz;
      }
    }

    return {
      hit: false,
      blockX: 0, blockY: 0, blockZ: 0,
      faceNormal: new THREE.Vector3(),
      blockId: 0,
      distance: 0
    };
  }
}
