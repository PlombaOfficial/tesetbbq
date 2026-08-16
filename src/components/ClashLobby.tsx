import React, { useState } from 'react';
import { ClashRoomState } from '../types/pvpClash';
import { clashNet } from '../multiplayer/clashNet';
import { clashAudio } from '../game/clash/ClashAudio';
import { MAP_CONFIGS } from '../game/clash/unitRegistry';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  LogOut, 
  Shield, 
  Skull, 
  Sparkles,
  MapPin,
  Clock
} from 'lucide-react';

interface ClashLobbyProps {
  room: ClashRoomState;
  myId: string;
  onLeave: () => void;
}

export const ClashLobby: React.FC<ClashLobbyProps> = ({
  room,
  myId,
  onLeave
}) => {
  const [copied, setCopied] = useState(false);

  const isHost = room.hostId === myId;
  const isGuestConnected = !!room.guestId;
  const mapConfig = MAP_CONFIGS[room.map || 'verdant_grove'];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    clashAudio.playResourceCollect();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartMatch = async () => {
    clashAudio.playVictory();
    await clashNet.rollRandomRoles(room.roomCode, room.hostId, room.guestId || 'ai_opponent');
  };

  return (
    <div className="clash-lobby-root">
      {/* Header Bar */}
      <div className="lobby-top-bar">
        <div className="arena-title-group">
          <span className="live-status-pill">● 1V1 DUEL ARENA</span>
          <h2>{room.worldName} <span className="text-amber">[{room.roomCode}]</span></h2>
        </div>

        <div className="lobby-actions-cluster">
          <button type="button" onClick={handleCopyCode} className="btn-copy-code">
            {copied ? <Check className="icon-xs text-emerald" /> : <Copy className="icon-xs" />}
            <span>{copied ? 'CODE COPIED' : 'COPY CODE'}</span>
          </button>
          <button type="button" onClick={onLeave} className="btn-leave-lobby">
            <LogOut className="icon-xs" />
          </button>
        </div>
      </div>

      {/* Main 2-Player Roster */}
      <div className="lobby-matchup-container">
        {/* Host Card */}
        <div className="player-roster-card host-side">
          <div className="player-role-avatar-box">
            <Shield className="icon-md text-emerald" />
          </div>
          <div className="player-name-details">
            <span className="role-tag">PLAYER 1 (HOST)</span>
            <strong>{room.playerNames[room.hostId] || 'Host Commander'}</strong>
          </div>
          <span className="ready-status-badge text-emerald">READY</span>
        </div>

        <div className="matchup-versus-badge">
          <span>VS</span>
        </div>

        {/* Guest Card */}
        <div className="player-roster-card guest-side">
          {isGuestConnected ? (
            <>
              <div className="player-role-avatar-box">
                <Skull className="icon-md text-rose" />
              </div>
              <div className="player-name-details">
                <span className="role-tag">PLAYER 2 (CHALLENGER)</span>
                <strong>{room.playerNames[room.guestId!] || 'Opponent'}</strong>
              </div>
              <span className="ready-status-badge text-emerald">CONNECTED</span>
            </>
          ) : (
            <div className="waiting-opponent-placeholder">
              <Clock className="icon-sm text-amber animate-spin" />
              <span>WAITING FOR OPPONENT TO JOIN...</span>
              <p>Share room code: <strong>{room.roomCode}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Map Card Info */}
      <div className="lobby-map-banner">
        <MapPin className="icon-xs text-amber" />
        <span>BATTLEFIELD: <strong>{mapConfig.name}</strong> — {mapConfig.description}</span>
      </div>

      {/* Launch Button */}
      <div className="lobby-start-footer">
        {isHost ? (
          <button
            type="button"
            disabled={!isGuestConnected}
            onClick={handleStartMatch}
            className={`btn-start-duel-primary ${isGuestConnected ? 'can-start' : 'cant-start'}`}
          >
            <Sparkles className="icon-sm" />
            <span>{isGuestConnected ? 'ROLL RANDOM ROLES & START MATCH' : 'WAITING FOR 2ND PLAYER...'}</span>
          </button>
        ) : (
          <div className="guest-waiting-host-notice">
            <Clock className="icon-xs text-amber animate-pulse" />
            <span>Waiting for host to launch role rolling...</span>
          </div>
        )}
      </div>
    </div>
  );
};
