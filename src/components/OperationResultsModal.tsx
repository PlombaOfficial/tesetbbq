import React, { useEffect, useState } from 'react';
import { RoomData, Player } from '../types/game';
import { roomManager } from '../multiplayer/roomManager';
import { playerStore } from '../progression/playerStore';
import { audioEngine } from '../audio/audioEngine';
import { 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Award, 
  Shield, 
  ArrowRight, 
  Database, 
  Activity 
} from 'lucide-react';

interface OperationResultsModalProps {
  room: RoomData;
  localPlayer: Player;
}

export const OperationResultsModal: React.FC<OperationResultsModalProps> = ({ room, localPlayer }) => {
  const op = room.operationState;
  const summary = op?.payoutSummary;
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    // Idempotent Payout Claim
    if (op && summary && !hasClaimed) {
      roomManager.claimPayout(room.roomCode, localPlayer.id).then((claimed) => {
        setHasClaimed(true);
        if (claimed) {
          playerStore.recordOperationFinish(
            op.criticalBreached,
            summary.stealthMultiplier > 1.2,
            op.isLockdownActive,
            localPlayer.role
          );
        }
      });
    }
  }, [hasClaimed, localPlayer.id, localPlayer.role, op, room.roomCode, summary]);

  if (!op || !summary) return null;

  const isSuccess = op.criticalBreached;

  const handleReturnToLobby = async () => {
    audioEngine.playClick();
    await roomManager.returnToLobby(room.roomCode);
  };

  return (
    <div className="results-modal-backdrop">
      <div className="results-modal-box">
        {/* Banner Header */}
        <div className={`results-banner ${isSuccess ? 'banner-success' : 'banner-abort'}`}>
          {isSuccess ? <CheckCircle className="icon-lg text-emerald" /> : <AlertTriangle className="icon-lg text-rose" />}
          <div className="banner-titles">
            <h2>{isSuccess ? 'OPERATION ACCOMPLISHED' : 'EMERGENCY EXTRACTION EXECUTED'}</h2>
            <span>{op.targetInfo.organization} // {op.targetInfo.title}</span>
          </div>
        </div>

        {/* Financial & XP Breakdown */}
        <div className="results-grid">
          {/* Credits Box */}
          <div className="result-metric-card">
            <div className="metric-header">
              <DollarSign className="icon-sm text-amber" />
              <span>TOTAL DARKNET PAYOUT</span>
            </div>
            <div className="metric-value text-amber">+${summary.credits.toLocaleString()}</div>
            <div className="metric-detail">
              <span>Data Siphoned: ${op.dataExtracted.toLocaleString()}</span>
              {summary.stealthMultiplier > 1.0 && (
                <span className="text-emerald">Stealth Multiplier: x{summary.stealthMultiplier}</span>
              )}
            </div>
          </div>

          {/* XP & Level Box */}
          <div className="result-metric-card">
            <div className="metric-header">
              <Award className="icon-sm text-purple" />
              <span>NETRUNNER EXPERIENCE</span>
            </div>
            <div className="metric-value text-purple">+{summary.xp} XP</div>
            <div className="metric-detail">
              <span>Hacker Rank: {playerStore.getProfile().title}</span>
            </div>
          </div>

          {/* Reputation Box */}
          <div className="result-metric-card">
            <div className="metric-header">
              <Shield className="icon-sm text-cyan" />
              <span>REPUTATION (REP)</span>
            </div>
            <div className="metric-value text-cyan">+{summary.rep} REP</div>
            <div className="metric-detail">
              <span>Total REP: {playerStore.getProfile().rep}</span>
            </div>
          </div>

          {/* Team Efficiency Box */}
          <div className="result-metric-card">
            <div className="metric-header">
              <Activity className="icon-sm text-emerald" />
              <span>TEAM PERFORMANCE</span>
            </div>
            <div className="metric-value text-emerald">{summary.teamPerformance}%</div>
            <div className="metric-detail">
              <span>Final Trace Level: {Math.round(op.traceLevel)}%</span>
            </div>
          </div>
        </div>

        {/* Extracted Intel Loot */}
        {summary.dataLoot.length > 0 && (
          <div className="extracted-loot-strip">
            <Database className="icon-sm text-cyan" />
            <div className="loot-text">
              <span>CONFIDENTIAL ARCHIVES RECOVERED:</span>
              <strong>{summary.dataLoot.join(', ')}</strong>
            </div>
          </div>
        )}

        {/* Action: Return to Squad Lobby */}
        <div className="results-footer-action">
          <button
            type="button"
            onClick={handleReturnToLobby}
            className="btn-return-lobby"
          >
            <span>RETURN TO SQUAD LOBBY</span>
            <ArrowRight className="icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};
