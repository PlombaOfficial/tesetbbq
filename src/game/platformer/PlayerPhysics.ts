import { ChunkGrid2D } from './ChunkGrid';
import { TILE_DEFINITIONS, ITEM_REGISTRY } from './tileRegistry';
import { ItemDef, Particle2D, FloatingText } from '../../types/platformerGame';

export class PlayerPhysics2D {
  public x: number = 0; // In Tile units
  public y: number = 25;
  public vx: number = 0;
  public vy: number = 0;

  public width: number = 0.8; // ~16px width
  public height: number = 1.7; // ~34px height

  public isGrounded: boolean = false;
  public isClimbing: boolean = false;
  public facingLeft: boolean = false;

  // Coyote time & jump buffer
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private dropPlatformTimer: number = 0; // Ignore one-way platform for 0.25s

  // Mining state
  public miningTile: { x: number; y: number } | null = null;
  public miningProgress: number = 0; // 0 to 1.0
  public toolSwingAngle: number = 0; // radians for visual swing
  public isSwinging: boolean = false;

  constructor(spawnX: number, spawnY: number) {
    this.x = spawnX;
    this.y = spawnY;
  }

  public update(
    delta: number,
    inputX: number, // -1 (left), 1 (right)
    inputY: number, // -1 (up/climb), 1 (down/drop)
    jumpPressed: boolean,
    jumpHeld: boolean,
    isSprinting: boolean,
    chunkGrid: ChunkGrid2D
  ) {
    const moveSpeed = isSprinting ? 8.5 : 5.8;
    const gravity = 28.0;

    // Check ladders
    const currentTileCenter = chunkGrid.getTile(Math.floor(this.x + this.width / 2), Math.floor(this.y + this.height / 2));
    const onLadder = currentTileCenter === 23;

    if (onLadder) {
      this.isClimbing = true;
      this.vy = inputY * 4.5;
      this.vx = inputX * moveSpeed * 0.7;
    } else {
      this.isClimbing = false;
    }

    if (!this.isClimbing) {
      // Horizontal Acceleration & Deceleration
      if (inputX !== 0) {
        this.vx = inputX * moveSpeed;
        this.facingLeft = inputX < 0;
      } else {
        this.vx *= Math.pow(0.001, delta); // Fast friction stop
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }

      // Coyote time calculation
      if (this.isGrounded) {
        this.coyoteTimer = 0.12;
      } else {
        this.coyoteTimer -= delta;
      }

      // Jump buffer
      if (jumpPressed) {
        this.jumpBufferTimer = 0.12;
      } else {
        this.jumpBufferTimer -= delta;
      }

      // Drop through platforms
      if (inputY > 0 && jumpPressed) {
        this.dropPlatformTimer = 0.28;
      } else if (this.dropPlatformTimer > 0) {
        this.dropPlatformTimer -= delta;
      }

      // Execute Jump
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && this.dropPlatformTimer <= 0) {
        this.vy = -12.5; // Jump impulse
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.isGrounded = false;
      }

      // Variable jump cut
      if (!jumpHeld && this.vy < -3.0) {
        this.vy *= 0.6; // Short hop if released early
      }

      // Apply Gravity
      this.vy += gravity * delta;
      if (this.vy > 25.0) this.vy = 25.0; // Terminal velocity
    }

    // Tool swing visual reset
    if (this.isSwinging) {
      this.toolSwingAngle += delta * 14.0;
      if (this.toolSwingAngle > Math.PI) {
        this.toolSwingAngle = 0;
        this.isSwinging = false;
      }
    }

    // --- AABB COLLISION RESOLUTION ---
    // Horizontal Movement
    this.x += this.vx * delta;
    this.resolveCollisionsX(chunkGrid);

