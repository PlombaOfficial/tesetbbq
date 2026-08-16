import React, { useState } from 'react';
import { OperationTarget, UserProfile } from '../types/game';
import { OPERATIONS_LIST } from '../data/operationsData';
import { audioEngine } from '../audio/audioEngine';
import { 
  Shield, 
  DollarSign, 
  Award, 
  Play, 
  Lock, 
  Layers
} from 'lucide-react';

interface OperationsBoardProps {
  profile: UserProfile;
  onLaunchOperation: (target: OperationTarget) => void;
}

export const OperationsBoard: React.FC<OperationsBoardProps> = ({ profile, onLaunchOperation }) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'small' | 'medium' | 'large' | 'story'>('all');

  const filteredOps = OPERATIONS_LIST.filter((op) => {
    if (filterCategory === 'all') return true;
    return op.category === filterCategory;
  });

  const handleLaunch = (op: OperationTarget) => {
    if (profile.rep < op.requiredRep) {
      audioEngine.playError();
      return;
    }
    audioEngine.playToolActivate();
    onLaunchOperation(op);
  };

  return (
    <div className="operations-board-container">
      {/* Board Header & Filter Chips */}
      <div className="board-header">
        <div className="board-titles">
          <h2 className="section-title">GLOBAL CYBER-TARGET REGISTRY</h2>
          <p className="section-subtitle">
            Intercepted corporate networks, darknet bounties, and classified military nodes.
          </p>
        </div>

        <div className="category-filter-bar">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
          >
            ALL CONTRACTS ({OPERATIONS_LIST.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('small')}
            className={`filter-chip ${filterCategory === 'small' ? 'active' : ''}`}
          >
            NOVICE RELAYS
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('medium')}
            className={`filter-chip ${filterCategory === 'medium' ? 'active' : ''}`}
          >
            ENTERPRISE VAULTS
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('large')}
            className={`filter-chip ${filterCategory === 'large' ? 'active' : ''}`}
          >
            BLACK OPS / MILITARY
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('story')}
            className={`filter-chip filter-story ${filterCategory === 'story' ? 'active' : ''}`}
          >
            ★ CHIMERA STORY ARC
          </button>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="operations-grid">
        {filteredOps.map((op) => {
          const isLocked = profile.rep < op.requiredRep;
          const isStory = op.isStoryMission;

          return (
            <div
              key={op.id}
              className={`op-contract-card ${isLocked ? 'card-locked' : ''} ${isStory ? 'card-story' : ''}`}
            >
              {/* Card Header */}
              <div className="card-top">
                <div className="org-badge">
                  <span>{op.organization}</span>
                  {isStory && <span className="story-badge">STORY CH.{op.storyChapter}</span>}
                </div>
                <div className={`difficulty-badge diff-${op.difficulty}`}>
                  {op.difficulty.toUpperCase()}
                </div>
              </div>

              {/* Title & Lore */}
              <h3 className="op-title">{op.title}</h3>
              <p className="op-description">{op.description}</p>
              <blockquote className="op-lore">"{op.loreSnippet}"</blockquote>

              {/* Stats & Rewards Row */}
              <div className="op-stats-row">
                <div className="op-stat">
                  <DollarSign className="icon-xs text-amber" />
                  <span>${op.baseReward.toLocaleString()}</span>
                </div>
                <div className="op-stat">
                  <Award className="icon-xs text-purple" />
                  <span>+{op.baseXp} XP</span>
                </div>
                <div className="op-stat">
                  <Shield className="icon-xs text-cyan" />
                  <span>+{op.baseRep} REP</span>
                </div>
                <div className="op-stat">
                  <Layers className="icon-xs text-slate" />
                  <span>{op.nodeCount} NODES</span>
                </div>
              </div>

              {/* Security Specs */}
              <div className="security-specs">
                <span className="spec-label">SECURITY ICE:</span>
                <span className="spec-val text-rose">{op.securityType}</span>
              </div>

              {/* Action Button */}
              <div className="card-footer-action">
                {isLocked ? (
                  <div className="locked-requirement">
                    <Lock className="icon-xs text-slate" />
                    <span>REQUIRES {op.requiredRep} REP (CURRENT: {profile.rep})</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLaunch(op)}
                    className={`btn-launch-contract ${isStory ? 'btn-story-launch' : ''}`}
                  >
                    <Play className="icon-xs" />
                    <span>ACCEPT OPERATION</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
