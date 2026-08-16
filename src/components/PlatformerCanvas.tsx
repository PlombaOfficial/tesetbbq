import React, { useEffect, useRef, useState } from 'react';
import { 
  PlatformerRoomState, 
  PlatformerPlayer, 
  InventorySlot, 
  ChestData, 
  CraftingRecipe2D 
} from '../../types/platformerGame';
import { ChunkGrid2D, TILE_PX } from '../game/platformer/ChunkGrid';
import { PlayerPhysics2D } from '../game/platformer/PlayerPhysics';
import { MobEngine2D } from '../game/platformer/MobEngine';
import { platformerAudio } from '../game/platformer/PlatformerAudio';
import { platformerNet } from '../multiplayer/platformerNet';
import { SaveManager } from '../game/platformer/SaveManager';
import { TILE_DEFINITIONS, WALL_DEFINITIONS, ITEM_REGISTRY } from '../game/platformer/tileRegistry';
import { CRAFTING_RECIPES_2D, CraftingEngine2D } from '../game/platformer/CraftingSystem';
import { TouchOverlay } from './TouchOverlay';
import { 
  Heart, 
  Zap, 
  Compass, 
  Sun, 
  Moon, 
  Package, 
  Hammer, 
  X, 
  Send, 
  Smartphone, 
  Save, 
  Shield,
  Layers,
  Pickaxe,
  Sword
} from 'lucide-react';

interface PlatformerCanvasProps {
  room: PlatformerRoomState;
  localPlayer: PlatformerPlayer;
  onExitToMenu: () => void;
}

