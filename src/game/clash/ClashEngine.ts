import { 
  ClashRoomState, 
  PlantInstance, 
  ZombieInstance, 
  ProjectileInstance, 
  ParticleClash, 
  FloatingNumber, 
  Faction 
} from '../../types/pvpClash';
import { PLANT_REGISTRY, ZOMBIE_REGISTRY, MAP_CONFIGS } from './unitRegistry';
import { clashAudio } from './ClashAudio';

export class ClashSimulationEngine {
  public state: ClashRoomState['matchState'];
  public mapType: ClashRoomState['map'];
  public particles: ParticleClash[] = [];
  public floatingNumbers: FloatingNumber[] = [];

  constructor(mapType: ClashRoomState['map'] = 'verdant_grove') {
    this.mapType = mapType;
    this.state = {
      matchTime: 0,
      plantSun: 150,
      zombieBrains: 150,
      plantBaseHp: 100,
      laneCleaners: [true, true, true, true, true],
      plants: {},
      zombies: [],
      projectiles: [],
      winner: null,
      stats: {
        plantDamage: 0,
        zombieDamage: 0,
        plantsSummoned: 0,
        zombiesSummoned: 0,
        bestLane: 2
      }
    };
  }

  public update(delta: number): { winner: Faction | null } {
    if (this.state.winner) return { winner: this.state.winner };

    this.state.matchTime += delta;

    // 1. Asymmetric Economy Tick
    this.state.plantSun = Math.min(999, this.state.plantSun + 6.0 * delta);
    this.state.zombieBrains = Math.min(999, this.state.zombieBrains + 5.5 * delta);

    const mapConfig = MAP_CONFIGS[this.mapType];

    // 2. Plants Simulation
    Object.values(this.state.plants).forEach((plant) => {
      const def = PLANT_REGISTRY[plant.cardId];
      if (!def) return;

      if (plant.boostTimer > 0) plant.boostTimer -= delta;

      // Solar Generators
      if (def.plantRole === 'sun') {
        const interval = plant.boostTimer > 0 ? def.attackInterval * 0.5 : def.attackInterval;
        if (this.state.matchTime - plant.lastAttackTime >= interval) {
          plant.lastAttackTime = this.state.matchTime;
          const sunGain = def.id === 'plant_prismsun' ? 75 : 25;
          this.state.plantSun = Math.min(999, this.state.plantSun + sunGain);
          clashAudio.playResourceCollect();

          this.floatingNumbers.push({
            id: `sun_${Date.now()}_${Math.random()}`,
            x: plant.col,
            y: plant.row - 0.3,
            text: `+${sunGain} ☀`,
            color: '#facc15',
            life: 1.0
          });
        }
      }

      // Instant Bombs (Cherry Detonator)
      if (def.isInstantBomb) {
        if (this.state.matchTime - plant.lastAttackTime >= 1.0) {
          // Explode in 3x3 area
          clashAudio.playExplosion();
          this.state.zombies.forEach((z) => {
            if (Math.abs(z.lane - plant.row) <= 1 && Math.abs(z.x - plant.col) <= 1.5) {
              z.health -= def.attackDamage;
              this.state.stats.plantDamage += def.attackDamage;
            }
          });
          delete this.state.plants[`${plant.col}_${plant.row}`];
          return;
        }
      }

      // Shooting Plants
      if (def.plantRole === 'shooter' || def.plantRole === 'slow') {
        // Check if there are zombies ahead in this lane
        const zombiesInLane = this.state.zombies.filter(
          (z) => z.lane === plant.row && z.x >= plant.col && !z.isBurrowed && !z.isHypnotized
        );

        const attackRate = plant.boostTimer > 0 ? def.attackInterval * 0.5 : def.attackInterval;

        if (zombiesInLane.length > 0 && this.state.matchTime - plant.lastAttackTime >= attackRate) {
          plant.lastAttackTime = this.state.matchTime;
          clashAudio.playPlantShoot();

          if (def.projectileType === 'plasma') {
            // Instant piercing laser beam
            zombiesInLane.forEach((z) => {
              z.health -= def.attackDamage;
              this.state.stats.plantDamage += def.attackDamage;
            });
          } else {
            // Spawn Projectile
            this.state.projectiles.push({
              id: `proj_${Date.now()}_${Math.random()}`,
              lane: plant.row,
              x: plant.col + 0.6,
              y: plant.row,
              vx: 5.5,
              damage: def.attackDamage,
              type: def.projectileType as ProjectileInstance['type'],
              isLobbed: def.projectileType === 'melon'
            });
          }
        }
      }

      // Trap plants (Spike Bramble)
      if (def.plantRole === 'trap') {
        this.state.zombies.forEach((z) => {
          if (z.lane === plant.row && Math.abs(z.x - plant.col) < 0.6 && !z.isFlying) {
            z.health -= def.attackDamage * delta;
            this.state.stats.plantDamage += def.attackDamage * delta;
          }
        });
      }
    });

    // 3. Projectiles Update & Collisions
    this.state.projectiles = this.state.projectiles.filter((p) => {
      p.x += p.vx * delta;

      // Find first target zombie in lane
      const targetZombie = this.state.zombies.find(
        (z) => z.lane === p.lane && Math.abs(z.x - p.x) < 0.4 && !z.isBurrowed && !z.isHypnotized
      );

      if (targetZombie) {
        let dmg = p.damage;
        if (targetZombie.armor > 0 && p.type !== 'plasma') {
          dmg = Math.max(5, dmg - targetZombie.armor * 0.4);
        }

        targetZombie.health -= dmg;
        this.state.stats.plantDamage += dmg;

        if (p.type === 'frost') {
          targetZombie.isSlowed = true;
          targetZombie.slowTimer = 3.5;
        }

        // Floating damage number
        this.floatingNumbers.push({
          id: `dmg_${Date.now()}_${Math.random()}`,
          x: targetZombie.x,
          y: targetZombie.lane - 0.2,
          text: `-${Math.round(dmg)}`,
          color: p.type === 'frost' ? '#38bdf8' : '#f43f5e',
          life: 0.6
        });

        // Spawn hit particle
        for (let i = 0; i < 4; i++) {
          this.particles.push({
            id: `p_${Math.random()}`,
            x: targetZombie.x,
            y: targetZombie.lane,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: p.type === 'frost' ? '#38bdf8' : '#4ade80',
            size: 3,
            life: 0.3,
            maxLife: 0.3
          });
        }

        return false; // Destroy projectile
      }

      return p.x < 9.5; // Destroy if out of lane
    });

    // 4. Zombies Simulation
    this.state.zombies.forEach((zombie) => {
      // Slow debuff timer
      if (zombie.slowTimer > 0) {
        zombie.slowTimer -= delta;
        if (zombie.slowTimer <= 0) zombie.isSlowed = false;
      }

      let currentSpeed = zombie.speed;
      if (zombie.isSlowed) currentSpeed *= 0.5;

      // Check Hazard Tile (toxic puddle slows, boost speed accelerates)
      const currentTileKey = `${Math.floor(zombie.x)}_${zombie.lane}`;
      const hazard = mapConfig.hazards[currentTileKey];
      if (hazard === 'toxic_puddle') currentSpeed *= 0.7;
      if (hazard === 'boost_speed') currentSpeed *= 1.35;

      // Check if there is a plant in front of zombie
      const plantAheadKey = `${Math.floor(zombie.x)}_${zombie.lane}`;
      const plant = this.state.plants[plantAheadKey];

      if (plant && !zombie.isFlying && !zombie.isBurrowed && !zombie.isHypnotized) {
        const plantDef = PLANT_REGISTRY[plant.cardId];

        // Pole-Vault Stalker jumps over first plant
        if (zombie.cardId === 'zomb_polevault' && !zombie.isVaulted) {
          zombie.isVaulted = true;
          zombie.x -= 1.2; // Leap over plant
          return;
        }

        // Hypno-shroom effect
        if (plantDef?.id === 'plant_hypnoshroom') {
          zombie.isHypnotized = true;
          delete this.state.plants[plantAheadKey];
          return;
        }

        // Bite plant
        if (this.state.matchTime - zombie.lastBiteTime >= zombie.biteInterval) {
          zombie.lastBiteTime = this.state.matchTime;
          plant.health -= zombie.biteDamage;
          this.state.stats.zombieDamage += zombie.biteDamage;
          clashAudio.playZombieBite();

          if (plant.health <= 0) {
            delete this.state.plants[plantAheadKey];
            // Reward brains to undead player
            this.state.zombieBrains = Math.min(999, this.state.zombieBrains + 30);
          }
        }
      } else {
        // Move forward
        if (zombie.isHypnotized) {
          zombie.x += currentSpeed * delta; // Moves right attacking zombies
        } else {
          zombie.x -= currentSpeed * delta; // Moves left attacking base
        }

        // Miner unburrows at col 3.5
        if (zombie.isBurrowed && zombie.x <= 3.5) {
          zombie.isBurrowed = false;
        }
      }

      // Check Final Line Cross (x <= 0)
      if (!zombie.isHypnotized && zombie.x <= 0) {
        if (this.state.laneCleaners[zombie.lane]) {
          // Trigger Lawn Mower!
          clashAudio.playLawnMower();
          this.state.laneCleaners[zombie.lane] = false;
          // Wipe all non-flying zombies on this lane
          this.state.zombies = this.state.zombies.filter(
            (otherZ) => otherZ.lane !== zombie.lane || otherZ.isFlying
          );
        } else {
          // Breach into base!
          this.state.plantBaseHp = Math.max(0, this.state.plantBaseHp - 25);
          zombie.health = 0; // Sacrificed into core
        }
      }
    });

    // Clean dead zombies
    this.state.zombies = this.state.zombies.filter((z) => z.health > 0);

    // 5. Update Particles & Floating Text
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta;
      return p.life > 0;
    });

    this.floatingNumbers = this.floatingNumbers.filter((f) => {
      f.y -= delta * 0.8;
      f.life -= delta;
      return f.life > 0;
    });

    // 6. Check Win Condition
    if (this.state.plantBaseHp <= 0) {
      this.state.winner = 'ZOMBIES';
      clashAudio.playVictory();
    } else if (this.state.matchTime >= 420) {
      // 7 minutes survival
      this.state.winner = 'PLANTS';
      clashAudio.playVictory();
    }

    return { winner: this.state.winner };
  }

  // Action: Place Plant
  public placePlant(col: number, row: number, cardId: string): boolean {
    const key = `${col}_${row}`;
    if (col < 0 || col > 7 || row < 0 || row > 4) return false;
    if (this.state.plants[key]) return false; // Occupied

    const def = PLANT_REGISTRY[cardId];
    if (!def || this.state.plantSun < def.cost) return false;

    this.state.plantSun -= def.cost;
    this.state.stats.plantsSummoned++;

    this.state.plants[key] = {
      id: `p_${Date.now()}_${Math.random()}`,
      cardId,
      col,
      row,
      health: def.health,
      maxHealth: def.health,
      lastAttackTime: this.state.matchTime,
      boostTimer: 0
    };

    clashAudio.playPlantShoot();
    return true;
  }

  // Action: Summon Zombie
  public summonZombie(lane: number, cardId: string): boolean {
    if (lane < 0 || lane > 4) return false;
    const def = ZOMBIE_REGISTRY[cardId];
    if (!def || this.state.zombieBrains < def.cost) return false;

    this.state.zombieBrains -= def.cost;
    this.state.stats.zombiesSummoned++;

    this.state.zombies.push({
      id: `z_${Date.now()}_${Math.random()}`,
      cardId,
      lane,
      x: 8.8,
      health: def.health,
      maxHealth: def.health,
      speed: def.speed,
      biteDamage: def.biteDamage,
      lastBiteTime: 0,
      isSlowed: false,
      slowTimer: 0,
      isFlying: def.isFlying,
      isBurrowed: def.canBurrow
    });

    clashAudio.playZombieBite();
    return true;
  }

  // Action: Cast Commander Spell
  public castSpell(spellId: string, lane?: number, cell?: { col: number; row: number }): boolean {
    if (spellId === 'spell_sun_surge') {
      this.state.plantSun = Math.min(999, this.state.plantSun + 150);
      clashAudio.playResourceCollect();
      return true;
    }

    if (spellId === 'spell_blizzard') {
      this.state.zombies.forEach((z) => {
        z.isSlowed = true;
        z.slowTimer = 4.5;
      });
      clashAudio.playExplosion();
      return true;
    }

    if (spellId === 'spell_unholy_rush') {
      this.state.zombies.forEach((z) => {
        z.speed *= 1.5;
      });
      return true;
    }

    if (spellId === 'spell_horde_surge') {
      for (let l = 0; l < 5; l++) {
        this.summonZombie(l, 'zomb_walker');
      }
      return true;
    }

    if (spellId === 'spell_overcharge' && lane !== undefined) {
      Object.values(this.state.plants).forEach((p) => {
        if (p.row === lane) p.boostTimer = 8.0;
      });
      return true;
    }

    return false;
  }
}
