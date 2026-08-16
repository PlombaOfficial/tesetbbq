import React, { useState, useEffect } from 'react';
import { VoxelRoomState, VoxelPlayer } from '../types/voxelGame';
import { voxelNet } from '../multiplayer/voxelNet';
import { voxelAudio } from '../game/audio/VoxelAudio';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  CheckCircle, 
  Circle, 
  Palette, 
  LogOut, 
  Layers,
  Sparkles,
  Clock
} from 'lucide-react';

interface VoxelLobbyProps {
  room: VoxelRoomState;
  localPlayer: VoxelPlayer;
  onLeaveLobby: () => void;
}

const PLAYER_SKIN_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

export const VoxelLobby: React.FC<VoxelLobbyProps> = ({
  room,
  localPlayer,
  onLeaveLobby
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const playersList = Object.values(room.players || {});
  const myPlayerInRoom = room.players[localPlayer.id] || localPlayer;
  const isMeReady = !!myPlayerInRoom.isReady;

  // Reliable host calculation
  const isHost = (room.hostId === localPlayer.id) || (myPlayerInRoom && myPlayerInRoom.isHost) || (playersList.length === 1);

  const allReady = playersList.length > 0 && playersList.every((p) => p.isReady);

  // Auto-countdown when everyone is ready
  useEffect(() => {
    let timer: number | undefined;
    if (allReady && room.phase === 'LOBBY') {
      setCountdown(3);
      let count = 3;
      timer = window.setInterval(async () => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          if (isHost) {
            voxelAudio.playDaylightChime();
            await voxelNet.startWorld(room.roomCode);
          }
        }
      }, 1000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [allReady, isHost, room.phase, room.roomCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    voxelAudio.playBlockPlace();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?realm=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    voxelAudio.playBlockPlace();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    voxelAudio.playBlockPlace();
    const nextReady = !isMeReady;
    localPlayer.isReady = nextReady;
    await voxelNet.setPlayerReady(room.roomCode, localPlayer.id, nextReady);
  };

  const handleStartWorld = async () => {
    voxelAudio.playDaylightChime();
    await voxelNet.startWorld(room.roomCode);
  };

  return (
    <div className="voxel-lobby-container">
      {/* Header Bar */}
      <div className="voxel-lobby-header">
        <div className="header-info-col">
          <span className="realm-live-badge">● MULTIPLAYER REALM ONLINE</span>
          <h2>{room.worldName} <span className="text-amber">[{room.roomCode}]</span></h2>
        </div>

        <div className="header-actions-row">
          <button type="button" onClick={handleCopyCode} className="btn-copy-action">
            {copied ? <Check className="icon-xs text-emerald" /> : <Copy className="icon-xs" />}
            <span>{copied ? 'CODE COPIED' : 'COPY CODE'}</span>
          </button>
          <button type="button" onClick={handleCopyLink} className="btn-copy-action">
            <Copy className="icon-xs" />
            <span>SHARE LINK</span>
          </button>
          <button type="button" onClick={onLeaveLobby} className="btn-leave-action">
            <LogOut className="icon-xs" />
          </button>
        </div>
      </div>

      {/* Readiness Status Banner */}
      {allReady ? (
        <div className="all-ready-banner">
          <Sparkles className="icon-sm text-emerald" />
          <span>ALL TRAVELERS ARE READY! {countdown !== null ? `ENTERING REALM IN ${countdown}s...` : 'STARTING...'}</span>
        </div>
      ) : (
        <div className="waiting-ready-banner">
          <Clock className="icon-sm text-amber" />
          <span>Waiting for all players to click READY ({playersList.filter(p => p.isReady).length}/{playersList.length} ready)</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="voxel-lobby-grid">
        {/* Left Column: Player List & Skin Color */}
        <div className="voxel-card-box">
          <div className="box-title-row">
            <Users className="icon-sm text-cyan" />
            <h3>CONNECTED TRAVELERS ({playersList.length}/8)</h3>
          </div>

          <div className="players-scroll-roster">
            {playersList.map((p) => {
              const isThisPlayerHost = p.id === room.hostId || p.isHost;
              return (
                <div key={p.id} className="player-roster-chip" style={{ borderLeftColor: p.color }}>
                  <div className="player-avatar-icon" style={{ backgroundColor: p.color }} />
                  <div className="player-name-block">
                    <strong>{p.name} {p.id === localPlayer.id && '(YOU)'}</strong>
                    {isThisPlayerHost && <span className="host-pill">HOST</span>}
                  </div>
                  <div className="player-status-tag">
                    {p.isReady ? (
                      <span className="ready-text text-emerald"><CheckCircle className="icon-xs" /> READY</span>
                    ) : (
                      <span className="waiting-text text-slate"><Circle className="icon-xs" /> PREPARING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skin Color Picker */}
          <div className="skin-color-picker-box">
            <label><Palette className="icon-xs" /> CHOOSE TUNIC DYE:</label>
            <div className="color-swatches-row">
              {PLAYER_SKIN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    localPlayer.color = c;
                    localStorage.setItem('aetheria_player_color', c);
                    voxelAudio.playBlockPlace();
                  }}
                  className={`color-swatch-cube ${myPlayerInRoom.color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: World Details & Launch */}
        <div className="voxel-card-box">
          <div className="box-title-row">
            <Layers className="icon-sm text-emerald" />
            <h3>REALM GENERATION MANIFEST</h3>
          </div>

          <div className="world-manifest-dossier">
            <div className="manifest-item">
              <span>PROCEDURAL SEED:</span>
              <strong>{room.seed}</strong>
            </div>
            <div className="manifest-item">
              <span>GENERATION ENGINE:</span>
              <strong>Infinite Multi-Octave Voxel Chunks</strong>
            </div>
            <div className="manifest-item">
              <span>SURFACE BIOMES:</span>
              <strong>Plains, Redwood Forest, Dunes, Frosted Peaks, Marshes</strong>
            </div>
            <div className="manifest-item">
              <span>SUBTERRANEAN STRATA:</span>
              <strong>Ironite, Cobalt, Prism Crystal, Magma Pockets, Voidstone</strong>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="lobby-actions-footer">
            <button
              type="button"
              onClick={handleToggleReady}
              className={`btn-ready-toggle ${isMeReady ? 'is-ready' : 'not-ready'}`}
            >
              {isMeReady ? 'READY TO EXPLORE ✓' : 'SET AS READY'}
            </button>

            {/* Launch Button for Host */}
            {isHost && (
              <button
                type="button"
                onClick={handleStartWorld}
                className="btn-launch-realm"
              >
                <Play className="icon-sm" />
                <span>START GAME NOW</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
