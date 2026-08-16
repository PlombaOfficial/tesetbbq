import React from 'react';
import { BackroomsRoomState, BackroomsPlayer } from '../types/horrorGame';
import { Eye, Skull, LogOut } from 'lucide-react';

interface SpectatorOverlayProps {
  room: BackroomsRoomState;
  localPlayer: BackroomsPlayer;
  onExit: () => void;
}

export const SpectatorOverlay: React.FC<SpectatorOverlayProps> = ({ room, onExit }) => {
  const alivePlayers = Object.values(room.players || {}).filter((p) => p.isAlive);

  return (
    <div className="spectator-overlay-screen">
      <div className="spectator-top-banner">
        <div className="spectator-status-tag">
          <Skull className="icon-sm text-rose" />
          <span>VITAL SIGNS TERMINATED // ETHEREAL SPECTATOR FEED</span>
        </div>
        <button type="button" onClick={onExit} className="btn-exit-expedition">
          <LogOut className="icon-xs" /> RETURN TO LOBBY
        </button>
      </div>

      <div className="spectator-camera-vignette" />

      <div className="spectator-bottom-panel">
        <div className="spectator-panel-title">SURVIVING SQUAD MEMBERS:</div>
        <div className="surviving-players-list">
          {alivePlayers.length > 0 ? (
            alivePlayers.map((p) => (
              <div key={p.id} className="survivor-chip" style={{ borderColor: p.color }}>
                <Eye className="icon-xs" style={{ color: p.color }} />
                <span>{p.name}</span>
                <span className="survivor-health">({p.health}% HP)</span>
              </div>
            ))
          ) : (
            <div className="all-dead-banner">
              ALL SQUAD OPERATIVES ELIMINATED. THE COMPLEX CLAIMS ANOTHER EXPEDITION.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
