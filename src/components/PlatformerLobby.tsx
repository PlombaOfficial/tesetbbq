import React, { useState, useEffect } from 'react';
import { PlatformerRoomState, PlatformerPlayer } from '../../types/platformerGame';
import { platformerNet } from '../multiplayer/platformerNet';
import { platformerAudio } from '../game/platformer/PlatformerAudio';
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

interface PlatformerLobbyProps {
  room: PlatformerRoomState;
  localPlayer: PlatformerPlayer;
  onLeaveLobby: () => void;
}

const PLAYER_DYES = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

export const PlatformerLobby: React.FC<PlatformerLobbyProps> = ({
  room,
  localPlayer,
  onLeaveLobby
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const playersList = Object.values(room.players || {});
  const myPlayerInRoom = room.players[localPlayer.id] || localPlayer;
  const isMeReady = !!myPlayerInRoom.isReady;

  const isHost = (room.hostId === localPlayer.id) || (myPlayerInRoom && myPlayerInRoom.isHost) || (playersList.length === 1);
  const allReady = playersList.length > 0 && playersList.every((p) => p.isReady);

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
            platformerAudio.playChestOpen();
            await platformerNet.startWorld(room.roomCode);
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
    platformerAudio.playTilePlace();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?coop=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    platformerAudio.playTilePlace();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    platformerAudio.playTilePlace();
    const nextReady = !isMeReady;
    localPlayer.isReady = nextReady;
    await platformerNet.setPlayerReady(room.roomCode, localPlayer.id, nextReady);
  };

  const handleStartWorld = async () => {
    platformerAudio.playChestOpen();
    await platformerNet.startWorld(room.roomCode);
  };

  return (
    <div className="platformer-lobby-root">
      {/* Header Bar */}
      <div className="lobby-header-bar">
        <div className="header-meta-group">
          <span className="live-pill">● CO-OP EXPEDITION ONLINE</span>
          <h2>{room.worldName} <span className="text-amber">[{room.roomCode}]</span></h2>
        </div>

        <div className="header-btn-cluster">
          <button type="button" onClick={handleCopyCode} className="btn-lobby-action">
            {copied ? <Check className="icon-xs text-emerald" /> : <Copy className="icon-xs" />}
            <span>{copied ? 'CODE COPIED' : 'COPY CODE'}</span>
          </button>
          <button type="button" onClick={handleCopyLink} className="btn-lobby-action">
            <Copy className="icon-xs" />
            <span>SHARE LINK</span>
          </button>
          <button type="button" onClick={onLeaveLobby} className="btn-lobby-action">
            <LogOut className="icon-xs" />
          </button>
        </div>
      </div>

      {/* Ready Banner */}
      {allReady ? (
        <div className="all-ready-banner-2d">
          <Sparkles className="icon-sm text-emerald" />
          <span>ALL ADVENTURERS READY! {countdown !== null ? `ENTERING EXPEDITION IN ${countdown}s...` : 'STARTING...'}</span>
        </div>
      ) : (
        <div className="waiting-banner-2d">
          <Clock className="icon-sm text-amber" />
          <span>Waiting for all players to set READY ({playersList.filter(p => p.isReady).length}/{playersList.length} ready)</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="lobby-content-grid">
        {/* Left: Player Roster */}
        <div className="lobby-box-card">
          <div className="box-header-title">
            <Users className="icon-sm text-cyan" />
            <h3>CONNECTED TRAVELERS ({playersList.length}/8)</h3>
          </div>

          <div className="roster-list-scroll">
            {playersList.map((p) => {
              const isThisPlayerHost = p.id === room.hostId || p.isHost;
              return (
                <div key={p.id} className="player-chip-row" style={{ borderLeftColor: p.color }}>
                  <div className="player-avatar-square" style={{ backgroundColor: p.color }} />
                  <div className="player-label-wrap">
                    <strong>{p.name} {p.id === localPlayer.id && '(YOU)'}</strong>
                    {isThisPlayerHost && <span className="host-badge">HOST</span>}
                  </div>
                  <div className="player-ready-state">
                    {p.isReady ? (
                      <span className="ready-indicator text-emerald"><CheckCircle className="icon-xs" /> READY</span>
                    ) : (
                      <span className="waiting-indicator text-slate"><Circle className="icon-xs" /> PREPARING</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skin Color Picker */}
          <div className="tunic-dye-picker">
            <label><Palette className="icon-xs" /> CHOOSE TUNIC DYE:</label>
            <div className="dyes-palette-row">
              {PLAYER_DYES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    localPlayer.color = c;
                    localStorage.setItem('aetheria_2d_color', c);
                    platformerAudio.playTilePlace();
                  }}
                  className={`dye-swatch-box ${myPlayerInRoom.color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: World Manifest & Start */}
        <div className="lobby-box-card">
          <div className="box-header-title">
            <Layers className="icon-sm text-emerald" />
            <h3>EXPEDITION MANIFEST</h3>
          </div>

          <div className="manifest-info-list">
            <div className="manifest-entry">
              <span>PROCEDURAL SEED:</span>
              <strong>{room.seed}</strong>
            </div>
            <div className="manifest-entry">
              <span>GENERATION ENGINE:</span>
              <strong>Multi-Octave Simplex 2D Strata & Biomes</strong>
            </div>
            <div className="manifest-entry">
              <span>SURFACE BIOMES:</span>
              <strong>Sunwood Forests, Scorched Dunes, Snow Peaks</strong>
            </div>
            <div className="manifest-entry">
              <span>UNDERGROUND STRATA:</span>
              <strong>Ironite Veins, Cobalt Caves, Magma Core, Dungeons</strong>
            </div>
          </div>

          <div className="lobby-bottom-btn-row">
            <button
              type="button"
              onClick={handleToggleReady}
              className={`btn-toggle-ready-2d ${isMeReady ? 'is-ready' : 'is-not-ready'}`}
            >
              {isMeReady ? 'READY TO EXPLORE ✓' : 'SET AS READY'}
            </button>

            {isHost && (
              <button
                type="button"
                onClick={handleStartWorld}
                className="btn-launch-expedition"
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
