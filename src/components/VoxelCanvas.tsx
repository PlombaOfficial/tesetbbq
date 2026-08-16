import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VoxelRoomState, VoxelPlayer, InventorySlot, BiomeType } from '../types/voxelGame';
import { ChunkManager } from '../game/voxel/ChunkManager';
import { VoxelPhysics } from '../game/voxel/VoxelPhysics';
import { SkyAndWeather } from '../game/systems/SkyAndWeather';
import { MobManager } from '../game/systems/MobManager';
import { voxelAudio } from '../game/audio/VoxelAudio';
import { voxelNet } from '../multiplayer/voxelNet';
import { ITEM_DEFINITIONS } from '../game/voxel/VoxelAtlas';
import { HUD } from './HUD';
import { TouchControls } from './TouchControls';
import { InventoryModal } from './InventoryModal';

interface VoxelCanvasProps {
  room: VoxelRoomState;
  localPlayer: VoxelPlayer;
  onExitToMenu: () => void;
}

export const VoxelCanvas: React.FC<VoxelCanvasProps> = ({
  room,
  localPlayer
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const physicsRef = useRef<VoxelPhysics | null>(null);
  const chunkManagerRef = useRef<ChunkManager | null>(null);

  // Player state
  const [health, setHealth] = useState(20);
  const [hunger] = useState(20);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [miningProgress, setMiningProgress] = useState(0);
  const [currentBiome, setCurrentBiome] = useState<BiomeType>('verdant_plains');
  const [playerCoord, setPlayerCoord] = useState({ x: 0, y: 25, z: 0 });
  const [isMobileTouch, setIsMobileTouch] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Initial Inventory & Hotbar
  const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { itemId: 'tool_wood_pick', count: 1 },
    { itemId: 'tool_wood_axe', count: 1 },
    { itemId: 'item_wood_log', count: 16 },
    { itemId: 'item_torch', count: 8 },
    { itemId: 'item_bread', count: 4 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 }
  ]);

  const [inventory, setInventory] = useState<InventorySlot[]>(() => {
    const slots: InventorySlot[] = [];
    for (let i = 0; i < 27; i++) {
      slots.push({ itemId: null, count: 0 });
    }
    return slots;
  });

  // Mobile touch inputs
  const touchMoveDirRef = useRef({ x: 0, y: 0 });
  const isTouchJumpingRef = useRef(false);
  const isTouchMiningRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene, Camera, Renderer
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.012);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 150);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    containerRef.current.appendChild(renderer.domElement);

    // 2. Chunk Manager & Terrain
    const chunkManager = new ChunkManager(scene, room.seed);
    chunkManagerRef.current = chunkManager;

    // 3. Find Surface Spawn Height
    const spawnY = chunkManager.generator.getHeight(0, 0, 'verdant_plains') + 2.5;
    const physics = new VoxelPhysics(new THREE.Vector3(0, spawnY, 0));
    physicsRef.current = physics;
    camera.position.copy(physics.position);

    // 4. Sky and Weather
    const skyAndWeather = new SkyAndWeather(scene);

    // 5. Mobs
    const mobManager = new MobManager();
    const mobGroup = mobManager.spawnInitialMobs(physics.position, 6);
    scene.add(mobGroup);

    // 6. Block Highlight Wireframe
    const highlightGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const highlightBox = new THREE.Mesh(highlightGeo, highlightMat);
    highlightBox.visible = false;
    scene.add(highlightBox);

    // 7. Teammates 3D Voxel Avatars
    const teammateMeshes = new Map<string, THREE.Group>();

    const createTeammateAvatar = (p: VoxelPlayer) => {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: p.color || '#3b82f6' });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.4), bodyMat);
      body.position.y = 0.45;
      group.add(body);

      const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
      head.position.y = 1.15;
      group.add(head);
      return group;
    };

    // 8. Desktop Keyboard & Mouse Listeners
    const keys: Record<string, boolean> = {};
    let isMouseDown = false;
    let rightClickPending = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyE') {
        setIsInventoryOpen((prev) => !prev);
      }
      if (e.code.startsWith('Digit')) {
        const digit = parseInt(e.code.replace('Digit', '')) - 1;
        if (digit >= 0 && digit <= 8) {
          setSelectedSlotIndex(digit);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown = true;
      if (e.button === 2) rightClickPending = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== containerRef.current) return;
      const sensitivity = 0.0024;
      physics.yaw -= e.movementX * sensitivity;
      physics.pitch -= e.movementY * sensitivity;
      physics.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, physics.pitch));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    // Apply any initial modified blocks from room state
    Object.entries(room.modifiedBlocks || {}).forEach(([key, blockId]) => {
      const [bx, by, bz] = key.split(',').map(Number);
      chunkManager.setBlock(bx, by, bz, blockId);
    });

    // 9. Main Animation Loop
    let lastTime = performance.now();
    let netSyncTimer = 0;
    let animId: number;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Inputs determination
      let inputX = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
      let inputY = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);

      if (isMobileTouch) {
        inputX += touchMoveDirRef.current.x;
        inputY += touchMoveDirRef.current.y;
      }

      const inputVec = new THREE.Vector2(inputX, inputY);
      if (inputVec.lengthSq() > 0) inputVec.normalize();

      const isJumping = !!keys['Space'] || isTouchJumpingRef.current;
      const isSprinting = !!keys['ShiftLeft'];

      // Physics update
      physics.update(delta, inputVec, isJumping, isSprinting, chunkManager);

      // Camera position & orientation
      camera.position.set(physics.position.x, physics.position.y, physics.position.z);
      const euler = new THREE.Euler(physics.pitch, physics.yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      // Dynamic Chunks around player
      chunkManager.update(physics.position.x, physics.position.z);

      // Sky & Weather
      skyAndWeather.update(delta, physics.position);

      // Mobs AI
      const mobHit = mobManager.update(delta, physics.position, chunkManager);
      if (mobHit) {
        setHealth((h) => Math.max(0, h - 1));
      }

      // Raycast Target Block
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const hit = chunkManager.raycast(camera.position, forwardDir, 5.5);

      if (hit.hit) {
        highlightBox.position.set(hit.blockX + 0.5, hit.blockY + 0.5, hit.blockZ + 0.5);
        highlightBox.visible = true;
      } else {
        highlightBox.visible = false;
      }

      // Process Mining
      const isMining = isMouseDown || isTouchMiningRef.current;
      const equippedSlot = hotbar[selectedSlotIndex];
      const equippedItem = equippedSlot?.itemId ? ITEM_DEFINITIONS[equippedSlot.itemId] : null;

      if (isMining && hit.hit) {
        const mineResult = physics.processMining(delta, hit, equippedItem, chunkManager);
        setMiningProgress(physics.miningProgress);

        if (mineResult.broken) {
          voxelAudio.playBlockCrack('stone');
          voxelNet.syncBlockDelta(room.roomCode, hit.blockX, hit.blockY, hit.blockZ, 0);

          if (mineResult.dropItemId) {
            addItemToInventory(mineResult.dropItemId, mineResult.dropCount || 1);
          }
        }
      } else {
        physics.miningProgress = 0;
        setMiningProgress(0);
      }

      // Process Placing Block
      if (rightClickPending && hit.hit) {
        rightClickPending = false;
        if (equippedItem && equippedItem.placeBlockId) {
          const placed = physics.tryPlaceBlock(hit, equippedItem.placeBlockId, chunkManager);
          if (placed) {
            voxelAudio.playBlockPlace();
            const targetX = hit.blockX + hit.faceNormal.x;
            const targetY = hit.blockY + hit.faceNormal.y;
            const targetZ = hit.blockZ + hit.faceNormal.z;
            voxelNet.syncBlockDelta(room.roomCode, targetX, targetY, targetZ, equippedItem.placeBlockId);

            setHotbar((prev) => {
              const updated = [...prev];
              const slot = { ...updated[selectedSlotIndex] };
              slot.count--;
              if (slot.count <= 0) {
                slot.itemId = null;
                slot.count = 0;
              }
              updated[selectedSlotIndex] = slot;
              return updated;
            });
          }
        }
      }

      // Sync Multiplayer Teammates
      Object.entries(room.players || {}).forEach(([id, pData]) => {
        if (id === localPlayer.id) return;
        let tMesh = teammateMeshes.get(id);
        if (!tMesh) {
          tMesh = createTeammateAvatar(pData);
          teammateMeshes.set(id, tMesh);
          scene.add(tMesh);
        }
        tMesh.position.lerp(new THREE.Vector3(pData.x, pData.y - 1.0, pData.z), 12 * delta);
        tMesh.rotation.y = pData.yaw;
      });

      // Periodic Net Transform Sync
      netSyncTimer += delta;
      if (netSyncTimer > 0.1) {
        netSyncTimer = 0;
        voxelNet.syncPlayerTransform(
          room.roomCode,
          localPlayer.id,
          physics.position.x,
          physics.position.y,
          physics.position.z,
          physics.yaw,
          physics.pitch,
          health,
          hunger,
          selectedSlotIndex
        );
      }

      // Update HUD values
      setPlayerCoord({
        x: physics.position.x,
        y: physics.position.y,
        z: physics.position.z
      });

      setCurrentBiome(chunkManager.generator.getBiome(physics.position.x, physics.position.z));

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [localPlayer.id, room.modifiedBlocks, room.roomCode, room.seed]);

  const addItemToInventory = (itemId: string, count: number) => {
    const itemDef = ITEM_DEFINITIONS[itemId];
    if (!itemDef) return;

    let remainder = count;

    // Stacking in hotbar
    setHotbar((prev) => {
      const updated = prev.map((s) => ({ ...s }));
      for (const slot of updated) {
        if (slot.itemId === itemId && slot.count < itemDef.maxStack) {
          const space = itemDef.maxStack - slot.count;
          const add = Math.min(space, remainder);
          slot.count += add;
          remainder -= add;
          if (remainder <= 0) break;
        }
      }
      if (remainder > 0) {
        for (const slot of updated) {
          if (!slot.itemId) {
            slot.itemId = itemId;
            slot.count = remainder;
            remainder = 0;
            break;
          }
        }
      }
      return updated;
    });
  };

  const handlePointerLockClick = () => {
    if (!isMobileTouch) {
      containerRef.current?.requestPointerLock();
    }
  };

  return (
    <div className="voxel-canvas-wrapper" onClick={handlePointerLockClick}>
      <div ref={containerRef} className="webgl-voxel-viewport" />

      {/* Main HUD */}
      <HUD
        health={health}
        hunger={hunger}
        hotbar={hotbar}
        selectedSlotIndex={selectedSlotIndex}
        onSelectSlot={(idx) => setSelectedSlotIndex(idx)}
        miningProgress={miningProgress}
        playerPos={playerCoord}
        biomeName={currentBiome}
        gameTime={6000}
        roomCode={room.roomCode}
        chatMessages={room.chatMessages}
        playerName={localPlayer.name}
        playerColor={localPlayer.color}
        isMobileTouch={isMobileTouch}
        onToggleMobileTouch={() => setIsMobileTouch(!isMobileTouch)}
        onOpenInventory={() => setIsInventoryOpen(true)}
      />

      {/* Touch Controls Overlay for Mobile / Phone */}
      {isMobileTouch && (
        <TouchControls
          onMove={(dir) => { touchMoveDirRef.current = dir; }}
          onLook={(delta) => {
            if (physicsRef.current) {
              physicsRef.current.yaw -= delta.x;
              physicsRef.current.pitch -= delta.y;
              physicsRef.current.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, physicsRef.current.pitch));
            }
          }}
          onJump={(jumping) => { isTouchJumpingRef.current = jumping; }}
          onMineStart={() => { isTouchMiningRef.current = true; }}
          onMineEnd={() => { isTouchMiningRef.current = false; }}
          onPlace={() => {
            if (chunkManagerRef.current && physicsRef.current) {
              const forwardDir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(physicsRef.current.pitch, physicsRef.current.yaw, 0, 'YXZ'));
              const hit = chunkManagerRef.current.raycast(physicsRef.current.position, forwardDir, 5.5);
              const equippedSlot = hotbar[selectedSlotIndex];
              const equippedItem = equippedSlot?.itemId ? ITEM_DEFINITIONS[equippedSlot.itemId] : null;

              if (hit.hit && equippedItem && equippedItem.placeBlockId) {
                const placed = physicsRef.current.tryPlaceBlock(hit, equippedItem.placeBlockId, chunkManagerRef.current);
                if (placed) {
                  voxelAudio.playBlockPlace();
                  const targetX = hit.blockX + hit.faceNormal.x;
                  const targetY = hit.blockY + hit.faceNormal.y;
                  const targetZ = hit.blockZ + hit.faceNormal.z;
                  voxelNet.syncBlockDelta(room.roomCode, targetX, targetY, targetZ, equippedItem.placeBlockId);

                  setHotbar((prev) => {
                    const updated = [...prev];
                    const slot = { ...updated[selectedSlotIndex] };
                    slot.count--;
                    if (slot.count <= 0) {
                      slot.itemId = null;
                      slot.count = 0;
                    }
                    updated[selectedSlotIndex] = slot;
                    return updated;
                  });
                }
              }
            }
          }}
          onOpenInventory={() => setIsInventoryOpen(true)}
        />
      )}

      {/* Inventory & Crafting Bench Modal */}
      {isInventoryOpen && (
        <InventoryModal
          inventory={inventory}
          hotbar={hotbar}
          onClose={() => setIsInventoryOpen(false)}
          onUpdateInventory={(inv) => setInventory(inv)}
          onUpdateHotbar={(hb) => setHotbar(hb)}
        />
      )}
    </div>
  );
};
