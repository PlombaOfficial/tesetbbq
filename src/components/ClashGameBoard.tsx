import React, { useEffect, useRef, useState } from 'react';
import { 
  ClashRoomState, 
  Faction 
} from '../../types/pvpClash';
import { ClashSimulationEngine } from '../game/clash/ClashEngine';
import { PLANT_REGISTRY, ZOMBIE_REGISTRY, COMMANDER_SPELLS, MAP_CONFIGS } from '../game/clash/unitRegistry';
import { clashAudio } from '../game/clash/ClashAudio';
import { clashNet } from '../multiplayer/clashNet';
import { 
  Zap, 
  Skull, 
  Shield, 
  Heart, 
  Clock, 
  Send, 
  Sparkles, 
  MessageSquare,
  Flame,
  Snowflake,
  Activity
} from 'lucide-react';

interface ClashGameBoardProps {
  room: ClashRoomState;
  myId: string;
  myFaction: Faction;
  onMatchFinished: (winner: Faction) => void;
}

export const ClashGameBoard: React.FC<ClashGameBoardProps> = ({
  room,
  myId,
  myFaction,
  onMatchFinished
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ClashSimulationEngine | null>(null);

  const isPlants = myFaction === 'PLANTS';

  // Active Selected Card for placement
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeSpellId, setActiveSpellId] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [spellCooldowns, setSpellCooldowns] = useState<Record<string, number>>({});

  // HUD States
  const [plantSun, setPlantSun] = useState(150);
  const [zombieBrains, setZombieBrains] = useState(150);
  const [plantBaseHp, setPlantBaseHp] = useState(100);
  const [matchTime, setMatchTime] = useState(0);
  const [chatInput, setChatInput] = useState('');

  const myDeck = isPlants ? (room.plantDeck || []) : (room.zombieDeck || []);
  const mySpells = Object.values(COMMANDER_SPELLS).filter((s) => s.faction === myFaction);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = new ClashSimulationEngine(room.map || 'verdant_grove');
    engineRef.current = engine;

    // AI Simulation for singleplayer practice
    const isSingleplayer = !room.guestId;
    let aiTimer = 0;

    let lastTime = performance.now();
    let animId: number;

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const delta = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Handle Resize
      if (canvas.width !== canvas.parentElement?.clientWidth || canvas.height !== canvas.parentElement?.clientHeight) {
        canvas.width = canvas.parentElement?.clientWidth || 900;
        canvas.height = canvas.parentElement?.clientHeight || 540;
      }

      const w = canvas.width;
      const h = canvas.height;

      // AI Opponent Logic in Solo Mode
      if (isSingleplayer) {
        aiTimer += delta;
        if (aiTimer > 4.5) {
          aiTimer = 0;
          if (isPlants) {
            // AI is Zombies
            const randomLane = Math.floor(Math.random() * 5);
            const zKeys = Object.keys(ZOMBIE_REGISTRY);
            const randomZ = zKeys[Math.floor(Math.random() * zKeys.length)];
            engine.summonZombie(randomLane, randomZ);
          } else {
            // AI is Plants
            const randomCol = Math.floor(Math.random() * 5);
            const randomRow = Math.floor(Math.random() * 5);
            const pKeys = ['plant_peablaster', 'plant_frostwillow', 'plant_thornnut', 'plant_spikemoss'];
            const randomP = pKeys[Math.floor(Math.random() * pKeys.length)];
            engine.placePlant(randomCol, randomRow, randomP);
          }
        }
      }

      // Update Simulation
      const result = engine.update(delta);
      if (result.winner) {
        onMatchFinished(result.winner);
      }

      // Update React State throttled
      setPlantSun(Math.round(engine.state.plantSun));
      setZombieBrains(Math.round(engine.state.zombieBrains));
      setPlantBaseHp(engine.state.plantBaseHp);
      setMatchTime(Math.round(engine.state.matchTime));

      // --- RENDERING 5-LANE BATTLEFIELD ---
      const mapConfig = MAP_CONFIGS[engine.mapType];
      ctx.fillStyle = mapConfig.bgColor || '#14532d';
      ctx.fillRect(0, 0, w, h);

      const cellW = (w - 70) / 9;
      const cellH = h / 5;
      const startX = 60; // Offset for base line

      // 1. Draw Lanes & Grid
      for (let r = 0; r < 5; r++) {
        // Alternate lane stripe
        ctx.fillStyle = r % 2 === 0 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.24)';
        ctx.fillRect(startX, r * cellH, cellW * 9, cellH);

        for (let c = 0; c < 9; c++) {
          const cx = startX + c * cellW;
          const cy = r * cellH;

          // Cell Border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, cellW, cellH);

          // Hazard / Special tile
          const hazard = mapConfig.hazards[`${c}_${r}`];
          if (hazard === 'sun_well') {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
            ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);
          } else if (hazard === 'toxic_puddle') {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);
          } else if (hazard === 'boost_speed') {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.fillRect(cx + 2, cy + 2, cellW - 4, cellH - 4);
          }
        }

        // Draw Lawn Mowers on Column -1
        if (engine.state.laneCleaners[r]) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(15, r * cellH + cellH * 0.3, 30, cellH * 0.4);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('CLEAN', 16, r * cellH + cellH * 0.55);
        }
      }

      // 2. Draw Plants
      Object.values(engine.state.plants).forEach((plant) => {
        const def = PLANT_REGISTRY[plant.cardId];
        if (!def) return;

        const px = startX + plant.col * cellW + cellW * 0.15;
        const py = plant.row * cellH + cellH * 0.15;
        const pw = cellW * 0.7;
        const ph = cellH * 0.7;

        // Plant Body
        ctx.fillStyle = def.color;
        ctx.fillRect(px, py, pw, ph);

        if (def.accentColor) {
          ctx.fillStyle = def.accentColor;
          ctx.fillRect(px + 4, py + 4, pw - 8, ph - 8);
        }

        // Name tag
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(def.name.substring(0, 7), px + 2, py + ph * 0.55);

        // Health bar
        ctx.fillStyle = '#000';
        ctx.fillRect(px, py - 4, pw, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px, py - 4, pw * (plant.health / plant.maxHealth), 3);
      });

      // 3. Draw Projectiles
      engine.state.projectiles.forEach((p) => {
        const ppx = startX + p.x * cellW;
        const ppy = p.lane * cellH + cellH * 0.5;

        ctx.fillStyle = p.type === 'frost' ? '#38bdf8' : p.type === 'melon' ? '#047857' : '#4ade80';
        ctx.beginPath();
        ctx.arc(ppx, ppy, p.isLobbed ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw Zombies
      engine.state.zombies.forEach((z) => {
        const def = ZOMBIE_REGISTRY[z.cardId];
        const zx = startX + z.x * cellW;
        const zy = z.lane * cellH + cellH * 0.15;
        const zw = cellW * 0.65;
        const zh = cellH * 0.7;

        ctx.fillStyle = z.isSlowed ? '#38bdf8' : (def?.color || '#6b7280');
        ctx.fillRect(zx, zy, zw, zh);

        // Name label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(def?.name.substring(0, 7) || 'Zombie', zx + 2, zy + zh * 0.55);

        // Health bar
        ctx.fillStyle = '#000';
        ctx.fillRect(zx, zy - 4, zw, 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(zx, zy - 4, zw * (z.health / z.maxHealth), 3);
      });

      // 5. Draw Particles & Damage Numbers
      engine.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(startX + p.x * cellW, p.y * cellH + cellH * 0.5, p.size, p.size);
      });

      ctx.font = 'bold 12px monospace';
      engine.floatingNumbers.forEach((f) => {
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, startX + f.x * cellW, f.y * cellH + cellH * 0.5);
      });
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlants, myFaction, onMatchFinished, room.guestId, room.map]);

  // Handle Grid / Lane Click (Desktop & Mobile Touch)
  const handleBoardClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellW = (canvas.width - 70) / 9;
    const cellH = canvas.height / 5;
    const startX = 60;

    const lane = Math.floor(clickY / cellH);
    const col = Math.floor((clickX - startX) / cellW);

    if (lane < 0 || lane > 4) return;

    if (isPlants) {
      // Plant placement on valid column 0-7
      if (selectedCardId && col >= 0 && col <= 7) {
        const ok = engineRef.current.placePlant(col, lane, selectedCardId);
        if (ok) {
          setSelectedCardId(null);
        }
      }
    } else {
      // Zombie summon on lane 0-4
      if (selectedCardId) {
        const ok = engineRef.current.summonZombie(lane, selectedCardId);
        if (ok) {
          setSelectedCardId(null);
        }
      }
    }
  };

  const handleCastCommanderSpell = (spellId: string) => {
    if (!engineRef.current) return;
    const spell = COMMANDER_SPELLS[spellId];
    if (!spell) return;

    const resource = isPlants ? engineRef.current.state.plantSun : engineRef.current.state.zombieBrains;
    if (resource < spell.cost) return;

    if (isPlants) engineRef.current.state.plantSun -= spell.cost;
    else engineRef.current.state.zombieBrains -= spell.cost;

    engineRef.current.castSpell(spellId, 2);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    clashNet.sendChat(room.roomCode, room.playerNames[myId] || 'Player', chatInput.trim(), room.playerColors[myId] || '#3b82f6');
    setChatInput('');
  };

  return (
    <div className="clash-battlefield-wrapper">
      {/* Top HUD Bar */}
      <div className="battle-top-hud">
        {/* Resource Gauge */}
        <div className="resource-display-pill">
          {isPlants ? (
            <>
              <Zap className="icon-xs text-amber animate-pulse" />
              <span>SOLAR ENERGY: <strong>{plantSun} ☀</strong></span>
            </>
          ) : (
            <>
              <Skull className="icon-xs text-purple animate-pulse" />
              <span>BRAIN ESSENCE: <strong>{zombieBrains} 🧠</strong></span>
            </>
          )}
        </div>

        {/* Center: Base Core HP & Timer */}
        <div className="base-core-hp-indicator">
          <Heart className="icon-xs text-rose" />
          <span>CORE INTEGRITY: <strong>{plantBaseHp}/100</strong></span>
          <span className="match-timer-tag"><Clock className="icon-xxs" /> {Math.floor(matchTime / 60)}:{String(matchTime % 60).padStart(2, '0')}</span>
        </div>

        {/* Commander Powers */}
        <div className="commander-powers-row">
          {mySpells.map((spell) => (
            <button
              key={spell.id}
              type="button"
              onClick={() => handleCastCommanderSpell(spell.id)}
              className="btn-commander-power"
              title={spell.description}
            >
              <Sparkles className="icon-xxs" />
              <span>{spell.name.substring(0, 8)} ({spell.cost})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 5-Lane Canvas */}
      <div className="battle-canvas-container">
        <canvas
          ref={canvasRef}
          onClick={handleBoardClick}
          className="battle-interactive-canvas"
        />
      </div>

      {/* Bottom Deck Selection Hotbar */}
      <div className="battle-bottom-hotbar">
        <div className="deck-hotbar-grid">
          {myDeck.map((cardId) => {
            const cardDef = isPlants ? PLANT_REGISTRY[cardId] : ZOMBIE_REGISTRY[cardId];
            if (!cardDef) return null;

            const isSelected = selectedCardId === cardId;
            const currentRes = isPlants ? plantSun : zombieBrains;
            const canAfford = currentRes >= cardDef.cost;

            return (
              <div
                key={cardId}
                onClick={() => canAfford && setSelectedCardId(isSelected ? null : cardId)}
                className={`battle-deck-slot ${isSelected ? 'is-active-placing' : ''} ${!canAfford ? 'cant-afford' : ''}`}
                style={{ borderBottomColor: cardDef.color }}
              >
                <div className="slot-cost-badge">
                  {isPlants ? <Zap className="icon-xxs text-amber" /> : <Skull className="icon-xxs text-purple" />}
                  {cardDef.cost}
                </div>
                <span className="slot-unit-name">{cardDef.name.substring(0, 8)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