export const PlatformerCanvas: React.FC<PlatformerCanvasProps> = ({
  room,
  localPlayer,
  onExitToMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const physicsRef = useRef<PlayerPhysics2D | null>(null);
  const chunkGridRef = useRef<ChunkGrid2D | null>(null);
  const mobEngineRef = useRef<MobEngine2D | null>(null);

  // Player Vitals
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [gameTime, setGameTime] = useState(6000);
  const [depthInfo, setDepthInfo] = useState({ x: 0, y: 30 });
  const [isMobileTouch, setIsMobileTouch] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // Modals
  const [activeModal, setActiveModal] = useState<'inventory' | 'crafting' | 'chest' | null>(null);
  const [openChestData, setOpenChestData] = useState<ChestData | null>(null);
  const [craftingCategory, setCraftingCategory] = useState<'all' | 'tools' | 'weapons' | 'tiles' | 'furniture' | 'armor'>('all');

  // Chat
  const [chatInput, setChatInput] = useState('');

  // Hotbar (9 slots) & Backpack (27 slots)
  const [hotbar, setHotbar] = useState<InventorySlot[]>([
    { itemId: 'tool_wood_pick', count: 1 },
    { itemId: 'tool_wood_axe', count: 1 },
    { itemId: 'weapon_wood_sword', count: 1 },
    { itemId: 'item_wood_plank', count: 32 },
    { itemId: 'item_torch', count: 16 },
    { itemId: 'item_salve', count: 3 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 },
    { itemId: null, count: 0 }
  ]);

  const [inventory, setInventory] = useState<InventorySlot[]>(() => {
    const arr: InventorySlot[] = [];
    for (let i = 0; i < 27; i++) arr.push({ itemId: null, count: 0 });
    return arr;
  });

  // Touch Inputs
  const touchMoveDir = useRef({ x: 0, y: 0 });
  const isTouchJumpPressed = useRef(false);
  const isTouchJumpHeld = useRef(false);
  const isTouchActionHeld = useRef(false);
  const cursorWorldTile = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // 1. Initialize World Grid & Mob Engine
    const chunkGrid = new ChunkGrid2D(room.seed);
    chunkGridRef.current = chunkGrid;

    // Apply any existing modified tiles & walls
    Object.entries(room.modifiedTiles || {}).forEach(([k, id]) => {
      const [gx, gy] = k.split(',').map(Number);
      chunkGrid.setTile(gx, gy, id);
    });
    Object.entries(room.modifiedWalls || {}).forEach(([k, id]) => {
      const [gx, gy] = k.split(',').map(Number);
      chunkGrid.setWall(gx, gy, id);
    });

    const mobEngine = new MobEngine2D();
    mobEngineRef.current = mobEngine;

    // 2. Spawn Player
    const surfaceY = chunkGrid.generator.getSurfaceHeight(0);
    const physics = new PlayerPhysics2D(0, surfaceY - 3);
    physicsRef.current = physics;

    mobEngine.spawnInitialMobs(0, surfaceY);

    // 3. Desktop Input Listeners
    const keys: Record<string, boolean> = {};
    let isMouseDown = false;
    let rightClickPending = false;
    let mousePos = { x: 0, y: 0 };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyE') {
        setActiveModal((prev) => (prev === 'inventory' ? null : 'inventory'));
      }
      if (e.code === 'KeyC') {
        setActiveModal((prev) => (prev === 'crafting' ? null : 'crafting'));
      }
      if (e.code.startsWith('Digit')) {
        const d = parseInt(e.code.replace('Digit', '')) - 1;
        if (d >= 0 && d <= 8) setSelectedSlot(d);
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
      const rect = canvas.getBoundingClientRect();
      mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // 4. Autosave Timer (Every 12s)
    const autosaveTimer = window.setInterval(() => {
      SaveManager.saveWorld({
        id: room.roomCode,
        name: room.worldName,
        seed: room.seed,
        gameTime,
        lastSaved: Date.now(),
        modifiedTiles: Object.fromEntries(chunkGrid.modifiedTiles),
        modifiedWalls: Object.fromEntries(chunkGrid.modifiedWalls),
        chests: Object.fromEntries(chunkGrid.chests),
        playerState: {
          x: physics.x,
          y: physics.y,
          health,
          stamina,
          inventory,
          hotbar,
          selectedSlot
        }
      });
    }, 12000);

    // 5. Main 60 FPS Render & Simulation Loop
    let lastTime = performance.now();
    let animId: number;
    let netSyncTimer = 0;
    let cameraX = physics.x * TILE_PX;
    let cameraY = physics.y * TILE_PX;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const delta = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Handle Resize
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const screenW = canvas.width;
      const screenH = canvas.height;

      // Input Processing (Desktop or Mobile Touch)
      let inputX = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
      let inputY = (keys['KeyS'] ? 1 : 0) - (keys['KeyW'] ? 1 : 0);

      if (isMobileTouch) {
        inputX += touchMoveDir.current.x;
        inputY += touchMoveDir.current.y;
      }

      const jumpPressed = !!keys['Space'] || !!keys['KeyW'] || isTouchJumpPressed.current;
      const jumpHeld = !!keys['Space'] || !!keys['KeyW'] || isTouchJumpHeld.current;
      isTouchJumpPressed.current = false; // Reset impulse

      const isSprinting = !!keys['ShiftLeft'];

      // Physics update
      physics.update(delta, inputX, inputY, jumpPressed, jumpHeld, isSprinting, chunkGrid);

      // Camera Smooth Follow
      const targetCamX = physics.x * TILE_PX + (physics.width * TILE_PX) / 2;
      const targetCamY = physics.y * TILE_PX + (physics.height * TILE_PX) / 2;
      cameraX += (targetCamX - cameraX) * 0.12;
      cameraY += (targetCamY - cameraY) * 0.12;

      const viewLeft = cameraX - screenW / 2;
      const viewTop = cameraY - screenH / 2;

      // Compute Cursor Tile in World Coordinates
      const currentMouseX = isMobileTouch ? screenW / 2 + (physics.facingLeft ? -45 : 45) : mousePos.x;
      const currentMouseY = isMobileTouch ? screenH / 2 : mousePos.y;

      const cursorGx = Math.floor((viewLeft + currentMouseX) / TILE_PX);
      const cursorGy = Math.floor((viewTop + currentMouseY) / TILE_PX);
      cursorWorldTile.current = { x: cursorGx, y: cursorGy };

      // Equipped Item
      const activeSlot = hotbar[selectedSlot];
      const equippedItem = activeSlot?.itemId ? ITEM_REGISTRY[activeSlot.itemId] : null;

      // Mining / Attacking (Left click or Touch Action)
      const isMiningAction = isMouseDown || isTouchActionHeld.current;

      if (isMiningAction) {
        if (equippedItem && equippedItem.toolType === 'sword') {
          mobEngine.attackMelee(physics.x, physics.y, physics.facingLeft, equippedItem.damage || 10);
        } else if (equippedItem && equippedItem.toolType === 'bow') {
          // Shoot arrow if has arrows in inventory
          mobEngine.fireArrow(physics.x, physics.y, cursorGx, cursorGy, equippedItem.damage || 14);
        } else {
          // Mine Tile
          const mineRes = physics.processMining(delta, { x: cursorGx, y: cursorGy }, equippedItem, chunkGrid);
          if (mineRes.broken) {
            platformerAudio.playTileCrack(true);
            platformerNet.syncTileDelta(room.roomCode, cursorGx, cursorGy, 0);

            if (mineRes.dropItemId) {
              addItem(mineRes.dropItemId, mineRes.dropCount || 1);
            }
          }
        }
      } else {
        physics.miningTile = null;
        physics.miningProgress = 0;
      }

      // Placing Tile / Interacting (Right Click)
      if (rightClickPending) {
        rightClickPending = false;

        // 1. Check Interactive Objects (Doors, Chests)
        const clickedTile = chunkGrid.getTile(cursorGx, cursorGy);
        if (clickedTile === 16 || clickedTile === 17) {
          chunkGrid.toggleDoor(cursorGx, cursorGy);
          platformerAudio.playTilePlace();
          platformerNet.syncTileDelta(room.roomCode, cursorGx, cursorGy, chunkGrid.getTile(cursorGx, cursorGy));
        } else if (clickedTile === 22) {
          // Open Chest!
          platformerAudio.playChestOpen();
          const chestKey = `${cursorGx},${cursorGy}`;
          let cData = chunkGrid.chests.get(chestKey);
          if (!cData) {
            cData = { id: chestKey, x: cursorGx, y: cursorGy, items: [] };
            for (let ci = 0; ci < 20; ci++) cData.items.push({ itemId: null, count: 0 });
            chunkGrid.chests.set(chestKey, cData);
          }
          setOpenChestData(cData);
          setActiveModal('chest');
        } else if (equippedItem) {
          // Place tile / wall
          const placed = physics.tryPlace({ x: cursorGx, y: cursorGy }, equippedItem, chunkGrid);
          if (placed) {
            platformerAudio.playTilePlace();
            if (equippedItem.placeTileId) {
              platformerNet.syncTileDelta(room.roomCode, cursorGx, cursorGy, equippedItem.placeTileId);
            } else if (equippedItem.placeWallId) {
              platformerNet.syncWallDelta(room.roomCode, cursorGx, cursorGy, equippedItem.placeWallId);
            }

            // Deduct from slot
            setHotbar((prev) => {
              const updated = [...prev];
              const s = { ...updated[selectedSlot] };
              s.count--;
              if (s.count <= 0) {
                s.itemId = null;
                s.count = 0;
              }
              updated[selectedSlot] = s;
              return updated;
            });
          }
        }
      }

      // Mobs AI Update
      const mobRes = mobEngine.update(delta, physics.x, physics.y, chunkGrid);
      if (mobRes.playerDamage > 0) {
        setHealth((h) => Math.max(0, h - mobRes.playerDamage));
        platformerAudio.playDamageHit();
      }

      // --- RENDERING PASSES ---
      // 1. Celestial Day/Night Sky Gradient
      const isDay = gameTime > 0 && gameTime < 13000;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, screenH);
      if (isDay) {
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
      } else {
        skyGrad.addColorStop(0, '#030712');
        skyGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, screenW, screenH);

      // 2. Visible Tile Bounds
      const minTileX = Math.floor(viewLeft / TILE_PX) - 1;
      const maxTileX = Math.ceil((viewLeft + screenW) / TILE_PX) + 1;
      const minTileY = Math.max(0, Math.floor(viewTop / TILE_PX) - 1);
      const maxTileY = Math.min(180, Math.ceil((viewTop + screenH) / TILE_PX) + 1);

      // Render Background Walls
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const wId = chunkGrid.getWall(tx, ty);
          if (wId !== 0 && WALL_DEFINITIONS[wId]) {
            ctx.fillStyle = WALL_DEFINITIONS[wId].color;
            ctx.fillRect(tx * TILE_PX - viewLeft, ty * TILE_PX - viewTop, TILE_PX, TILE_PX);
          }
        }
      }

      // Render Foreground Tiles
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const tId = chunkGrid.getTile(tx, ty);
          if (tId === 0) continue;

          const def = TILE_DEFINITIONS[tId];
          if (!def) continue;

          const px = tx * TILE_PX - viewLeft;
          const py = ty * TILE_PX - viewTop;

          ctx.fillStyle = def.color;
          ctx.fillRect(px, py, TILE_PX, TILE_PX);

          if (def.accentColor) {
            ctx.fillStyle = def.accentColor;
            ctx.fillRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6);
          }

          // Special tile visuals: Torch flame, Platforms, Doors
          if (tId === 18) {
            // Torch
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(px + 8, py + 4, 4, 8);
          } else if (tId === 15) {
            // Platform
            ctx.fillStyle = '#b45309';
            ctx.fillRect(px, py, TILE_PX, 4);
          } else if (tId === 16) {
            // Closed Door
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px + 2, py, TILE_PX - 4, TILE_PX);
          }
        }
      }

      // Render Mining Progress overlay on target tile
      if (physics.miningTile && physics.miningProgress > 0) {
        const mpx = physics.miningTile.x * TILE_PX - viewLeft;
        const mpy = physics.miningTile.y * TILE_PX - viewTop;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(mpx, mpy, TILE_PX, TILE_PX);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.fillRect(mpx, mpy + TILE_PX * (1 - physics.miningProgress), TILE_PX, TILE_PX * physics.miningProgress);
      }

      // Render Cursor Highlight Box
      const cpx = cursorGx * TILE_PX - viewLeft;
      const cpy = cursorGy * TILE_PX - viewTop;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cpx, cpy, TILE_PX, TILE_PX);

      // Render Mobs
      mobEngine.mobs.forEach((m) => {
        const mpx = m.x * TILE_PX - viewLeft;
        const mpy = m.y * TILE_PX - viewTop;
        const mw = m.width * TILE_PX;
        const mh = m.height * TILE_PX;

        // Mob Body
        ctx.fillStyle = m.type === 'boar' ? '#92400e' : m.type === 'slime' ? '#22c55e' : '#475569';
        ctx.fillRect(mpx, mpy, mw, mh);

        // Mob Health Bar
        if (m.health < m.maxHealth) {
          ctx.fillStyle = '#000';
          ctx.fillRect(mpx, mpy - 6, mw, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(mpx, mpy - 6, mw * (m.health / m.maxHealth), 4);
        }
      });

      // Render Projectile Arrows
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      mobEngine.arrows.forEach((ar) => {
        const apx = ar.x * TILE_PX - viewLeft;
        const apy = ar.y * TILE_PX - viewTop;
        ctx.beginPath();
        ctx.moveTo(apx, apy);
        ctx.lineTo(apx - ar.vx * 0.05, apy - ar.vy * 0.05);
        ctx.stroke();
      });

      // Render Damage Particles
      mobEngine.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x * TILE_PX - viewLeft, p.y * TILE_PX - viewTop, p.size, p.size);
      });

      // Render Floating Damage Numbers
      ctx.font = 'bold 12px monospace';
      mobEngine.floatingTexts.forEach((t) => {
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x * TILE_PX - viewLeft, t.y * TILE_PX - viewTop);
      });

      // Render Multiplayer Teammates
      Object.entries(room.players || {}).forEach(([id, p]) => {
        if (id === localPlayer.id) return;
        const tpx = p.x * TILE_PX - viewLeft;
        const tpy = p.y * TILE_PX - viewTop;
        const pw = 0.8 * TILE_PX;
        const ph = 1.7 * TILE_PX;

        ctx.fillStyle = p.color || '#3b82f6';
        ctx.fillRect(tpx, tpy, pw, ph);

        // Name tag
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(p.name, tpx - 4, tpy - 4);
      });

      // Render Local Player Avatar
      const ppx = physics.x * TILE_PX - viewLeft;
      const ppy = physics.y * TILE_PX - viewTop;
      const pw = physics.width * TILE_PX;
      const ph = physics.height * TILE_PX;

      // Body Tunic
      ctx.fillStyle = localPlayer.color || '#3b82f6';
      ctx.fillRect(ppx, ppy + 10, pw, ph - 10);

      // Head
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ppx + 2, ppy, pw - 4, 10);

      // Held Tool with Swing Animation
      if (equippedItem) {
        ctx.save();
        ctx.translate(ppx + (physics.facingLeft ? 2 : pw - 2), ppy + 12);
        ctx.rotate((physics.facingLeft ? -1 : 1) * physics.toolSwingAngle);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, -2, 14, 4);
        ctx.restore();
      }

      // Periodic Net Sync (every 100ms)
      netSyncTimer += delta;
      if (netSyncTimer > 0.1) {
        netSyncTimer = 0;
        platformerNet.syncPlayerTransform(
          room.roomCode,
          localPlayer.id,
          physics.x,
          physics.y,
          physics.vx,
          physics.vy,
          physics.facingLeft,
          physics.isGrounded,
          health,
          stamina,
          selectedSlot
        );
      }

      setDepthInfo({ x: Math.floor(physics.x), y: Math.floor(physics.y) });
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(autosaveTimer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameTime, health, hotbar, inventory, localPlayer.color, localPlayer.id, localPlayer.name, room.modifiedTiles, room.modifiedWalls, room.players, room.roomCode, room.seed, room.worldName, selectedSlot, stamina]);

  const addItem = (itemId: string, count: number) => {
    const itemDef = ITEM_REGISTRY[itemId];
    if (!itemDef) return;

    let remainder = count;

    // Stack in hotbar
    setHotbar((prev) => {
      const updated = prev.map((s) => ({ ...s }));
      for (const slot of updated) {
        if (slot.itemId === itemId && slot.count < itemDef.maxStack) {
          const add = Math.min(itemDef.maxStack - slot.count, remainder);
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

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    platformerNet.sendChat(room.roomCode, localPlayer.name, chatInput.trim(), localPlayer.color);
    setChatInput('');
  };

  const handleCraft = (recipe: CraftingRecipe2D) => {
    const allSlots = [...hotbar, ...inventory];
    const ok = CraftingEngine2D.craft(recipe, allSlots);
    if (ok) {
      platformerAudio.playTilePlace();
      setHotbar(allSlots.slice(0, 9));
      setInventory(allSlots.slice(9));
    }
  };

  return (
    <div className="platformer-viewport-wrapper">
      <canvas ref={canvasRef} className="platformer-main-canvas" />

      {/* In-Game HUD */}
      <div className="platformer-hud-layer">
        {/* Top Left: Vitals & Depth Coordinates */}
        <div className="hud-top-left-group">
          <div className="hud-stat-pill">
            <Heart className="icon-xs text-rose" />
            <span>HP: {health}/100</span>
          </div>
          <div className="hud-stat-pill">
            <Compass className="icon-xs text-amber" />
            <span>DEPTH: Y:{depthInfo.y} (X:{depthInfo.x})</span>
          </div>
        </div>

        {/* Top Right: Room Code & Mobile Controls Toggle */}
        <div className="hud-top-right-group">
          <button
            type="button"
            onClick={() => setIsMobileTouch(!isMobileTouch)}
            className={`btn-hud-action ${isMobileTouch ? 'touch-active' : ''}`}
          >
            <Smartphone className="icon-xs" />
            <span>{isMobileTouch ? 'MOBILE TOUCH: ON' : 'TOUCH CONTROLS'}</span>
          </button>
          <div className="hud-room-code-tag">
            REALM: <strong>{room.roomCode}</strong>
          </div>
        </div>

        {/* Bottom Center: 9-Slot Hotbar */}
        <div className="hud-bottom-hotbar-container">
          <div className="platformer-hotbar-grid">
            {hotbar.map((slot, idx) => {
              const def = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
              const isSelected = selectedSlot === idx;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSlot(idx)}
                  className={`hotbar-slot-2d ${isSelected ? 'active-slot' : ''}`}
                >
                  <span className="slot-idx-tag">{idx + 1}</span>
                  {def && (
                    <>
                      <span className="slot-item-label">{def.name.substring(0, 7)}</span>
                      {slot.count > 1 && <span className="slot-count-num">{slot.count}</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Left: Chat Feed */}
        <div className="hud-bottom-chat-box">
          <div className="chat-log-scroll">
            {room.chatMessages.slice(-5).map((msg) => (
              <div key={msg.id} className="chat-item-row">
                <span style={{ color: msg.color }}>[{msg.sender}]:</span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="chat-form-row">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Press Enter to chat..."
              className="chat-field"
            />
            <button type="submit" className="btn-chat-submit">
              <Send className="icon-xxs" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Touch Overlay */}
      {isMobileTouch && (
        <TouchOverlay
          onMove={(dir) => { touchMoveDir.current = dir; }}
          onJumpStart={() => {
            isTouchJumpPressed.current = true;
            isTouchJumpHeld.current = true;
          }}
          onJumpEnd={() => { isTouchJumpHeld.current = false; }}
          onActionStart={() => { isTouchActionHeld.current = true; }}
          onActionEnd={() => { isTouchActionHeld.current = false; }}
          onInteract={() => {
            // Trigger right-click interact at cursor
            const clicked = chunkGridRef.current?.getTile(cursorWorldTile.current.x, cursorWorldTile.current.y);
            if (clicked === 16 || clicked === 17) {
              chunkGridRef.current?.toggleDoor(cursorWorldTile.current.x, cursorWorldTile.current.y);
              platformerAudio.playTilePlace();
            } else if (clicked === 22) {
              platformerAudio.playChestOpen();
              const chestKey = `${cursorWorldTile.current.x},${cursorWorldTile.current.y}`;
              let cData = chunkGridRef.current?.chests.get(chestKey);
              if (!cData) {
                cData = { id: chestKey, x: cursorWorldTile.current.x, y: cursorWorldTile.current.y, items: [] };
                for (let ci = 0; ci < 20; ci++) cData.items.push({ itemId: null, count: 0 });
                chunkGridRef.current?.chests.set(chestKey, cData);
              }
              setOpenChestData(cData);
              setActiveModal('chest');
            }
          }}
          onOpenInventory={() => setActiveModal('inventory')}
          onOpenCrafting={() => setActiveModal('crafting')}
        />
      )}

      {/* MODAL: Backpack & Gear */}
      {activeModal === 'inventory' && (
        <div className="modal-backdrop-2d">
          <div className="inventory-card-2d">
            <div className="modal-header-2d">
              <div className="tab-pill active"><Package className="icon-xs" /> BACKPACK & GEAR</div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-close-modal">
                <X className="icon-sm" />
              </button>
            </div>

            <div className="backpack-grid-27">
              {inventory.map((slot, idx) => {
                const def = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
                return (
                  <div key={idx} className="inv-slot-2d">
                    {def && (
                      <>
                        <span className="slot-name">{def.name.substring(0, 9)}</span>
                        {slot.count > 1 && <span className="slot-count">{slot.count}</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crafting Bench */}
      {activeModal === 'crafting' && (
        <div className="modal-backdrop-2d">
          <div className="crafting-card-2d">
            <div className="modal-header-2d">
              <div className="tab-pill active"><Hammer className="icon-xs" /> CRAFTING BENCH</div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-close-modal">
                <X className="icon-sm" />
              </button>
            </div>

            <div className="crafting-categories-chips">
              <button type="button" onClick={() => setCraftingCategory('all')} className={`cat-chip ${craftingCategory === 'all' ? 'active' : ''}`}>ALL</button>
              <button type="button" onClick={() => setCraftingCategory('tools')} className={`cat-chip ${craftingCategory === 'tools' ? 'active' : ''}`}><Pickaxe className="icon-xxs" /> TOOLS</button>
              <button type="button" onClick={() => setCraftingCategory('weapons')} className={`cat-chip ${craftingCategory === 'weapons' ? 'active' : ''}`}><Sword className="icon-xxs" /> WEAPONS</button>
              <button type="button" onClick={() => setCraftingCategory('tiles')} className={`cat-chip ${craftingCategory === 'tiles' ? 'active' : ''}`}><Layers className="icon-xxs" /> TILES</button>
              <button type="button" onClick={() => setCraftingCategory('furniture')} className={`cat-chip ${craftingCategory === 'furniture' ? 'active' : ''}`}><Package className="icon-xxs" /> FURNITURE</button>
              <button type="button" onClick={() => setCraftingCategory('armor')} className={`cat-chip ${craftingCategory === 'armor' ? 'active' : ''}`}><Shield className="icon-xxs" /> ARMOR</button>
            </div>

            <div className="recipes-scroll-list">
              {CRAFTING_RECIPES_2D.filter(r => craftingCategory === 'all' || r.category === craftingCategory).map((r) => {
                const def = ITEM_REGISTRY[r.resultItemId];
                const canMake = CraftingEngine2D.canCraft(r, [...hotbar, ...inventory]);

                return (
                  <div key={r.id} className={`recipe-item-row ${canMake ? 'ready-to-craft' : ''}`}>
                    <div className="recipe-details-col">
                      <strong>{def?.name || r.resultItemId} x{r.resultCount}</strong>
                      <div className="recipe-ingredients-badges">
                        {r.ingredients.map(ing => (
                          <span key={ing.itemId} className="ing-badge">
                            {ITEM_REGISTRY[ing.itemId]?.name || ing.itemId} x{ing.count}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canMake}
                      onClick={() => handleCraft(r)}
                      className={`btn-craft-submit ${canMake ? 'active-craft' : ''}`}
                    >
                      {canMake ? 'CRAFT' : 'MISSING MATERIALS'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Storage Chest */}
      {activeModal === 'chest' && openChestData && (
        <div className="modal-backdrop-2d">
          <div className="inventory-card-2d">
            <div className="modal-header-2d">
              <div className="tab-pill active"><Package className="icon-xs" /> STORAGE CHEST (20 SLOTS)</div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-close-modal">
                <X className="icon-sm" />
              </button>
            </div>

            <div className="backpack-grid-27">
              {openChestData.items.map((slot, idx) => {
                const def = slot.itemId ? ITEM_REGISTRY[slot.itemId] : null;
                return (
                  <div key={idx} className="inv-slot-2d">
                    {def && (
                      <>
                        <span className="slot-name">{def.name.substring(0, 9)}</span>
                        {slot.count > 1 && <span className="slot-count">{slot.count}</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
