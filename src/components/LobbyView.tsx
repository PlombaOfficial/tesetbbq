import React, { useState } from 'react';
import { BackroomsRoomState, BackroomsPlayer, HazmatColor } from '../types/horrorGame';
import { BACKROOMS_LEVELS } from '../game/engine/LevelsConfig';
import { backroomsNet } from '../multiplayer/backroomsNet';
import { spatialAudio } from '../game/engine/SpatialAudio';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  CheckCircle, 
  Circle, 
  Palette, 
  Layers, 
  LogOut,
  Edit3
} from 'lucide-react';

interface LobbyViewProps {
  room: BackroomsRoomState;
  localPlayer: BackroomsPlayer;
  onLeaveLobby: () => void;
}

const HAZMAT_COLORS: Array<{ hex: HazmatColor; label: string }> = [
  { hex: '#eab308', label: 'Safety Yellow' },
  { hex: '#06b6d4', label: 'Cyan Research' },
  { hex: '#f97316', label: 'Biohazard Orange' },
  { hex: '#10b981', label: 'Medical Emerald' },
  { hex: '#ec4899', label: 'Anomaly Pink' },
  { hex: '#8b5cf6', label: 'Void Violet' },
  { hex: '#f43f5e', label: 'Security Crimson' }
];

export const LobbyView: React.FC<LobbyViewProps> = ({ room, localPlayer, onLeaveLobby }) => {
  const [copied, setCopied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(room.currentLevel);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(localPlayer.name);

  const playersList = Object.values(room.players || {});
  const myPlayerInRoom = room.players[localPlayer.id] || localPlayer;
  const isMeReady = !!myPlayerInRoom.isReady;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    spatialAudio.playFlashlightClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    spatialAudio.playFlashlightClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    spatialAudio.playFlashlightClick();
    const nextReady = !isMeReady;
    localPlayer.isReady = nextReady;
    await backroomsNet.setPlayerReady(room.roomCode, localPlayer.id, nextReady);
  };

  const handleColorChange = async (hex: HazmatColor) => {
    localPlayer.color = hex;
    localStorage.setItem('complex_player_color', hex);
    spatialAudio.playFlashlightClick();
    await backroomsNet.setPlayerColor(room.roomCode, localPlayer.id, hex);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    localPlayer.name = customName.trim();
    localStorage.setItem('complex_player_name', customName.trim());
    setIsEditingName(false);
    await backroomsNet.setPlayerName(room.roomCode, localPlayer.id, customName.trim());
  };

  const handleStartGame = async () => {
    if (!localPlayer.isHost) return;
    spatialAudio.playRadioSquelch(true);
    await backroomsNet.startExpedition(room.roomCode);
  };

  const currentLevelDef = BACKROOMS_LEVELS[selectedLevel] || BACKROOMS_LEVELS[0];

  return (
    <div className="lobby-horror-container">
      {/* Header Bar */}
      <div className="lobby-top-header">
        <div className="squad-info-block">
          <span className="squad-status-badge">● SQUAD FREQUENCY ESTABLISHED</span>
          <h2>EXPEDITION CODE: <strong className="text-amber">{room.roomCode}</strong></h2>
        </div>

        <div className="lobby-header-actions">
          <button type="button" onClick={handleCopyCode} className="btn-copy-code">
            {copied ? <Check className="icon-xs text-emerald" /> : <Copy className="icon-xs" />}
            <span>{copied ? 'CODE COPIED' : 'COPY CODE'}</span>
          </button>
          <button type="button" onClick={handleCopyLink} className="btn-copy-code">
            <Copy className="icon-xs" />
            <span>SHARE INVITE LINK</span>
          </button>
          <button type="button" onClick={onLeaveLobby} className="btn-leave-lobby">
            <LogOut className="icon-xs" />
          </button>
        </div>
      </div>

      {/* Main Squad & Level Configuration Grid */}
      <div className="lobby-horror-grid">
        {/* Left Column: Operatives List & Hazmat Suit Customizer */}
        <div className="lobby-horror-card">
          <div className="card-title-row">
            <Users className="icon-sm text-amber" />
            <h3>EXPEDITION SQUAD ({playersList.length}/6)</h3>
          </div>

          {/* Callsign Editor */}
          <div className="callsign-editor-bar">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="name-edit-form">
                <input
                  type="text"
                  value={customName}
                  maxLength={16}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="name-input"
                  autoFocus
                />
                <button type="submit" className="btn-save-name">SAVE</button>
              </form>
            ) : (
              <div className="name-display" onClick={() => setIsEditingName(true)}>
                <span>OPERATIVE CALLSIGN: <strong>{localPlayer.name}</strong></span>
                <Edit3 className="icon-xxs text-amber" />
              </div>
            )}
          </div>

          <div className="players-list-scroll">
            {playersList.map((p) => (
              <div key={p.id} className="player-roster-row" style={{ borderLeftColor: p.color }}>
                <div className="hazmat-color-dot" style={{ backgroundColor: p.color }} />
                <div className="player-details">
                  <span className="player-callsign">
                    {p.name} {p.id === localPlayer.id && '(YOU)'}
                  </span>
                  {p.isHost && <span className="host-tag">SQUAD LEADER</span>}
                </div>
                <div className="player-ready-status">
                  {p.isReady ? (
                    <span className="ready-tag text-emerald">
                      <CheckCircle className="icon-xs" /> READY
                    </span>
                  ) : (
                    <span className="waiting-tag text-slate">
                      <Circle className="icon-xs" /> PREPARING
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Hazmat Suit Color Selector */}
          <div className="suit-color-selector-section">
            <div className="section-label">
              <Palette className="icon-xs" /> SELECT HAZMAT SUIT DYE:
            </div>
            <div className="color-swatches-grid">
              {HAZMAT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleColorChange(c.hex)}
                  className={`color-swatch-btn ${myPlayerInRoom.color === c.hex ? 'active-swatch' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Descent Level Briefing & Launch */}
        <div className="lobby-horror-card">
          <div className="card-title-row">
            <Layers className="icon-sm text-cyan" />
            <h3>TARGET ANOMALOUS ZONE</h3>
          </div>

          {/* Level Selector */}
          {localPlayer.isHost && (
            <div className="level-select-row">
              <label>STARTING ENTRY LEVEL:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="custom-level-select"
              >
                {BACKROOMS_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.title} - {lvl.subtitle} ({lvl.survivalClass})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level Dossier Card */}
          <div className="level-briefing-dossier">
            <div className="level-id-badge">{currentLevelDef.title}</div>
            <h4>{currentLevelDef.subtitle}</h4>
            <p className="level-desc">{currentLevelDef.description}</p>
            <div className="level-class-badge">{currentLevelDef.survivalClass}</div>

            <div className="level-specs-grid">
              <div className="spec-item">
                <span>ACOUSTIC DRONE:</span>
                <strong>{currentLevelDef.dronePitch} Hz</strong>
              </div>
              <div className="spec-item">
                <span>CEILING HEIGHT:</span>
                <strong>{currentLevelDef.ceilingHeight}m</strong>
              </div>
              <div className="spec-item">
                <span>EXIT CRITERIA:</span>
                <strong>{currentLevelDef.exitCondition.replace('_', ' ').toUpperCase()}</strong>
              </div>
              <div className="spec-item">
                <span>KNOWN ENTITIES:</span>
                <strong>{currentLevelDef.entitiesAllowed.join(', ').toUpperCase()}</strong>
              </div>
            </div>
          </div>

          {/* Ready & Launch Actions */}
          <div className="lobby-controls-footer">
            <button
              type="button"
              onClick={handleToggleReady}
              className={`btn-ready-toggle ${isMeReady ? 'ready-on' : 'ready-off'}`}
            >
              {isMeReady ? 'READY TO DESCEND ✓' : 'SET AS READY'}
            </button>

            {localPlayer.isHost && (
              <button
                type="button"
                onClick={handleStartGame}
                className="btn-start-expedition"
              >
                <Play className="icon-sm" />
                <span>DESCEND INTO THE COMPLEX</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
