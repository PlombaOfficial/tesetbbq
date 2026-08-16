import React from 'react';
import { Faction } from '../types/pvpClash';
import { clashAudio } from '../game/clash/ClashAudio';
import { 
  Trophy, 
  RotateCcw, 
  LogOut, 
  Swords, 
  Clock, 
  Shield, 
  Skull, 
  Zap,
  Sparkles
} from 'lucide-react';

interface MatchSummaryModalProps {
  winner: Faction;
  myFaction: Faction;
  matchDuration: number;
  onRematch: () => void;
  onExitToMenu: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  winner,
  myFaction,
  matchDuration,
  onRematch,
  onExitToMenu
}) => {
  const isWinner = winner === myFaction;

  return (
    <div className="summary-modal-backdrop">
      <div className={`summary-card-2d ${isWinner ? 'summary-card-victory' : 'summary-card-defeat'}`}>
        {/* Banner Title */}
        <div className="summary-title-badge">
          {isWinner ? (
            <>
              <Trophy className="icon-lg text-amber animate-bounce" />
              <h1>VICTORY!</h1>
              <p className="summary-sub-phrase">
                {myFaction === 'PLANTS' ? 'The Flora Defenses held strong against the horde!' : 'The Necro Horde successfully breached the core!'}
              </p>
            </>
          ) : (
            <>
              <Skull className="icon-lg text-rose" />
              <h1>DEFEAT</h1>
              <p className="summary-sub-phrase">
                {myFaction === 'PLANTS' ? 'Your base core was overwhelmed.' : 'The flora defenses repelled your siege.'}
              </p>
            </>
          )}
        </div>

        {/* Match Statistics Grid */}
        <div className="summary-stats-box">
          <div className="summary-stat-cell">
            <Clock className="icon-xs text-cyan" />
            <span>MATCH TIME</span>
            <strong>{Math.floor(matchDuration / 60)}m {matchDuration % 60}s</strong>
          </div>
          <div className="summary-stat-cell">
            <Swords className="icon-xs text-rose" />
            <span>ROLE PLAYED</span>
            <strong>{myFaction === 'PLANTS' ? '🌱 FLORA' : '🧟 UNDEAD'}</strong>
          </div>
          <div className="summary-stat-cell">
            <Sparkles className="icon-xs text-amber" />
            <span>XP EARNED</span>
            <strong>+{isWinner ? '150' : '65'} XP</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="summary-actions-row">
          <button
            type="button"
            onClick={() => {
              clashAudio.playResourceCollect();
              onRematch();
            }}
            className="btn-rematch-action"
          >
            <RotateCcw className="icon-sm" />
            <div className="btn-label-wrap">
              <strong>REMATCH (INVERT ROLES)</strong>
              <span>Switch factions and play again instantly</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              clashAudio.playPlantShoot();
              onExitToMenu();
            }}
            className="btn-exit-menu-flat"
          >
            <LogOut className="icon-xs" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
