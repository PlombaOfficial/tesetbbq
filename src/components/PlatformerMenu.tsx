import React, { useState, useEffect } from 'react';
import { SavedWorld } from '../../types/platformerGame';
import { SaveManager } from '../game/platformer/SaveManager';
import { platformerAudio } from '../game/platformer/PlatformerAudio';
import { 
  Play, 
  RotateCcw, 
  Users, 
  KeyRound, 
  BookOpen, 
  Settings, 
  Pickaxe, 
  Layers, 
  Monitor, 
  Smartphone,
  Trash2
} from 'lucide-react';

interface PlatformerMenuProps {
  onContinueWorld: (world: SavedWorld) => void;
  onStartSingleplayer: (worldName: string, seed?: number) => void;
  onCreateMultiplayer: (worldName: string, seed?: number) => void;
  onJoinMultiplayer: (code: string) => void;
}

export const PlatformerMenu: React.FC<PlatformerMenuProps> = ({
  onContinueWorld,
  onStartSingleplayer,
  onCreateMultiplayer,
  onJoinMultiplayer
}) => {
  const [savedWorlds, setSavedWorlds] = useState<SavedWorld[]>([]);
  const [activeModal, setActiveModal] = useState<'create_sp' | 'create_mp' | 'join' | 'worlds_list' | 'guide' | 'settings' | null>(null);
  const [worldName, setWorldName] = useState('Terran Realm');
  const [customSeed, setCustomSeed] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    setSavedWorlds(SaveManager.getSavedWorlds());
  }, []);

  const latestWorld = savedWorlds.length > 0 ? savedWorlds[0] : null;

  return (
    <div className="platformer-menu-root">
      <div className="menu-backdrop-animated" />

      <div className="platformer-menu-card">
        {/* Logo Title */}
        <div className="menu-header-logo">
          <div className="menu-icon-emblem">
            <Pickaxe className="icon-md text-amber" />
          </div>
          <h1 className="menu-main-title">AETHERIA CHRONICLES</h1>
          <p className="menu-subtitle">2D SURVIVAL PLATFORMER // EXPEDITION & BUILDING</p>
        </div>

        {/* Action Button List */}
        <div className="menu-actions-column">
          {/* 1. CONTINUE WORLD (If has save) */}
          {latestWorld && (
            <button
              type="button"
              onClick={() => {
                platformerAudio.playTilePlace();
                onContinueWorld(latestWorld);
              }}
              className="btn-menu-primary btn-continue"
            >
              <RotateCcw className="icon-sm text-emerald" />
              <div className="btn-label-group">
                <strong>CONTINUE EXPEDITION</strong>
                <span>Resume [{latestWorld.name}] (Saved {new Date(latestWorld.lastSaved).toLocaleDateString()})</span>
              </div>
            </button>
          )}

          {/* 2. CREATE NEW EXPEDITION */}
          <button
            type="button"
            onClick={() => {
              platformerAudio.playTilePlace();
              setActiveModal('create_sp');
            }}
            className="btn-menu-primary"
          >
            <Play className="icon-sm text-cyan" />
            <div className="btn-label-group">
              <strong>NEW EXPEDITION</strong>
              <span>Generate a new procedural world to explore</span>
            </div>
          </button>

          {/* 3. HOST MULTIPLAYER */}
          <button
            type="button"
            onClick={() => {
              platformerAudio.playTilePlace();
              setActiveModal('create_mp');
            }}
            className="btn-menu-primary"
          >
            <Users className="icon-sm text-amber" />
            <div className="btn-label-group">
              <strong>HOST CO-OP REALM</strong>
              <span>Host your world & invite friends via 6-char code</span>
            </div>
          </button>

          {/* 4. JOIN VIA ROOM CODE */}
          <button
            type="button"
            onClick={() => {
              platformerAudio.playTilePlace();
              setActiveModal('join');
            }}
            className="btn-menu-primary"
          >
            <KeyRound className="icon-sm text-rose" />
            <div className="btn-label-group">
              <strong>CONNECT TO REALM</strong>
              <span>Join a friend's hosted world with code</span>
            </div>
          </button>

          {/* Secondary Options */}
          <div className="menu-secondary-row">
            <button
              type="button"
              onClick={() => {
                platformerAudio.playTilePlace();
                setActiveModal('guide');
              }}
              className="btn-secondary-pill"
            >
              <BookOpen className="icon-xs" />
              <span>HOW TO PLAY</span>
            </button>

            <button
              type="button"
              onClick={() => {
                platformerAudio.playTilePlace();
                setActiveModal('settings');
              }}
              className="btn-secondary-pill"
            >
              <Settings className="icon-xs" />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>

        <div className="menu-device-support-tag">
          DESKTOP (KEYBOARD + MOUSE) & MOBILE TOUCH CONTROLS SUPPORTED
        </div>
      </div>

      {/* MODAL: Create Singleplayer */}
      {activeModal === 'create_sp' && (
        <div className="modal-backdrop-2d">
          <div className="dialog-box-2d">
            <h3>CREATE NEW EXPEDITION</h3>
            <div className="input-group-2d">
              <label>WORLD NAME:</label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                className="input-field-2d"
              />
            </div>
            <div className="input-group-2d">
              <label>CUSTOM SEED (OPTIONAL):</label>
              <input
                type="text"
                placeholder="Leave blank for random procedural seed"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                className="input-field-2d"
              />
            </div>
            <div className="dialog-actions-row">
              <button
                type="button"
                onClick={() => {
                  const seedNum = customSeed ? parseInt(customSeed) || Math.floor(Math.random() * 900000) : undefined;
                  onStartSingleplayer(worldName, seedNum);
                }}
                className="btn-confirm-primary"
              >
                GENERATE & ENTER WORLD
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-cancel-flat">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Host Co-op Realm */}
      {activeModal === 'create_mp' && (
        <div className="modal-backdrop-2d">
          <div className="dialog-box-2d">
            <h3>HOST MULTIPLAYER EXPEDITION</h3>
            <div className="input-group-2d">
              <label>REALM NAME:</label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                className="input-field-2d"
              />
            </div>
            <div className="input-group-2d">
              <label>CUSTOM SEED (OPTIONAL):</label>
              <input
                type="text"
                placeholder="Leave blank for random procedural seed"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                className="input-field-2d"
              />
            </div>
            <div className="dialog-actions-row">
              <button
                type="button"
                onClick={() => {
                  const seedNum = customSeed ? parseInt(customSeed) || Math.floor(Math.random() * 900000) : undefined;
                  onCreateMultiplayer(worldName, seedNum);
                }}
                className="btn-confirm-primary"
              >
                CREATE CO-OP LOBBY
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-cancel-flat">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Join Realm Code */}
      {activeModal === 'join' && (
        <div className="modal-backdrop-2d">
          <div className="dialog-box-2d">
            <h3>CONNECT TO CO-OP REALM</h3>
            <p className="dialog-helper-text">Enter the 6-character room code provided by your host friend.</p>
            <input
              type="text"
              placeholder="ROOM-XXXX"
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-field-2d code-big-input"
              autoFocus
            />
            <div className="dialog-actions-row">
              <button
                type="button"
                onClick={() => {
                  if (joinCode.trim()) onJoinMultiplayer(joinCode.trim());
                }}
                className="btn-confirm-primary"
              >
                CONNECT
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-cancel-flat">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Controls & Guide */}
      {activeModal === 'guide' && (
        <div className="modal-backdrop-2d">
          <div className="dialog-box-2d guide-large-card">
            <h3>HOW TO PLAY // CONTROLS</h3>
            <div className="guide-split-grid">
              <div className="guide-platform-block">
                <h4><Monitor className="icon-xs text-cyan" /> PC / KEYBOARD & MOUSE</h4>
                <ul>
                  <li><kbd>A</kbd> / <kbd>D</kbd> — Walk Left / Right</li>
                  <li><kbd>SPACE</kbd> / <kbd>W</kbd> — Jump (Hold for higher jump)</li>
                  <li><kbd>S</kbd> + <kbd>SPACE</kbd> — Drop through Wooden Platform</li>
                  <li><kbd>W</kbd> / <kbd>S</kbd> — Climb Up / Down on Ladders</li>
                  <li><kbd>LEFT CLICK</kbd> — Mine Target Tile / Attack Enemies</li>
                  <li><kbd>RIGHT CLICK</kbd> — Place Tile/Wall, Open Doors, Open Chests</li>
                  <li><kbd>1 - 9</kbd> — Select Hotbar Item</li>
                  <li><kbd>E</kbd> — Open Backpack Inventory</li>
                  <li><kbd>C</kbd> — Open Crafting Bench</li>
                  <li><kbd>SHIFT</kbd> — Sprint Fast</li>
                </ul>
              </div>

              <div className="guide-platform-block">
                <h4><Smartphone className="icon-xs text-amber" /> MOBILE / TOUCHSCREEN</h4>
                <ul>
                  <li><strong>Left Virtual Joystick</strong> — Move and climb ladders</li>
                  <li><strong>ACTION Button</strong> — Hold to mine tiles or swing weapon</li>
                  <li><strong>USE Button</strong> — Place equipped block or interact with doors/chests</li>
                  <li><strong>JUMP Button</strong> — Jump or climb up</li>
                  <li><strong>BAG [E] Button</strong> — Open inventory storage</li>
                  <li><strong>CRAFT [C] Button</strong> — Open recipe synthesis</li>
                </ul>
              </div>
            </div>
            <button type="button" onClick={() => setActiveModal(null)} className="btn-confirm-primary">
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Settings */}
      {activeModal === 'settings' && (
        <div className="modal-backdrop-2d">
          <div className="dialog-box-2d">
            <h3>AUDIO & GAMEPLAY SETTINGS</h3>
            <div className="input-group-2d">
              <label>MASTER VOLUME:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.6"
                onChange={(e) => platformerAudio.setVolume(Number(e.target.value))}
                className="range-input-2d"
              />
            </div>
            <button type="button" onClick={() => setActiveModal(null)} className="btn-confirm-primary">
              SAVE & CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
