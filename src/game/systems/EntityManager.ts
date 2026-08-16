import * as THREE from 'three';
import { EntityState, EntityType } from '../../types/horrorGame';
import { spatialAudio } from '../engine/SpatialAudio';
import { LevelGenerator } from '../engine/LevelGenerator';

export class EntityInstance {
  public data: EntityState;
  public mesh: THREE.Group;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  private stateTimer: number = 0;
  private soundTimer: number = 0;

  constructor(data: EntityState) {
    this.data = data;
    this.mesh = this.createEntityMesh(data.type);
    this.mesh.position.set(data.x, data.y, data.z);
  }

  private createEntityMesh(type: EntityType): THREE.Group {
    const group = new THREE.Group();

    if (type === 'smiler') {
      // Dark void with glowing crescent teeth & eyes
      const headMat = new THREE.MeshBasicMaterial({ color: 0x030303 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), headMat);
      head.position.y = 1.6;
      group.add(head);

      // Glowing Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
      eyeL.position.set(-0.16, 1.7, 0.45);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
      eyeR.position.set(0.16, 1.7, 0.45);
      group.add(eyeL, eyeR);

      // Glowing Smile Arc
      const smileGeo = new THREE.TorusGeometry(0.22, 0.03, 8, 16, Math.PI);
      const smileMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const smile = new THREE.Mesh(smileGeo, smileMat);
      smile.position.set(0, 1.5, 0.46);
      smile.rotation.z = Math.PI;
      group.add(smile);

      const smileLight = new THREE.PointLight(0xffffff, 0.6, 3.0);
      smileLight.position.set(0, 1.6, 0.5);
      group.add(smileLight);
    } else if (type === 'listener') {
      // Tall elongated humanoid with blind bandages / fungal head
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222220, roughness: 0.9 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 2.2, 8), bodyMat);
      body.position.y = 1.2;
      group.add(body);

      const headMat = new THREE.MeshStandardMaterial({ color: 0x4a483a, roughness: 0.7 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), headMat);
      head.position.y = 2.4;
      group.add(head);
    } else {
      // Stalker / Mimic - Dark shadow silhouette
      const shadowMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 1.0,
        transparent: true,
        opacity: 0.88
      });
      const shadowBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 2.0, 8), shadowMat);
      shadowBody.position.y = 1.0;
      group.add(shadowBody);

      const shadowHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), shadowMat);
      shadowHead.position.y = 2.1;
      group.add(shadowHead);
    }

    return group;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerSprinting: boolean,
    playerFlashlightOn: boolean,
    colliders: THREE.Box3[]
  ) {
    const distToPlayer = this.mesh.position.distanceTo(playerPos);
    this.stateTimer += delta;
    this.soundTimer += delta;

    // Entity Ambient Audio Cue
    if (this.soundTimer > 12.0) {
      this.soundTimer = Math.random() * 4;
      if (this.data.type === 'listener') {
        spatialAudio.playEntitySound('listener_roar', distToPlayer);
      } else if (this.data.type === 'mimic') {
        spatialAudio.playEntitySound('mimic_whisper', distToPlayer);
      } else if (this.data.type === 'smiler') {
        spatialAudio.playEntitySound('smiler_sub', distToPlayer);
      }
    }

    // AI Behavior Switch
    switch (this.data.type) {
      case 'listener':
        // Blind Sound Hunter: Sprints only when player is running nearby
        if (playerSprinting && distToPlayer < 24.0) {
          this.data.state = 'hunting';
          const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
          this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
          this.moveTowards(dir, 6.2 * delta, colliders);
        } else {
          this.wander(delta, colliders, 1.8);
        }
        break;

      case 'stalker':
        // Stalker: creeps closer from behind, retreats if within direct view
        if (distToPlayer < 18.0 && !playerFlashlightOn) {
          const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
          this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
          this.moveTowards(dir, 2.5 * delta, colliders);
        } else {
          this.wander(delta, colliders, 1.2);
        }
        break;

      case 'smiler':
        // Lurks in darkness
        if (playerFlashlightOn && distToPlayer < 10.0) {
          // Trigger aggressive charge
          const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
          this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
          this.moveTowards(dir, 5.5 * delta, colliders);
        } else {
          // Idle in darkness
          this.data.state = 'idle';
        }
        break;

      default:
        this.wander(delta, colliders, 1.5);
        break;
    }

    // Sync state data position
    this.data.x = this.mesh.position.x;
    this.data.y = this.mesh.position.y;
    this.data.z = this.mesh.position.z;
  }

  private wander(delta: number, colliders: THREE.Box3[], speed: number) {
    if (this.stateTimer > 4.0) {
      this.stateTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      this.velocity.set(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
      this.mesh.rotation.y = -angle;
    }
    this.moveTowards(this.velocity, delta, colliders);
  }

  private moveTowards(moveVec: THREE.Vector3, deltaFactor: number, colliders: THREE.Box3[]) {
    const nextX = this.mesh.position.x + moveVec.x * deltaFactor;
    const nextZ = this.mesh.position.z + moveVec.z * deltaFactor;

    if (!LevelGenerator.checkCollision(nextX, this.mesh.position.z, 0.4, colliders)) {
      this.mesh.position.x = nextX;
    }
    if (!LevelGenerator.checkCollision(this.mesh.position.x, nextZ, 0.4, colliders)) {
      this.mesh.position.z = nextZ;
    }
  }
}

export class EntityManager {
  public entities: EntityInstance[] = [];

  public spawnEntities(allowedTypes: EntityType[], count: number, spawnCenter: THREE.Vector3, levelIdx: number): THREE.Group {
    const group = new THREE.Group();
    this.entities = [];

    for (let i = 0; i < count; i++) {
      const type = allowedTypes[i % allowedTypes.length];
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetZ = (Math.random() - 0.5) * 40;

      const state: EntityState = {
        id: `ent_${levelIdx}_${i + 1}`,
        type,
        name: type.toUpperCase(),
        x: spawnCenter.x + offsetX,
        y: 0,
        z: spawnCenter.z + offsetZ,
        yaw: 0,
        state: 'wandering',
        levelIndex: levelIdx
      };

      const instance = new EntityInstance(state);
      this.entities.push(instance);
      group.add(instance.mesh);
    }

    return group;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerSprinting: boolean,
    playerFlashlightOn: boolean,
    colliders: THREE.Box3[]
  ): boolean {
    let playerHit = false;

    this.entities.forEach((ent) => {
      ent.update(delta, playerPos, playerSprinting, playerFlashlightOn, colliders);

      // Check kill radius
      if (ent.mesh.position.distanceTo(playerPos) < 1.3) {
        playerHit = true;
      }
    });

    return playerHit;
  }
}
