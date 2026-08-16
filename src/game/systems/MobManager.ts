import * as THREE from 'three';
import { MobState } from '../../types/voxelGame';
import { ChunkManager } from '../voxel/ChunkManager';
import { voxelAudio } from '../audio/VoxelAudio';

export class MobInstance {
  public data: MobState;
  public mesh: THREE.Group;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  private stateTimer: number = 0;

  constructor(data: MobState) {
    this.data = data;
    this.mesh = this.createMobMesh(data.type);
    this.mesh.position.set(data.x, data.y, data.z);
  }

  private createMobMesh(type: MobState['type']): THREE.Group {
    const group = new THREE.Group();

    if (type === 'boar') {
      // Quadruped Boar
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), bodyMat);
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), bodyMat);
      head.position.set(0, 0.7, 0.8);
      group.add(head);

      // Tusks
      const tuskMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
      const tuskL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), tuskMat);
      tuskL.position.set(-0.25, 0.6, 1.1);
      const tuskR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), tuskMat);
      tuskR.position.set(0.25, 0.6, 1.1);
      group.add(tuskL, tuskR);
    } else if (type === 'golem') {
      // Heavy Stone Golem with glowing core
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), stoneMat);
      torso.position.y = 1.4;
      torso.castShadow = true;
      group.add(torso);

      const coreMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), coreMat);
      core.position.set(0, 1.5, 0.42);
      group.add(core);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), stoneMat);
      head.position.y = 2.4;
      group.add(head);
    } else if (type === 'boss_titan') {
      // Colossal Astral Titan Boss
      const titanMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.4, metalness: 0.6 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 1.6), titanMat);
      torso.position.y = 3.2;
      torso.castShadow = true;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), titanMat);
      head.position.y = 5.2;
      group.add(head);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.2), eyeMat);
      eye.position.set(0, 5.3, 0.72);
      group.add(eye);
    } else {
      // Crawler / Lurker (Shadow arachnid)
      const crawlerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), crawlerMat);
      body.position.y = 0.3;
      body.castShadow = true;
      group.add(body);

      // Red glowing eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eyeL.position.set(-0.25, 0.35, 0.45);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eyeR.position.set(0.25, 0.35, 0.45);
      group.add(eyeL, eyeR);
    }

    return group;
  }

  public update(delta: number, playerPos: THREE.Vector3, chunkManager: ChunkManager): boolean {
    const distToPlayer = this.mesh.position.distanceTo(playerPos);
    this.stateTimer += delta;

    // AI Behaviors
    if (this.data.type === 'crawler' || this.data.type === 'lurker') {
      // Hostile night/cave predators: chase player if within 18m
      if (distToPlayer < 18.0) {
        this.data.state = 'chasing';
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        dir.y = 0;
        this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
        this.move(dir, 4.5 * delta, chunkManager);
      } else {
        this.wander(delta, chunkManager, 1.8);
      }
    } else if (this.data.type === 'boss_titan') {
      // Boss: slowly walks toward player and summons attacks
      if (distToPlayer < 35.0) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        dir.y = 0;
        this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
        this.move(dir, 2.8 * delta, chunkManager);
      }
    } else {
      // Passive / Neutral: wander peacefully
      this.wander(delta, chunkManager, 1.2);
    }

    // Apply gravity
    this.mesh.position.y -= 14 * delta;
    const groundY = Math.floor(this.mesh.position.y);
    const belowBlock = chunkManager.getBlock(Math.floor(this.mesh.position.x), groundY, Math.floor(this.mesh.position.z));
    if (belowBlock !== 0) {
      this.mesh.position.y = groundY + 1.0;
    }

    this.data.x = this.mesh.position.x;
    this.data.y = this.mesh.position.y;
    this.data.z = this.mesh.position.z;

    // Return true if attacking player in melee range (< 1.5m)
    return (this.data.type !== 'boar' && distToPlayer < 1.6);
  }

  private wander(delta: number, chunkManager: ChunkManager, speed: number) {
    if (this.stateTimer > 3.5) {
      this.stateTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      this.velocity.set(Math.cos(angle), 0, Math.sin(angle));
      this.mesh.rotation.y = -angle;
    }
    this.move(this.velocity, speed * delta, chunkManager);
  }

  private move(dir: THREE.Vector3, step: number, chunkManager: ChunkManager) {
    const nextX = this.mesh.position.x + dir.x * step;
    const nextZ = this.mesh.position.z + dir.z * step;

    // Basic obstruction check
    const blockAhead = chunkManager.getBlock(Math.floor(nextX), Math.floor(this.mesh.position.y), Math.floor(nextZ));
    if (blockAhead === 0) {
      this.mesh.position.x = nextX;
      this.mesh.position.z = nextZ;
    } else {
      // Try step-up
      const blockAbove = chunkManager.getBlock(Math.floor(nextX), Math.floor(this.mesh.position.y + 1), Math.floor(nextZ));
      if (blockAbove === 0) {
        this.mesh.position.x = nextX;
        this.mesh.position.y += 1.0;
        this.mesh.position.z = nextZ;
      }
    }
  }

  public takeDamage(amount: number): boolean {
    this.data.health -= amount;
    voxelAudio.playDamageHit();
    return this.data.health <= 0;
  }
}

export class MobManager {
  public mobs: MobInstance[] = [];

  public spawnInitialMobs(centerPos: THREE.Vector3, count: number): THREE.Group {
    const group = new THREE.Group();
    this.mobs = [];

    const types: MobState['type'][] = ['boar', 'crawler', 'golem', 'lurker'];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const offsetX = (Math.random() - 0.5) * 50;
      const offsetZ = (Math.random() - 0.5) * 50;

      const state: MobState = {
        id: `mob_${Date.now()}_${i + 1}`,
        type,
        name: type.toUpperCase(),
        x: centerPos.x + offsetX,
        y: centerPos.y + 2,
        z: centerPos.z + offsetZ,
        yaw: 0,
        health: type === 'golem' ? 40 : type === 'boar' ? 15 : 20,
        maxHealth: type === 'golem' ? 40 : type === 'boar' ? 15 : 20,
        state: 'wandering'
      };

      const instance = new MobInstance(state);
      this.mobs.push(instance);
      group.add(instance.mesh);
    }

    return group;
  }

  public update(delta: number, playerPos: THREE.Vector3, chunkManager: ChunkManager): boolean {
    let playerHit = false;
    this.mobs.forEach((m) => {
      const isAttacking = m.update(delta, playerPos, chunkManager);
      if (isAttacking) playerHit = true;
    });
    return playerHit;
  }
}
