import * as THREE from 'three';
import { ChunkManager, VoxelHitResult } from './ChunkManager';
import { BLOCK_DEFINITIONS } from './VoxelAtlas';
import { ItemDef } from '../../types/voxelGame';

export class VoxelPhysics {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;
  public pitch: number = 0;

  public onGround: boolean = false;
  public inWater: boolean = false;

  // Player AABB dimensions
  public playerRadius: number = 0.35;
  public playerHeight: number = 1.75;

  // Mining state
  public miningBlock: { x: number; y: number; z: number } | null = null;
  public miningProgress: number = 0; // 0 to 1.0

  constructor(spawnPos: THREE.Vector3) {
    this.position = spawnPos.clone();
  }

  public update(
    delta: number,
    inputDir: THREE.Vector2, // (x=strafe, y=forward)
    isJumping: boolean,
    isSprinting: boolean,
    chunkManager: ChunkManager
  ) {
    // 1. Water check
    const headBlock = chunkManager.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
    const feetBlock = chunkManager.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 1), Math.floor(this.position.z));
    this.inWater = (headBlock === 25 || feetBlock === 25);

    // 2. Horizontal Movement
    const speed = this.inWater ? 3.0 : isSprinting ? 6.5 : 4.2;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveVec = new THREE.Vector3()
      .addScaledVector(forward, inputDir.y * speed)
      .addScaledVector(right, inputDir.x * speed);

    this.velocity.x = moveVec.x;
    this.velocity.z = moveVec.z;

    // 3. Vertical Gravity & Jumping
    if (this.inWater) {
      if (isJumping) {
        this.velocity.y = 3.5;
      } else {
        this.velocity.y = Math.max(-2.5, this.velocity.y - 12 * delta);
      }
    } else {
      if (isJumping && this.onGround) {
        this.velocity.y = 8.5;
        this.onGround = false;
      }
      this.velocity.y = Math.max(-35.0, this.velocity.y - 24.0 * delta);
    }

    // 4. Collision Resolution (Axis by Axis for smooth sliding)
    // X Axis
    this.position.x += this.velocity.x * delta;
    if (this.checkCollision(this.position, chunkManager)) {
      this.position.x -= this.velocity.x * delta;
      this.velocity.x = 0;
    }

    // Z Axis
    this.position.z += this.velocity.z * delta;
    if (this.checkCollision(this.position, chunkManager)) {
      this.position.z -= this.velocity.z * delta;
      this.velocity.z = 0;
    }

    // Y Axis
    this.position.y += this.velocity.y * delta;
    if (this.checkCollision(this.position, chunkManager)) {
      if (this.velocity.y < 0) {
        this.onGround = true;
      }
      this.position.y -= this.velocity.y * delta;
      this.velocity.y = 0;
    } else {
      if (this.velocity.y < -0.2) {
        this.onGround = false;
      }
    }

    // Void reset safeguard
    if (this.position.y < -10) {
      this.position.set(0, 35, 0);
      this.velocity.set(0, 0, 0);
    }
  }

  // AABB Collision check against surrounding solid voxels
  public checkCollision(pos: THREE.Vector3, chunkManager: ChunkManager): boolean {
    const minX = Math.floor(pos.x - this.playerRadius);
    const maxX = Math.floor(pos.x + this.playerRadius);
    const minY = Math.floor(pos.y - this.playerHeight);
    const maxY = Math.floor(pos.y + 0.1);
    const minZ = Math.floor(pos.z - this.playerRadius);
    const maxZ = Math.floor(pos.z + this.playerRadius);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const bId = chunkManager.getBlock(x, y, z);
          const def = BLOCK_DEFINITIONS[bId];
          if (def && def.isSolid) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Process mining tick
  public processMining(
    delta: number,
    hit: VoxelHitResult,
    equippedItem: ItemDef | null,
    chunkManager: ChunkManager
  ): { broken: boolean; dropItemId?: string; dropCount?: number } {
    if (!hit.hit) {
      this.miningBlock = null;
      this.miningProgress = 0;
      return { broken: false };
    }

    const def = BLOCK_DEFINITIONS[hit.blockId];
    if (!def || !def.isSolid) {
      this.miningBlock = null;
      this.miningProgress = 0;
      return { broken: false };
    }

    // Check if aiming at same block
    if (!this.miningBlock || this.miningBlock.x !== hit.blockX || this.miningBlock.y !== hit.blockY || this.miningBlock.z !== hit.blockZ) {
      this.miningBlock = { x: hit.blockX, y: hit.blockY, z: hit.blockZ };
      this.miningProgress = 0;
    }

    // Calculate mining speed multiplier
    let speed = 1.0;
    if (equippedItem && equippedItem.toolType === def.bestTool) {
      speed = (equippedItem.miningSpeed || 1.5) * (equippedItem.toolTier && equippedItem.toolTier >= def.minToolTier ? 1.5 : 0.8);
    }

    const breakTime = Math.max(0.1, def.hardness / speed);
    this.miningProgress += delta / breakTime;

    if (this.miningProgress >= 1.0) {
      // Block Broken!
      chunkManager.setBlock(hit.blockX, hit.blockY, hit.blockZ, 0);
      const dropItem = def.dropItem;
      const dropCount = def.dropCount;
      this.miningBlock = null;
      this.miningProgress = 0;
      return { broken: true, dropItemId: dropItem, dropCount };
    }

    return { broken: false };
  }

  // Place Block
  public tryPlaceBlock(
    hit: VoxelHitResult,
    blockId: number,
    chunkManager: ChunkManager
  ): boolean {
    if (!hit.hit || blockId === 0) return false;

    const targetX = hit.blockX + hit.faceNormal.x;
    const targetY = hit.blockY + hit.faceNormal.y;
    const targetZ = hit.blockZ + hit.faceNormal.z;

    // Check if target position intersects with player's bounding box
    const minX = targetX, maxX = targetX + 1;
    const minY = targetY, maxY = targetY + 1;
    const minZ = targetZ, maxZ = targetZ + 1;

    const pMinX = this.position.x - this.playerRadius, pMaxX = this.position.x + this.playerRadius;
    const pMinY = this.position.y - this.playerHeight, pMaxY = this.position.y + 0.1;
    const pMinZ = this.position.z - this.playerRadius, pMaxZ = this.position.z + this.playerRadius;

    const intersectsPlayer = (minX < pMaxX && maxX > pMinX && minY < pMaxY && maxY > pMinY && minZ < pMaxZ && maxZ > pMinZ);
    if (intersectsPlayer) return false;

    chunkManager.setBlock(targetX, targetY, targetZ, blockId);
    return true;
  }
}
