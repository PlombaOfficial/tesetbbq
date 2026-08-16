import * as THREE from 'three';
import { LevelDefinition, WorldItem, ItemType } from '../../types/horrorGame';
import { TextureAtlas } from './TextureAtlas';

export interface LevelGenerationResult {
  sceneGroup: THREE.Group;
  colliderBoxes: THREE.Box3[];
  spawnPosition: THREE.Vector3;
  elevatorPosition: THREE.Vector3;
  lightFixtures: Array<{ mesh: THREE.Mesh; light: THREE.PointLight; baseIntensity: number; flickerOffset: number }>;
  doors: Map<string, { group: THREE.Group; isOpen: boolean; isLocked: boolean; pivot: THREE.Group }>;
  items: WorldItem[];
  grid: number[][];
  gridSize: number;
  tileSize: number;
}

// Seeded pseudorandom generator
class PRNG {
  private s: number;
  constructor(seed: number) {
    this.s = seed;
  }
  public next(): number {
    this.s = (this.s * 9301 + 49297) % 233280;
    return this.s / 233280;
  }
}

export class LevelGenerator {
  public static generate(levelDef: LevelDefinition, seed: number): LevelGenerationResult {
    const rng = new PRNG(seed + levelDef.id * 1000);
    const sceneGroup = new THREE.Group();
    const colliderBoxes: THREE.Box3[] = [];
    const lightFixtures: LevelGenerationResult['lightFixtures'] = [];
    const doors: LevelGenerationResult['doors'] = new Map();
    const items: WorldItem[] = [];

    const gridSize = 22;
    const tileSize = 4.0; // 4 meters per grid cell
    const halfH = levelDef.ceilingHeight;

    // 1. Generate Maze / Room Grid (0=Floor, 1=Wall, 2=Door, 4=Elevator, 5=Item)
    const grid: number[][] = [];
    for (let x = 0; x < gridSize; x++) {
      grid[x] = [];
      for (let z = 0; z < gridSize; z++) {
        // Outer boundaries are solid walls
        if (x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1) {
          grid[x][z] = 1;
        } else {
          // Internal walls with corridor spacing
          if (x % 2 === 0 && z % 2 === 0) {
            grid[x][z] = rng.next() > 0.35 ? 1 : 0;
          } else if (rng.next() > 0.72) {
            grid[x][z] = 1;
          } else {
            grid[x][z] = 0;
          }
        }
      }
    }

    // Spawn Room (Center 3x3 open floor)
    const spawnX = 2;
    const spawnZ = 2;
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        grid[spawnX + dx][spawnZ + dz] = 0;
      }
    }

    // Elevator Exit Room (Far corner open floor)
    const elevX = gridSize - 4;
    const elevZ = gridSize - 4;
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        grid[elevX + dx][elevZ + dz] = 0;
      }
    }
    grid[elevX + 1][elevZ + 1] = 4; // Elevator mark

    // Place Doors in choke points
    let doorIndex = 1;
    for (let x = 3; x < gridSize - 3; x++) {
      for (let z = 3; z < gridSize - 3; z++) {
        if (grid[x][z] === 0) {
          // If surrounded by two walls horizontally or vertically
          const horizWalls = grid[x - 1][z] === 1 && grid[x + 1][z] === 1;
          const vertWalls = grid[x][z - 1] === 1 && grid[x][z + 1] === 1;
          if ((horizWalls || vertWalls) && rng.next() > 0.6) {
            grid[x][z] = 2; // Door
          }
        }
      }
    }

    // Place Loot Items (Almond water, Battery, Flares, Chalk)
    const itemTypes: ItemType[] = ['almond_water', 'battery', 'flare', 'chalk', 'walkie_talkie'];
    let itemCounter = 0;
    for (let x = 2; x < gridSize - 2; x++) {
      for (let z = 2; z < gridSize - 2; z++) {
        if (grid[x][z] === 0 && rng.next() > 0.9) {
          const type = itemTypes[Math.floor(rng.next() * itemTypes.length)];
          const posX = (x - gridSize / 2) * tileSize;
          const posZ = (z - gridSize / 2) * tileSize;
          items.push({
            id: `item_${levelDef.id}_${++itemCounter}`,
            type,
            name: type.replace('_', ' ').toUpperCase(),
            x: posX,
            y: 0.5,
            z: posZ,
            collected: false,
            levelIndex: levelDef.id
          });
        }
      }
    }

    // 2. Build 3D Meshes (Textures & Geometry)
    const wallTex = TextureAtlas.getTexture(levelDef.wallTextureType);
    wallTex.repeat.set(1, 1);
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.1
    });

    const floorTex = TextureAtlas.getTexture(levelDef.floorTextureType);
    floorTex.repeat.set(gridSize, gridSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: levelDef.hasWaterPuddles ? 0.4 : 0.9,
      metalness: 0.15
    });

    const ceilingTex = TextureAtlas.getTexture(levelDef.ceilingTextureType);
    ceilingTex.repeat.set(gridSize, gridSize);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.9,
      metalness: 0.05
    });

    const totalWorldSize = gridSize * tileSize;

    // Floor Plane
    const floorGeo = new THREE.PlaneGeometry(totalWorldSize, totalWorldSize);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0);
    floorMesh.receiveShadow = true;
    sceneGroup.add(floorMesh);

    // Ceiling Plane
    const ceilingMesh = new THREE.Mesh(floorGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, halfH, 0);
    sceneGroup.add(ceilingMesh);

    // Walls & Props Mesh Creation
    const wallGeo = new THREE.BoxGeometry(tileSize, halfH, tileSize);

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const worldX = (x - gridSize / 2) * tileSize + tileSize / 2;
        const worldZ = (z - gridSize / 2) * tileSize + tileSize / 2;
        const cell = grid[x][z];

        if (cell === 1) {
          // Solid Wall
          const wallMesh = new THREE.Mesh(wallGeo, wallMat);
          wallMesh.position.set(worldX, halfH / 2, worldZ);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          sceneGroup.add(wallMesh);

          // Collider Box
          const box = new THREE.Box3();
          box.setFromCenterAndSize(
            new THREE.Vector3(worldX, halfH / 2, worldZ),
            new THREE.Vector3(tileSize, halfH, tileSize)
          );
          colliderBoxes.push(box);
        } else if (cell === 2) {
          // Interactive Door Frame & Pivot
          const doorId = `door_${levelDef.id}_${doorIndex++}`;
          const doorGroup = new THREE.Group();
          doorGroup.position.set(worldX, 0, worldZ);

          const pivot = new THREE.Group();
          pivot.position.set(-tileSize * 0.45, 0, 0);

          const doorPanelMat = new THREE.MeshStandardMaterial({
            map: TextureAtlas.getTexture('metal_door'),
            roughness: 0.6,
            metalness: 0.4
          });
          const doorPanelGeo = new THREE.BoxGeometry(tileSize * 0.9, halfH * 0.85, 0.2);
          const doorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
          doorPanel.position.set(tileSize * 0.45, (halfH * 0.85) / 2, 0);
          doorPanel.castShadow = true;

          pivot.add(doorPanel);
          doorGroup.add(pivot);
          sceneGroup.add(doorGroup);

          doors.set(doorId, {
            group: doorGroup,
            isOpen: false,
            isLocked: rng.next() > 0.7,
            pivot
          });
        }

        // Place Fluorescent Ceiling Light Fixtures
        if ((x % 3 === 0 && z % 3 === 0 && cell === 0) || cell === 4) {
          const fixtureGeo = new THREE.BoxGeometry(1.6, 0.15, 0.6);
          const fixtureMat = new THREE.MeshStandardMaterial({
            color: '#fffff0',
            emissive: cell === 4 ? '#10b981' : '#fef08a',
            emissiveIntensity: cell === 4 ? 1.5 : 0.8
          });
          const fixtureMesh = new THREE.Mesh(fixtureGeo, fixtureMat);
          fixtureMesh.position.set(worldX, halfH - 0.08, worldZ);
          sceneGroup.add(fixtureMesh);

          // Point Light
          const lightColor = cell === 4 ? 0x10b981 : 0xfff4cc;
          const light = new THREE.PointLight(lightColor, 0.85, 12.0, 1.8);
          light.position.set(worldX, halfH - 0.3, worldZ);
          light.castShadow = true;
          light.shadow.bias = -0.002;
          sceneGroup.add(light);

          lightFixtures.push({
            mesh: fixtureMesh,
            light,
            baseIntensity: 0.85,
            flickerOffset: rng.next() * 100
          });
        }
      }
    }

    // Elevator Exit Structure (Green glowing indicator)
    const elevatorPos = new THREE.Vector3(
      (elevX + 1 - gridSize / 2) * tileSize + tileSize / 2,
      0,
      (elevZ + 1 - gridSize / 2) * tileSize + tileSize / 2
    );

    const spawnPos = new THREE.Vector3(
      (spawnX + 1 - gridSize / 2) * tileSize + tileSize / 2,
      1.5,
      (spawnZ + 1 - gridSize / 2) * tileSize + tileSize / 2
    );

    return {
      sceneGroup,
      colliderBoxes,
      spawnPosition: spawnPos,
      elevatorPosition: elevatorPos,
      lightFixtures,
      doors,
      items,
      grid,
      gridSize,
      tileSize
    };
  }

  // Fast Collision check for player/entity AABB circle
  public static checkCollision(
    x: number,
    z: number,
    radius: number,
    colliders: THREE.Box3[]
  ): boolean {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(x - radius, 0.1, z - radius),
      new THREE.Vector3(x + radius, 2.5, z + radius)
    );

    for (let i = 0; i < colliders.length; i++) {
      if (playerBox.intersectsBox(colliders[i])) {
        return true;
      }
    }
    return false;
  }
}
