import React, { useState } from 'react';
import { MapType } from '../types/pvpClash';
import { MAP_CONFIGS, PLANT_REGISTRY, ZOMBIE_REGISTRY } from '../game/clash/unitRegistry';
import { clashAudio } from '../game/clash/ClashAudio';
import { 
  Play, 
  Users, 
  KeyRound, 
  Bot, 
  BookOpen, 
  Layers, 
  Shield, 
  Skull, 
  Sparkles,
  MapPin
} from 'lucide-react';

interface ClashMenuProps {
  onCreateMatch: (map: MapType) => void;
  onJoinMatch: (code: string) => void;
  onPracticeAI: (map: MapType) => void;
}

export const ClashMenu: React.FC<ClashMenuProps> = ({
  onCreateMatch,
  onJoinMatch,
  onPracticeAI
}) => {
  const [activeModal, setActiveModal] = useState<'create' | 'join' | 'vault' | 'guide' | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapType>('verdant_grove');
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="clash-menu-root">
      <div className="clash-menu-card">
        {/* Header Title */}
        <div className="menu-header-box">
          <div className="menu-icon-badge-row">
            <Shield className="icon-md text-emerald" />
            <span className="text-amber font-bold">VS</span>
            <Skull className="icon-md text-rose" />
          </div>
          <h1 className="menu-title-text">BIO-CLASH: FLORA VS UNDEAD</h1>
          <p className="menu-subtitle-text">1V1 STRATEGIC LANE-BASED DUEL // RANDOM ROLE COMBAT</p>
        </div>

        {/* Action Button Options */}
        <div className="menu-actions-stack">
          {/* 1. Host Match */}
          <button
            type="button"
            onClick={() => {
              clashAudio.playResourceCollect();
              setActiveModal('create');
            }}
            className="btn-clash-menu-item btn-primary-clash"
          >
            <Users className="icon-sm text-cyan" />
            <div className="btn-text-block">
              <strong>CREATE 1V1 MATCH</strong>
              <span>Host a private match & invite a friend via 6-char code</span>
            </div>
          </button>

          {/* 2. Join Match */}
          <button
            type="button"
            onClick={() => {
              clashAudio.playResourceCollect();
              setActiveModal('join');
            }}
            className="btn-clash-menu-item"
          >
            <KeyRound className="icon-sm text-amber" />
            <div className="btn-text-block">
              <strong>JOIN ROOM CODE</strong>
              <span>Enter your opponent's room code</span>
            </div>
          </button>

          {/* 3. Practice vs AI */}
          <button
            type="button"
            onClick={() => {
              clashAudio.playPlantShoot();
              onPracticeAI(selectedMap);
            }}
            className="btn-clash-menu-item btn-ai-clash"
          >
            <Bot className="icon-sm text-emerald" />
            <div className="btn-text-block">
              <strong>SOLO BOT PRACTICE</strong>
              <span>Instant singleplayer match against an adaptive bot</span>
            </div>
          </button>

          {/* Secondary links */}
          <div className="menu-bottom-pills-row">
            <button
              type="button"
              onClick={() => {
                clashAudio.playPlantShoot();
                setActiveModal('vault');
              }}
              className="btn-pill-secondary"
            >
              <Layers className="icon-xs" />
              <span>CARD VAULT (32 UNITS)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clashAudio.playPlantShoot();
                setActiveModal('guide');
              }}
              className="btn-pill-secondary"
            >
              <BookOpen className="icon-xs" />
              <span>RULES & GUIDE</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Create Match (Map Selection) */}
      {activeModal === 'create' && (
        <div className="clash-modal-backdrop">
          <div className="clash-dialog-card">
            <h3>SELECT BATTLEFIELD MAP</h3>
            <div className="maps-selection-grid">
              {(Object.keys(MAP_CONFIGS) as MapType[]).map((mKey) => {
                const map = MAP_CONFIGS[mKey];
                const isSelected = selectedMap === mKey;

                return (
                  <div
                    key={mKey}
                    onClick={() => setSelectedMap(mKey)}
                    className={`map-card-select ${isSelected ? 'is-selected-map' : ''}`}
                  >
                    <MapPin className="icon-xs text-amber" />
                    <strong>{map.name}</strong>
                    <p>{map.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="dialog-btn-row">
              <button
                type="button"
                onClick={() => onCreateMatch(selectedMap)}
                className="btn-dialog-confirm"
              >
                CREATE ARENA LOBBY
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-dialog-cancel">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Join Room */}
      {activeModal === 'join' && (
        <div className="clash-modal-backdrop">
          <div className="clash-dialog-card">
            <h3>ENTER ARENA CODE</h3>
            <p className="dialog-sub-text">Type the 6-character room code from your friend.</p>
            <input
              type="text"
              maxLength={8}
              placeholder="CLASH-XXXX"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="dialog-code-input"
              autoFocus
            />
            <div className="dialog-btn-row">
              <button
                type="button"
                onClick={() => joinCode.trim() && onJoinMatch(joinCode.trim())}
                className="btn-dialog-confirm"
              >
                ENTER ARENA
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-dialog-cancel">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Unit Vault (16 Plants + 16 Zombies) */}
      {activeModal === 'vault' && (
        <div className="clash-modal-backdrop">
          <div className="clash-dialog-card vault-large-modal">
            <h3>UNIT VAULT (32 ORIGINAL CHARACTERS)</h3>
            <div className="vault-columns-grid">
              <div>
                <h4 className="text-emerald">🌱 FLORA ARSENAL (16 PLANTS)</h4>
                <div className="vault-scroll-col">
                  {Object.values(PLANT_REGISTRY).map((p) => (
                    <div key={p.id} className="vault-item-row" style={{ borderLeftColor: p.color }}>
                      <strong>{p.name} ({p.cost} ☀)</strong>
                      <span>{p.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-rose">🧟 NECRO HORDE (16 ZOMBIES)</h4>
                <div className="vault-scroll-col">
                  {Object.values(ZOMBIE_REGISTRY).map((z) => (
                    <div key={z.id} className="vault-item-row" style={{ borderLeftColor: z.color }}>
                      <strong>{z.name} ({z.cost} 🧠)</strong>
                      <span>{z.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setActiveModal(null)} className="btn-dialog-confirm">
              CLOSE VAULT
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Guide */}
      {activeModal === 'guide' && (
        <div className="clash-modal-backdrop">
          <div className="clash-dialog-card">
            <h3>HOW TO PLAY // STRATEGY RULES</h3>
            <ul className="guide-rules-list">
              <li><strong>🎲 Random Roles:</strong> Every match randomly rolls who commands the Flora and who commands the Undead!</li>
              <li><strong>🌱 Flora Goal:</strong> Plant defenses across 5 lanes, collect Solar Energy, and protect your Core Integrity.</li>
              <li><strong>🧟 Undead Goal:</strong> Dispatch waves of specialized ghouls to bypass defenses and breach the core.</li>
              <li><strong>🚜 Lawn Mowers:</strong> Each lane has 1 emergency cleaner that wipes all ground zombies if crossed!</li>
              <li><strong>🔄 Rematch Role Invert:</strong> Hitting Rematch automatically inverts player roles so you alternate sides!</li>
            </ul>
            <button type="button" onClick={() => setActiveModal(null)} className="btn-dialog-confirm">
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
