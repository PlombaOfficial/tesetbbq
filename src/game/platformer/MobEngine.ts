import { MobEntity, Particle2D, FloatingText } from '../../types/platformerGame';
import { ChunkGrid2D } from './ChunkGrid';
import { TILE_DEFINITIONS } from './tileRegistry';
import { platformerAudio } from './PlatformerAudio';

export interface ProjectileArrow {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
}

export class MobEngine2D {
  public mobs: MobEntity[] = [];
  public arrows: ProjectileArrow[] = [];
  public particles: Particle2D[] = [];
  public floatingTexts: FloatingText[] = [];

  public spawnInitialMobs(centerX: number, surfaceY: number) {
    this.mobs = [];

    // Surface Boars & Slimes
    for (let i = 0; i < 4; i++) {
      const ox = (Math.random() - 0.5) * 50;
      this.mobs.push({
        id: `mob_boar_${i}`,
        type: 'boar',
        name: 'Meadow Boar',
        x: centerX + ox,
        y: surfaceY - 2,
        vx: 0,
        vy: 0,
        width: 1.2,
        height: 0.9,
        health: 25,
        maxHealth: 25,
        damage: 0,
        facingLeft: false,
        isGrounded: false,
        state: 'patrol'
      });
    }

    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 60;
      this.mobs.push({
        id: `mob_slime_${i}`,
        type: 'slime',
        name: 'Forest Slime',
        x: centerX + ox,
        y: surfaceY - 2,
        vx: 0,
        vy: 0,
        width: 0.9,
        height: 0.8,
        health: 20,
        maxHealth: 20,
        damage: 8,
        facingLeft: false,
        isGrounded: false,
        state: 'patrol'
      });
    }
  }

  public update(
    delta: number,
    playerX: number,
    playerY: number,
    chunkGrid: ChunkGrid2D
  ): { playerDamage: number } {
    let totalPlayerDmg = 0;

    // 1. Update Mobs
    this.mobs.forEach((m) => {
      const dist = Math.hypot(playerX - m.x, playerY - m.y);

      // AI Behaviors
      if (m.type === 'slime') {
        if (m.isGrounded && Math.random() < 0.02) {
          m.vy = -7.5;
          m.vx = (playerX > m.x ? 1 : -1) * 3.5;
          m.facingLeft = m.vx < 0;
        }
      } else if (m.type === 'crawler' || m.type === 'guardian') {
        if (dist < 14.0) {
          m.state = 'chase';
          const dir = playerX > m.x ? 1 : -1;
          m.vx = dir * (m.type === 'crawler' ? 4.2 : 2.5);
          m.facingLeft = dir < 0;

          // Jump over 1-tile obstacle
          const frontTile = chunkGrid.getTile(Math.floor(m.x + (dir > 0 ? m.width + 0.1 : -0.1)), Math.floor(m.y + m.height - 0.2));
          if (frontTile !== 0 && m.isGrounded) {
            m.vy = -8.0;
          }
        }
      } else if (m.type === 'bat') {
        // Flying mob
        if (dist < 16.0) {
          const dx = (playerX - m.x) / dist;
          const dy = (playerY - m.y) / dist;
          m.vx = dx * 4.0;
          m.vy = dy * 4.0;
        }
      } else {
        // Boar / Peaceful: wander
        if (Math.random() < 0.015) {
          m.vx = (Math.random() - 0.5) * 3.0;
          m.facingLeft = m.vx < 0;
        }
      }

      // Gravity for ground mobs
      if (m.type !== 'bat') {
        m.vy += 26.0 * delta;
      }

      // Apply Movement & Collisions
      m.x += m.vx * delta;
      m.y += m.vy * delta;

      // Simple ground check
      const groundTileY = Math.floor(m.y + m.height);
      const groundTileX = Math.floor(m.x + m.width / 2);
      const groundTile = chunkGrid.getTile(groundTileX, groundTileY);
      const def = TILE_DEFINITIONS[groundTile];

      if (def && (def.isSolid || def.isPlatform) && m.vy >= 0) {
        m.y = groundTileY - m.height;
        m.vy = 0;
        m.isGrounded = true;
      } else {
        m.isGrounded = false;
      }

      // Check player melee collision
      if (m.damage > 0 && dist < 1.1) {
        totalPlayerDmg += m.damage;
      }
    });

    // 2. Update Arrows
    this.arrows = this.arrows.filter((arrow) => {
      arrow.x += arrow.vx * delta;
      arrow.y += arrow.vy * delta;
      arrow.vy += 12.0 * delta; // Arrow drop
      arrow.life -= delta;

      // Check hit tile
      const hitTile = chunkGrid.getTile(Math.floor(arrow.x), Math.floor(arrow.y));
      if (hitTile !== 0 && TILE_DEFINITIONS[hitTile]?.isSolid) {
        return false;
      }

      // Check hit mob
      for (const m of this.mobs) {
        if (arrow.x >= m.x && arrow.x <= m.x + m.width && arrow.y >= m.y && arrow.y <= m.y + m.height) {
          this.damageMob(m, arrow.damage);
          return false;
        }
      }

      return arrow.life > 0;
    });

    // 3. Update Particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 15.0 * delta;
      p.life -= delta;
      return p.life > 0;
    });

    // 4. Update Floating Damage Texts
    this.floatingTexts = this.floatingTexts.filter((t) => {
      t.y -= delta * 1.5;
      t.life -= delta;
      return t.life > 0;
    });

    // Clean dead mobs
    this.mobs = this.mobs.filter((m) => m.health > 0);

    return { playerDamage: totalPlayerDmg };
  }

  // Attack mobs in player's melee reach arc
  public attackMelee(playerX: number, playerY: number, facingLeft: boolean, damage: number) {
    platformerAudio.playAttackSwing();

    const reach = 2.4;
    const attackX = playerX + (facingLeft ? -reach : reach / 2);

    this.mobs.forEach((m) => {
      const dist = Math.hypot((m.x + m.width / 2) - (playerX + 0.4), (m.y + m.height / 2) - (playerY + 0.8));
      const inFront = facingLeft ? m.x < playerX + 0.4 : m.x + m.width > playerX;

      if (dist < reach && inFront) {
        this.damageMob(m, damage);
        m.vx = (facingLeft ? -1 : 1) * 8.0; // Knockback
        m.vy = -4.0;
      }
    });
  }

  // Shoot arrow
  public fireArrow(playerX: number, playerY: number, targetX: number, targetY: number, damage: number) {
    platformerAudio.playAttackSwing();

    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const len = Math.hypot(dx, dy);
    const speed = 18.0;

    this.arrows.push({
      id: `arrow_${Date.now()}`,
      x: playerX + 0.4,
      y: playerY + 0.7,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed,
      damage,
      life: 4.0
    });
  }

  public damageMob(mob: MobEntity, amount: number) {
    mob.health -= amount;
    platformerAudio.playDamageHit();

    // Spawn floating number
    this.floatingTexts.push({
      id: `txt_${Date.now()}_${Math.random()}`,
      x: mob.x + mob.width / 2,
      y: mob.y - 0.3,
      text: `-${amount}`,
      color: '#f43f5e',
      life: 0.8
    });

    // Spawn hit particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: mob.x + mob.width / 2,
        y: mob.y + mob.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: '#f43f5e',
        size: 3,
        life: 0.4,
        maxLife: 0.4
      });
    }
  }
}
