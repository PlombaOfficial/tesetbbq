import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BackroomsRoomState, BackroomsPlayer } from '../types/horrorGame';
import { BACKROOMS_LEVELS } from '../game/engine/LevelsConfig';
import { LevelGenerator, LevelGenerationResult } from '../game/engine/LevelGenerator';
import { PlayerController } from '../game/systems/PlayerController';
import { EntityManager } from '../game/systems/EntityManager';
import { spatialAudio } from '../game/engine/SpatialAudio';
import { backroomsNet } from '../multiplayer/backroomsNet';
import { HUD } from './HUD';
import { SpectatorOverlay } from './SpectatorOverlay';
import { MousePointer, Play } from 'lucide-react';

interface BackroomsGameCanvasProps {
  room: BackroomsRoomState;
  localPlayer: BackroomsPlayer;
  onExitToMenu: () => void;
}

export const BackroomsGameCanvas: React.FC<BackroomsGameCanvasProps> = ({
  room,
  localPlayer,
  onExitToMenu
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [sanityVal, setSanityVal] = useState<number>(100);
  const [healthVal, setHealthVal] = useState<number>(100);
  const [batteryVal, setBatteryVal] = useState<number>(100);
  const [staminaVal, setStaminaVal] = useState<number>(100);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [inventoryState, setInventoryState] = useState<PlayerController['inventory']>({
    almondWaterCount: 1,
    batteryCount: 2,
    flareCount: 1,
    chalkUses: 10,
    hasMasterKey: false,
    hasWalkieTalkie: true
  });

  const levelDef = BACKROOMS_LEVELS[room.currentLevel] || BACKROOMS_LEVELS[0];

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Three.js Scene, Camera, Renderer
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(levelDef.fogColor);
    scene.fog = new THREE.FogExp2(levelDef.fogColor, levelDef.fogDensity);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    containerRef.current.appendChild(renderer.domElement);

    // Global Ambient Lighting for atmosphere
    const ambientLight = new THREE.AmbientLight(0xfef08a, 0.45);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(levelDef.ambientColor, 0x111827, 0.6);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.35);
    dirLight.position.set(0, 15, 0);
    scene.add(dirLight);

    // 2. Generate Seeded 3D Level Geometry
    const levelData: LevelGenerationResult = LevelGenerator.generate(levelDef, room.seed);
    scene.add(levelData.sceneGroup);

    // 3. Initialize Local Player Controller
    const player = new PlayerController(camera, levelData.spawnPosition);
    playerRef.current = player;
    scene.add(player.flashlight);
    scene.add(player.flashlightTarget);

    // 4. Initialize AI Entities
    const entityManager = new EntityManager();
    const entityGroup = entityManager.spawnEntities(
      levelDef.entitiesAllowed,
      Math.max(2, Math.floor(levelDef.anomalyFrequency * 4)),
      levelData.spawnPosition,
      levelDef.id
    );
    scene.add(entityGroup);

    // Start Ambient Drone Audio
    spatialAudio.startAmbientDrone(levelDef.dronePitch);

    // 5. Teammate 3D Avatars Map
    const teammateMeshes: Map<string, { group: THREE.Group; light: THREE.SpotLight }> = new Map();

    const createTeammateMesh = (p: BackroomsPlayer) => {
      const group = new THREE.Group();

      // Hazmat body mesh
      const hazmatMat = new THREE.MeshStandardMaterial({
        color: p.color || '#eab308',
        roughness: 0.5,
        metalness: 0.1
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.4, 12), hazmatMat);
      body.position.y = 0.7;
      body.castShadow = true;
      group.add(body);

      // Hazmat Helmet with Visor
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), hazmatMat);
      head.position.y = 1.55;
      group.add(head);

      const visorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.9 });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.15), visorMat);
      visor.position.set(0, 1.55, 0.18);
      group.add(visor);

      // Flashlight attached to chest
      const spotLight = new THREE.SpotLight(0xfff5db, p.flashlightOn ? 2.5 : 0, 18.0, Math.PI / 5, 0.5);
      spotLight.position.set(0, 1.2, 0.2);
      group.add(spotLight);

      return { group, light: spotLight };
    };

    // 6. Pointer Lock Listener
    const handleLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };
    document.addEventListener('pointerlockchange', handleLockChange);

    // Interaction Keyboard Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        // Check if looking at elevator
        const distToElev = player.position.distanceTo(levelData.elevatorPosition);
        if (distToElev < 3.5) {
          spatialAudio.playFlashlightClick();
          backroomsNet.transitionLevel(room.roomCode, room.currentLevel + 1);
          return;
        }

        // Check items
        levelData.items.forEach((it) => {
          if (!it.collected && player.position.distanceTo(new THREE.Vector3(it.x, it.y, it.z)) < 2.5) {
            it.collected = true;
            if (it.type === 'almond_water') player.inventory.almondWaterCount++;
            if (it.type === 'battery') player.inventory.batteryCount++;
            if (it.type === 'flare') player.inventory.flareCount++;
            spatialAudio.playFootstep('puddle');
            backroomsNet.collectItem(room.roomCode, it.id);
          }
        });
      } else if (e.code === 'Digit1') {
        player.drinkAlmondWater();
      } else if (e.code === 'Digit2') {
        player.reloadBattery();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // 7. Main Animation & Render Loop
    let lastTime = performance.now();
    let netSyncTimer = 0;
    let animId: number;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Surface determination
      const surfaceType = levelDef.hasWaterPuddles ? 'puddle' : levelDef.floorTextureType === 'damp_carpet' ? 'carpet' : 'concrete';

      // Update Player
      player.update(delta, levelData.colliderBoxes, surfaceType);

      // Flickering Fluorescent Lights
      levelData.lightFixtures.forEach((fix) => {
        const time = currentTime * 0.005 + fix.flickerOffset;
        const noise = Math.sin(time * 12.0) * Math.cos(time * 7.5);
        if (noise > 0.82 && Math.random() > 0.4) {
          fix.light.intensity = 0.05;
          (fix.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        } else {
          fix.light.intensity = fix.baseIntensity;
          (fix.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.85;
        }
      });

      // Update AI Entities
      const isAttacked = entityManager.update(
        delta,
        player.position,
        player.velocity.lengthSq() > 20,
        player.isFlashlightOn,
        levelData.colliderBoxes
      );

      if (isAttacked && player.isAlive) {
        player.health = Math.max(0, player.health - delta * 60);
        if (player.health <= 0) {
          player.isAlive = false;
          setIsDead(true);
          backroomsNet.recordPlayerDeath(room.roomCode, localPlayer.id);
        }
      }

      // Sync Teammates
      Object.entries(room.players || {}).forEach(([id, pData]) => {
        if (id === localPlayer.id) return;
        const p = pData as BackroomsPlayer;

        let tMesh = teammateMeshes.get(id);
        if (!tMesh) {
          tMesh = createTeammateMesh(p);
          teammateMeshes.set(id, tMesh);
          scene.add(tMesh.group);
        }

        // Interpolate position
        const targetPos = new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0);
        tMesh.group.position.lerp(targetPos, 12 * delta);
        tMesh.group.rotation.y = p.yaw || 0;
        tMesh.light.intensity = p.flashlightOn ? 2.5 : 0;
      });

      // Sync Network Transform (every 100ms)
      netSyncTimer += delta;
      if (netSyncTimer > 0.1) {
        netSyncTimer = 0;
        backroomsNet.syncPlayerTransform(
          room.roomCode,
          localPlayer.id,
          player.position.x,
          player.position.y,
          player.position.z,
          player.yaw,
          player.pitch,
          player.isFlashlightOn,
          player.health,
          player.sanity,
          player.battery
        );
      }

      // Interaction Prompt checking
      const distToElev = player.position.distanceTo(levelData.elevatorPosition);
      if (distToElev < 3.5) {
        setInteractPrompt('[E] DESCEND TO NEXT LEVEL');
      } else {
        setInteractPrompt(null);
      }

      // State sync to React HUD
      setSanityVal(Math.round(player.sanity));
      setHealthVal(Math.round(player.health));
      setBatteryVal(Math.round(player.battery));
      setStaminaVal(Math.round(player.stamina));
      setInventoryState({ ...player.inventory });

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
      document.removeEventListener('pointerlockchange', handleLockChange);
      spatialAudio.stopAmbientDrone();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [levelDef, localPlayer.id, room.currentLevel, room.roomCode, room.seed]);

  const handlePointerLockClick = () => {
    containerRef.current?.requestPointerLock();
    playerRef.current?.requestPointerLock(containerRef.current!);
  };

  return (
    <div className="game-3d-wrapper" onClick={handlePointerLockClick}>
      <div ref={containerRef} className="webgl-canvas-container" />

      {/* Start / Click to Look Overlay when not locked */}
      {!isPointerLocked && !isDead && (
        <div className="pointer-lock-prompt-overlay" onClick={handlePointerLockClick}>
          <div className="pointer-lock-card">
            <MousePointer className="icon-lg text-amber animate-bounce" />
            <h2>CLICK TO ENTER THE COMPLEX</h2>
            <p>Lock mouse to look around in full 3D & navigate.</p>
            <div className="controls-hint-grid">
              <div className="hint-pill"><kbd>W A S D</kbd> Move</div>
              <div className="hint-pill"><kbd>MOUSE</kbd> Look Around</div>
              <div className="hint-pill"><kbd>SHIFT</kbd> Sprint</div>
              <div className="hint-pill"><kbd>F</kbd> Flashlight</div>
              <div className="hint-pill"><kbd>E</kbd> Interact / Take</div>
              <div className="hint-pill"><kbd>1 / 2</kbd> Drink / Battery</div>
            </div>
            <button type="button" className="btn-enter-complex">
              <Play className="icon-xs" /> CLICK TO PLAY
            </button>
          </div>
        </div>
      )}

      {/* Found Footage HUD */}
      {!isDead ? (
        <HUD
          levelDef={levelDef}
          health={healthVal}
          sanity={sanityVal}
          battery={batteryVal}
          stamina={staminaVal}
          inventory={inventoryState}
          interactPrompt={interactPrompt}
          radioMessages={room.radioMessages}
          roomCode={room.roomCode}
          onDrinkAlmond={() => playerRef.current?.drinkAlmondWater()}
          onReloadBattery={() => playerRef.current?.reloadBattery()}
        />
      ) : (
        <SpectatorOverlay
          room={room}
          localPlayer={localPlayer}
          onExit={onExitToMenu}
        />
      )}
    </div>
  );
};
