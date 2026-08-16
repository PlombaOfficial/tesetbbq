import * as THREE from 'three';
import { spatialAudio } from '../engine/SpatialAudio';
import { LevelGenerator } from '../engine/LevelGenerator';

export interface PlayerInventory {
  almondWaterCount: number;
  batteryCount: number;
  flareCount: number;
  chalkUses: number;
  hasMasterKey: boolean;
  hasWalkieTalkie: boolean;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;

  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public yaw: number = 0;
  public pitch: number = 0;

  // Stats
  public health: number = 100;
  public sanity: number = 100;
  public stamina: number = 100;
  public battery: number = 100;
  public isFlashlightOn: boolean = true;
  public isAlive: boolean = true;

  public inventory: PlayerInventory = {
    almondWaterCount: 1,
    batteryCount: 2,
    flareCount: 1,
    chalkUses: 10,
    hasMasterKey: false,
    hasWalkieTalkie: true
  };

  // Movement keys
  private keys: Record<string, boolean> = {};
  private isPointerLocked: boolean = false;
  private headBobTimer: number = 0;
  private footstepTimer: number = 0;

  // Speeds
  private walkSpeed: number = 4.2;
  private sprintSpeed: number = 7.0;
  private isSprinting: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, initialPos: THREE.Vector3) {
    this.camera = camera;
    this.position = initialPos.clone();
    this.camera.position.copy(this.position);

    // Flashlight SpotLight
    this.flashlight = new THREE.SpotLight(0xfff5db, 3.5, 22.0, Math.PI / 5, 0.45, 1.8);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.bias = -0.001;
    this.flashlightTarget = new THREE.Object3D();

    this.setupInputs();
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyF') {
        this.toggleFlashlight();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || !this.isAlive) return;

      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Clamp vertical pitch (-85 to +85 degrees)
      this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
    });
  }

  public requestPointerLock(domElement: HTMLElement) {
    domElement.requestPointerLock();
    this.isPointerLocked = true;
  }

  public toggleFlashlight() {
    if (this.battery <= 0) return;
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.intensity = this.isFlashlightOn ? 3.5 : 0;
    spatialAudio.playFlashlightClick();
  }

  public update(delta: number, colliders: THREE.Box3[], surfaceType: 'carpet' | 'concrete' | 'puddle') {
    if (!this.isAlive) return;

    // 1. Battery Consumption
    if (this.isFlashlightOn && this.battery > 0) {
      this.battery = Math.max(0, this.battery - delta * 1.2); // ~80s battery
      if (this.battery <= 0) {
        this.isFlashlightOn = false;
        this.flashlight.intensity = 0;
      }
    }

    // 2. Sanity Drain / Heartbeat
    if (!this.isFlashlightOn) {
      this.sanity = Math.max(0, this.sanity - delta * 0.8);
    }
    spatialAudio.playHeartbeat(this.sanity);

    // 3. Movement & Stamina
    const isMoving = this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];
    this.isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']) && isMoving && this.stamina > 10;

    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - delta * 22);
    } else {
      this.stamina = Math.min(100, this.stamina + delta * 14);
    }

    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    // Movement Vectors
    const moveX = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
    const moveZ = (this.keys['KeyS'] ? 1 : 0) - (this.keys['KeyW'] ? 1 : 0);

    const inputVec = new THREE.Vector2(moveX, moveZ);
    if (inputVec.lengthSq() > 0) {
      inputVec.normalize();
    }

    // Transform by yaw angle
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const targetVelocity = new THREE.Vector3()
      .addScaledVector(forward, -inputVec.y * currentSpeed)
      .addScaledVector(right, inputVec.x * currentSpeed);

    this.velocity.lerp(targetVelocity, 12 * delta);

    // Collision detection & movement execution (separate X and Z for smooth wall sliding)
    const nextX = this.position.x + this.velocity.x * delta;
    if (!LevelGenerator.checkCollision(nextX, this.position.z, 0.45, colliders)) {
      this.position.x = nextX;
    }

    const nextZ = this.position.z + this.velocity.z * delta;
    if (!LevelGenerator.checkCollision(this.position.x, nextZ, 0.45, colliders)) {
      this.position.z = nextZ;
    }

    // 4. Head Bobbing & Footstep Audio
    if (isMoving && this.velocity.lengthSq() > 0.5) {
      this.headBobTimer += delta * (this.isSprinting ? 14 : 9);
      this.footstepTimer += delta * (this.isSprinting ? 14 : 9);

      if (this.footstepTimer > Math.PI) {
        this.footstepTimer = 0;
        spatialAudio.playFootstep(surfaceType);
      }
    } else {
      this.headBobTimer = 0;
    }

    const bobOffset = Math.sin(this.headBobTimer) * 0.05;
    this.camera.position.set(this.position.x, this.position.y + bobOffset, this.position.z);

    // Update Camera Euler
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Update Flashlight Direction
    this.flashlight.position.copy(this.camera.position);
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forwardDir);
    this.flashlight.target = this.flashlightTarget;
  }

  // Use consumable item
  public drinkAlmondWater() {
    if (this.inventory.almondWaterCount <= 0) return;
    this.inventory.almondWaterCount--;
    this.sanity = Math.min(100, this.sanity + 45);
    this.health = Math.min(100, this.health + 25);
    spatialAudio.playFootstep('puddle');
  }

  public reloadBattery() {
    if (this.inventory.batteryCount <= 0 || this.battery >= 90) return;
    this.inventory.batteryCount--;
    this.battery = 100;
    this.isFlashlightOn = true;
    this.flashlight.intensity = 3.5;
    spatialAudio.playFlashlightClick();
  }
}
