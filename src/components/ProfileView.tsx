import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { ACHIEVEMENTS_DATA } from '../data/achievementsData';
import { playerStore } from '../progression/playerStore';
import { audioEngine } from '../audio/audioEngine';
import { 
  Award, 
  Shield, 
  DollarSign, 
  CheckCircle, 
  Lock, 
  Terminal, 
  Edit3 
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const stats = profile.stats;
  const successRate = stats.operationsStarted > 0
    ? Math.round((stats.operationsCompleted / stats.operationsStarted) * 100)
    : 100;

  const handleSaveName = () => {
    if (nameInput.trim()) {
      playerStore.updateName(nameInput);
      setIsEditingName(false);
      audioEngine.playClick();
    }
  };

  const unlockedCount = Object.keys(profile.achievements || {}).length;

  return (
    <div className="profile-view-container">
      {/* Profile Banner */}
      <div className="profile-hero-card">
        <div className="avatar-large-circle">
          <Terminal className="icon-lg text-cyan" />
        </div>

        <div className="hero-identity">
          <div className="name-edit-row">
            {isEditingName ? (
              <div className="name-input-group">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={18}
                  className="name-input"
                  autoFocus
                />
                <button type="button" onClick={handleSaveName} className="btn-save-name">SAVE</button>
              </div>
            ) : (
              <div className="display-name-row">
                <h2>{profile.name}</h2>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="btn-edit-icon"
                  title="Change Callsign"
                >
                  <Edit3 className="icon-xs text-slate" />
                </button>
              </div>
            )}
          </div>

          <div className="hero-title-tag">{profile.title}</div>

          {/* XP Progress Bar */}
          <div className="xp-progress-bar-wrapper">
            <div className="xp-labels">
              <span>LEVEL {profile.level}</span>
              <span>{profile.xp.toLocaleString()} / {profile.nextLevelXp.toLocaleString()} XP</span>
            </div>
            <div className="xp-bar-track">
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.min(100, (profile.xp / profile.nextLevelXp) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hero-stats-quick">
          <div className="quick-stat">
            <DollarSign className="icon-sm text-amber" />
            <div className="val">${profile.credits.toLocaleString()}</div>
            <div className="lbl">DARKNET CREDITS</div>
          </div>
          <div className="quick-stat">
            <Shield className="icon-sm text-cyan" />
            <div className="val">{profile.rep} REP</div>
            <div className="lbl">REPUTATION</div>
          </div>
        </div>
      </div>

      {/* Operational Statistics Grid */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-num text-cyan">{stats.operationsCompleted}</div>
          <div className="stat-label">OPERATIONS COMPLETED</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-emerald">{successRate}%</div>
          <div className="stat-label">SUCCESS RATE</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-purple">{stats.stealthRuns}</div>
          <div className="stat-label">CLEAN STEALTH RUNS</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-rose">{stats.lockdownEscapes}</div>
          <div className="stat-label">LOCKDOWN ESCAPES</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-amber">{stats.nodesBreached}</div>
          <div className="stat-label">TOTAL NODES BREACHED</div>
        </div>
        <div className="stat-card">
          <div className="stat-num text-cyan">{stats.favoriteRole.toUpperCase()}</div>
          <div className="stat-label">PRIMARY SPECIALIZATION</div>
        </div>
      </div>

      {/* Achievements Showcase */}
      <div className="achievements-section">
        <div className="section-header">
          <Award className="icon-sm text-purple" />
          <h3>NETRUNNER ACCOMPLISHMENTS ({unlockedCount} / {ACHIEVEMENTS_DATA.length})</h3>
        </div>

        <div className="achievements-grid">
          {ACHIEVEMENTS_DATA.map((ach) => {
            const isUnlocked = !!profile.achievements[ach.id];

            return (
              <div
                key={ach.id}
                className={`achievement-card ${isUnlocked ? 'ach-unlocked' : 'ach-locked'}`}
              >
                <div className="ach-icon-circle">
                  {isUnlocked ? <CheckCircle className="icon-sm text-emerald" /> : <Lock className="icon-sm text-slate" />}
                </div>

                <div className="ach-details">
                  <h4 className="ach-title">{ach.title}</h4>
                  <p className="ach-desc">{ach.description}</p>
                  <div className="ach-rewards">
                    <span className="reward-credits">+${ach.rewardCredits.toLocaleString()}</span>
                    <span className="reward-xp">+{ach.rewardXp} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
