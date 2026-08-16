import React, { useState } from 'react';
import { 
  Users, 
  Play, 
  Settings, 
  BookOpen, 
  KeyRound, 
  Pickaxe, 
  Smartphone, 
  Monitor 
} from 'lucide-react';
import { voxelAudio } from '../game/audio/VoxelAudio';

interface VoxelMainMenuProps {
  onStartSingleplayer: (worldName: string, seed?: number) => void;
  onCreateMultiplayer: (worldName: string, seed?: number) => void;
  onJoinMultiplayer: (code: string) => void;
}

export const VoxelMainMenu: React.FC<VoxelMainMenuProps> = ({
  onStartSingleplayer,
  onCreateMultiplayer,
  onJoinMultiplayer
}) => {
  const [worldName, setWorldName] = useState('Aetheria Realm');
  const [customSeed, setCustomSeed] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [activeModal, setActiveModal] = useState<'create_sp' | 'create_mp' | 'join' | 'guide' | 'settings' | null>(null);

  return (
    <div className="voxel-menu-container">
      {/* Background Animated Sky/Terrain Backdrop */}
      <div className="voxel-menu-backdrop" />

      <div className="voxel-menu-card">
        {/* Title Logo Header */}
        <div className="menu-logo-header">
          <div className="voxel-cube-logo">
            <Pickaxe className="icon-md text-amber" />
          </div>
          <h1 className="voxel-title">AETHERIA</h1>
          <p className="voxel-tagline">INFINITE 3D VOXEL SANDBOX // EXPEDITIONS & AUTOMATION</p>
        </div>

        {/* Primary Action Buttons */}
        <div className="voxel-menu-btn-list">
          <button
            type="button"
            onClick={() => {
              voxelAudio.playBlockPlace();
              setActiveModal('create_sp');
            }}
            className="btn-voxel-menu btn-sp"
          >
            <Play className="icon-sm text-emerald" />
            <div className="btn-details">
              <strong>SINGLEPLAYER EXPEDITION</strong>
              <span>Explore infinite biomes, caves, and craft alone</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              voxelAudio.playBlockPlace();
              setActiveModal('create_mp');
            }}
            className="btn-voxel-menu btn-mp"
          >
            <Users className="icon-sm text-cyan" />
            <div className="btn-details">
              <strong>HOST MULTIPLAYER REALM</strong>
              <span>Create room & invite friends via 6-char code</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              voxelAudio.playBlockPlace();
              setActiveModal('join');
            }}
            className="btn-voxel-menu btn-join"
          >
            <KeyRound className="icon-sm text-amber" />
            <div className="btn-details">
              <strong>CONNECT VIA REALM CODE</strong>
              <span>Join a friend's ongoing world</span>
            </div>
          </button>

          {/* Secondary Options */}
          <div className="menu-bottom-actions">
            <button
              type="button"
              onClick={() => {
                voxelAudio.playBlockPlace();
                setActiveModal('guide');
              }}
              className="btn-secondary-voxel"
            >
              <BookOpen className="icon-xs" />
              <span>CONTROLS & GUIDE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                voxelAudio.playBlockPlace();
                setActiveModal('settings');
              }}
              className="btn-secondary-voxel"
            >
              <Settings className="icon-xs" />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="voxel-menu-footer">
          DESKTOP (MOUSE + WASD) & MOBILE (TOUCH CONTROLS) FULLY SUPPORTED
        </div>
      </div>

      {/* MODAL 1: Create Singleplayer World */}
      {activeModal === 'create_sp' && (
        <div className="modal-backdrop">
          <div className="voxel-dialog-card">
            <h3>CREATE SINGLEPLAYER REALM</h3>
            <div className="form-group">
              <label>WORLD NAME:</label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                className="voxel-input"
              />
            </div>
            <div className="form-group">
              <label>CUSTOM SEED (OPTIONAL):</label>
              <input
                type="text"
                placeholder="Leave blank for random procedural seed"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                className="voxel-input"
              />
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => {
                  const seedNum = customSeed ? parseInt(customSeed) || Math.floor(Math.random() * 900000) : undefined;
                  onStartSingleplayer(worldName, seedNum);
                }}
                className="btn-confirm"
              >
                GENERATE & ENTER WORLD
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-cancel">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Multiplayer Realm */}
      {activeModal === 'create_mp' && (
        <div className="modal-backdrop">
          <div className="voxel-dialog-card">
            <h3>HOST MULTIPLAYER REALM</h3>
            <div className="form-group">
              <label>REALM NAME:</label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                className="voxel-input"
              />
            </div>
            <div className="form-group">
              <label>CUSTOM SEED (OPTIONAL):</label>
              <input
                type="text"
                placeholder="Leave blank for random procedural seed"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                className="voxel-input"
              />
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => {
                  const seedNum = customSeed ? parseInt(customSeed) || Math.floor(Math.random() * 900000) : undefined;
                  onCreateMultiplayer(worldName, seedNum);
                }}
                className="btn-confirm"
              >
                CREATE REALM LOBBY
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-cancel">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Join Realm Code */}
      {activeModal === 'join' && (
        <div className="modal-backdrop">
          <div className="voxel-dialog-card">
            <h3>JOIN MULTIPLAYER REALM</h3>
            <p>Enter the 6-character room code from your friend.</p>
            <input
              type="text"
              placeholder="ROOM-XXXX"
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="voxel-input code-input"
              autoFocus
            />
            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => {
                  if (joinCode.trim()) onJoinMultiplayer(joinCode.trim());
                }}
                className="btn-confirm"
              >
                CONNECT
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="btn-cancel">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Controls & Guide */}
      {activeModal === 'guide' && (
        <div className="modal-backdrop">
          <div className="voxel-dialog-card guide-card">
            <h3>HOW TO PLAY // CONTROLS</h3>
            <div className="guide-columns-grid">
              <div className="guide-col">
                <h4><Monitor className="icon-xs" /> PC / KEYBOARD & MOUSE</h4>
                <ul>
                  <li><kbd>W A S D</kbd> - Move Character</li>
                  <li><kbd>MOUSE</kbd> - Look Around</li>
                  <li><kbd>LEFT CLICK</kbd> - Mine / Attack</li>
                  <li><kbd>RIGHT CLICK</kbd> - Place Block / Interact</li>
                  <li><kbd>SPACE</kbd> - Jump / Swim Up</li>
                  <li><kbd>1 - 9</kbd> - Select Hotbar Slot</li>
                  <li><kbd>E</kbd> - Open Inventory & Crafting</li>
                  <li><kbd>SHIFT</kbd> - Sprint Fast</li>
                </ul>
              </div>

              <div className="guide-col">
                <h4><Smartphone className="icon-xs" /> MOBILE / TOUCHSCREEN</h4>
                <ul>
                  <li><strong>Left Virtual Joystick</strong> - Move in 8 directions</li>
                  <li><strong>Right Screen Drag</strong> - Look around in 3D</li>
                  <li><strong>MINE button</strong> - Hold to mine blocks</li>
                  <li><strong>PLACE button</strong> - Place equipped block</li>
                  <li><strong>JUMP button</strong> - Jump or swim</li>
                  <li><strong>BACKPACK button</strong> - Open backpack & recipes</li>
                </ul>
              </div>
            </div>
            <button type="button" onClick={() => setActiveModal(null)} className="btn-confirm">
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: Settings */}
      {activeModal === 'settings' && (
        <div className="modal-backdrop">
          <div className="voxel-dialog-card">
            <h3>SETTINGS</h3>
            <div className="form-group">
              <label>AUDIO VOLUME:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.6"
                onChange={(e) => voxelAudio.setVolume(Number(e.target.value))}
                className="voxel-range"
              />
            </div>
            <button type="button" onClick={() => setActiveModal(null)} className="btn-confirm">
              SAVE & CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
