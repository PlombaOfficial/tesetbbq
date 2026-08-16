import React from 'react';
import { UserProfile, RoomData } from '../types/game';
import { audioEngine } from '../audio/audioEngine';
import { 
  Terminal, 
  DollarSign, 
  Award, 
  Shield, 
  Settings, 
  LogOut, 
  Users, 
  Wifi, 
  ShoppingBag, 
  Layers, 
  FileText, 
  UserCheck 
} from 'lucide-react';

interface NavbarProps {
  profile: UserProfile;
  activeRoom: RoomData | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeRoom,
  activeView,
  onNavigate,
  onOpenSettings,
  onLeaveRoom
}) => {
  const handleNav = (v: string) => {
    audioEngine.playClick();
    onNavigate(v);
  };

  return (
    <header className="main-navbar">
      <div className="navbar-brand-col">
        <div className="brand-logo" onClick={() => handleNav('operations')}>
          <Terminal className="brand-icon" />
          <div className="brand-titles">
            <span className="brand-name">CYBERNET<span className="text-cyan">:OPS</span></span>
            <span className="brand-subtitle">NEURAL BREACH // v2.4</span>
          </div>
        </div>

        {activeRoom && (
          <div className="active-room-indicator">
            <span className="ping-dot" />
            <span className="room-code-tag">ROOM [{activeRoom.roomCode}]</span>
          </div>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className="navbar-links">
        <button
          type="button"
          onClick={() => handleNav('operations')}
          className={`nav-btn ${activeView === 'operations' ? 'active' : ''}`}
        >
          <Wifi className="icon-xs" />
          <span>OPERATIONS</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('lobby')}
          className={`nav-btn ${activeView === 'lobby' ? 'active' : ''}`}
        >
          <Users className="icon-xs" />
          <span>TEAM LOBBY</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('loadout')}
          className={`nav-btn ${activeView === 'loadout' ? 'active' : ''}`}
        >
          <Layers className="icon-xs" />
          <span>RIG & ARSENAL</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('market')}
          className={`nav-btn ${activeView === 'market' ? 'active' : ''}`}
        >
          <ShoppingBag className="icon-xs" />
          <span>BLACK MARKET</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('intel')}
          className={`nav-btn ${activeView === 'intel' ? 'active' : ''}`}
        >
          <FileText className="icon-xs" />
          <span>INTEL LOGS</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('profile')}
          className={`nav-btn ${activeView === 'profile' ? 'active' : ''}`}
        >
          <UserCheck className="icon-xs" />
          <span>PROFILE</span>
        </button>
      </nav>

      {/* Player Stats & Actions */}
      <div className="navbar-stats-col">
        <div className="stat-pill credits-pill" title="Darknet Credits">
          <DollarSign className="icon-xs text-amber" />
          <span>{profile.credits.toLocaleString()}</span>
        </div>

        <div className="stat-pill rep-pill" title="Hacker Reputation (REP)">
          <Shield className="icon-xs text-cyan" />
          <span>{profile.rep} REP</span>
        </div>

        <div className="stat-pill level-pill" title={`Level ${profile.level} (${profile.xp} XP)`}>
          <Award className="icon-xs text-purple" />
          <span>LVL {profile.level}</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="icon-btn"
          title="Audio & Game Settings"
        >
          <Settings className="icon-sm" />
        </button>

        {activeRoom && (
          <button
            type="button"
            onClick={onLeaveRoom}
            className="icon-btn btn-leave"
            title="Leave Uplink / Lobby"
          >
            <LogOut className="icon-sm text-rose" />
          </button>
        )}
      </div>
    </header>
  );
};