    // Vertical Movement
    this.y += this.vy * delta;
    this.resolveCollisionsY(chunkGrid);
  }

  private resolveCollisionsX(chunkGrid: ChunkGrid2D) {
    const minTileX = Math.floor(this.x);
    const maxTileX = Math.floor(this.x + this.width);
    const minTileY = Math.floor(this.y + 0.05);
    const maxTileY = Math.floor(this.y + this.height - 0.05);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tId = chunkGrid.getTile(tx, ty);
        const def = TILE_DEFINITIONS[tId];
        if (def && def.isSolid) {
          if (this.vx > 0) {
            this.x = tx - this.width - 0.001;
            this.vx = 0;
          } else if (this.vx < 0) {
            this.x = tx + 1.001;
            this.vx = 0;
          }
        }
      }
    }
  }

  private resolveCollisionsY(chunkGrid: ChunkGrid2D) {
    const minTileX = Math.floor(this.x + 0.05);
    const maxTileX = Math.floor(this.x + this.width - 0.05);
    const minTileY = Math.floor(this.y);
    const maxTileY = Math.floor(this.y + this.height);

    this.isGrounded = false;

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tId = chunkGrid.getTile(tx, ty);
        const def = TILE_DEFINITIONS[tId];
        if (!def) continue;

        // Solid full blocks
        if (def.isSolid) {
          if (this.vy > 0) {
            this.y = ty - this.height;
            this.vy = 0;
            this.isGrounded = true;
          } else if (this.vy < 0) {
            this.y = ty + 1.001;
            this.vy = 0;
          }
        }

        // One-way Platform check (only collide when falling down and feet are at platform top)
        if (def.isPlatform && this.dropPlatformTimer <= 0 && this.vy > 0) {
          const feetY = this.y + this.height;
          const prevFeetY = feetY - this.vy * 0.02;
          if (feetY >= ty && prevFeetY <= ty + 0.3) {
            this.y = ty - this.height;
            this.vy = 0;
            this.isGrounded = true;
          }
        }
      }
    }
  }

  // Process Mining a target tile
  public processMining(
    delta: number,
    targetTile: { x: number; y: number },
    equippedItem: ItemDef | null,
    chunkGrid: ChunkGrid2D
  ): { broken: boolean; dropItemId?: string; dropCount?: number } {
    const tId = chunkGrid.getTile(targetTile.x, targetTile.y);
    const def = TILE_DEFINITIONS[tId];
    if (!def || tId === 0) {
      this.miningTile = null;
      this.miningProgress = 0;
      return { broken: false };
    }

    this.isSwinging = true;

    if (!this.miningTile || this.miningTile.x !== targetTile.x || this.miningTile.y !== targetTile.y) {
      this.miningTile = { x: targetTile.x, y: targetTile.y };
      this.miningProgress = 0;
    }

    let speed = 1.0;
    if (equippedItem && equippedItem.toolType === def.bestTool) {
      speed = (equippedItem.miningSpeed || 1.5) * (equippedItem.toolTier && equippedItem.toolTier >= def.minToolTier ? 1.5 : 0.8);
    }

    const breakTime = Math.max(0.08, def.hardness / speed);
    this.miningProgress += delta / breakTime;

    if (this.miningProgress >= 1.0) {
      chunkGrid.setTile(targetTile.x, targetTile.y, 0); // Remove block
      const dropItem = def.dropItemId;
      const count = def.dropCount;
      this.miningTile = null;
      this.miningProgress = 0;
      return { broken: true, dropItemId: dropItem, dropCount: count };
    }

    return { broken: false };
  }

  // Place Tile / Wall
  public tryPlace(
    targetTile: { x: number; y: number },
    item: ItemDef,
    chunkGrid: ChunkGrid2D
  ): boolean {
    const tx = targetTile.x;
    const ty = targetTile.y;

    // Check reach distance (< 6 tiles)
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const dist = Math.hypot(tx + 0.5 - centerX, ty + 0.5 - centerY);
    if (dist > 6.0) return false;

    // Placing Background Wall
    if (item.placeWallId) {
      chunkGrid.setWall(tx, ty, item.placeWallId);
      return true;
    }

    // Placing Foreground Tile
    if (item.placeTileId) {
      // Don't place solid block over player
      const def = TILE_DEFINITIONS[item.placeTileId];
      if (def && def.isSolid) {
        const overlaps = (this.x < tx + 1 && this.x + this.width > tx && this.y < ty + 1 && this.y + this.height > ty);
        if (overlaps) return false;
      }

      chunkGrid.setTile(tx, ty, item.placeTileId);
      return true;
    }

    return false;
  }
}
