import React, { useState } from 'react';
import { RoomData, Player, PlayerRole, OperationTarget } from '../types/game';
import { roomManager } from '../multiplayer/roomManager';
import { OPERATIONS_LIST } from '../data/operationsData';
import { audioEngine } from '../audio/audioEngine';
import { 
  Users, 
  Copy, 
  Check, 
  Play, 
  CheckCircle, 
  Circle, 
  Send, 
  Shield, 
  Cpu, 
  Search, 
  Zap, 
  LifeBuoy, 
  Terminal,
  Lock
} from 'lucide-react';

interface LobbyViewProps {
  room: RoomData | null;
  localPlayer: Player;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartSolo: (target: OperationTarget) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  localPlayer,
  onCreateRoom,
  onJoinRoom,
  onStartSolo
}) => {
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatText, setChatText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    audioEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?join=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    audioEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (!room) return;
    audioEngine.playClick();
    await roomManager.setPlayerReady(room.roomCode, localPlayer.id, !localPlayer.isReady);
  };

  const handleRoleChange = async (role: PlayerRole) => {
    if (!room) return;
    audioEngine.playClick();
    await roomManager.setPlayerRole(room.roomCode, localPlayer.id, role);
  };

  const handleSelectOp = async (op: OperationTarget) => {
    if (!room || !localPlayer.isHost) return;
    audioEngine.playClick();
    await roomManager.setSelectedOperation(room.roomCode, op);
  };

  const handleLaunchOperation = async () => {
    if (!room || !localPlayer.isHost) return;
    const target = room.selectedOperation || OPERATIONS_LIST[0];
    audioEngine.playToolActivate();
    await roomManager.launchOperation(room.roomCode, target);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !chatText.trim()) return;

    roomManager.sendChatMessage(room.roomCode, {
      id: 'msg_' + Date.now(),
      senderId: localPlayer.id,
      senderName: localPlayer.name,
      senderRole: localPlayer.role,
      text: chatText.trim(),
      timestamp: Date.now(),
      type: 'chat'
    });
    setChatText('');
  };

  // If no room is active, render Matchmaking / Create Screen
  if (!room) {
    return (
      <div className="lobby-selection-screen">
        <div className="lobby-welcome-hero">
          <Terminal className="hero-icon text-cyan" />
          <h1 className="hero-title">MULTIPLAYER CYBER-UPLINK</h1>
          <p className="hero-desc">
            Form a specialized operative team or connect directly to an active squad via encrypted room code.
          </p>
        </div>

        {errorMsg && <div className="lobby-error-banner">{errorMsg}</div>}

        <div className="lobby-cards-grid">
          {/* Card 1: Create Host Room */}
          <div className="lobby-card card-create">
            <div className="card-header">
              <Users className="icon-md text-cyan" />
              <h3>CREATE SQUAD LOBBY</h3>
            </div>
            <p>Initialize a secure tactical room and invite up to 4 friends to join your squad.</p>
            <button
              type="button"
              onClick={onCreateRoom}
              className="btn-primary-action"
            >
              CREATE NEW ROOM
            </button>
          </div>

          {/* Card 2: Join by Code */}
          <div className="lobby-card card-join">
            <div className="card-header">
              <Lock className="icon-md text-amber" />
              <h3>JOIN EXISTING SQUAD</h3>
            </div>
            <p>Enter the 6-character room access code provided by your squad leader.</p>
            <div className="join-input-group">
              <input
                type="text"
                placeholder="ROOM-XXXX"
                value={joinInput}
                maxLength={8}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                className="room-code-input"
              />
              <button
                type="button"
                onClick={() => {
                  if (joinInput.trim()) onJoinRoom(joinInput.trim());
                  else setErrorMsg('Please enter a room code.');
                }}
                className="btn-join-action"
              >
                JOIN
              </button>
            </div>
          </div>

          {/* Card 3: Solo Offline Sandbox */}
          <div className="lobby-card card-solo">
            <div className="card-header">
              <Cpu className="icon-md text-emerald" />
              <h3>SOLO OPERATION SIMULATOR</h3>
            </div>
            <p>Execute local singleplayer operations to test your rigs, decrypt intel, and earn credits.</p>
            <button
              type="button"
              onClick={() => onStartSolo(OPERATIONS_LIST[0])}
              className="btn-secondary-action"
            >
              LAUNCH SOLO TEST
            </button>
          </div>
        </div>
      </div>
    );
  }

  const playersList = Object.values(room.players || {});
  const allReady = playersList.every((p) => p.isReady);
  const currentOp = room.selectedOperation || OPERATIONS_LIST[0];

  const ROLES_INFO: Array<{ id: PlayerRole; name: string; icon: React.ReactNode; perk: string; desc: string }> = [
    {
      id: 'operator',
      name: 'OPERATOR',
      icon: <Terminal className="icon-sm" />,
      perk: '+35% Breach Speed & ICE Penetration',
      desc: 'Frontline hacker specializing in fast dictionary exploits and logic gates.'
    },
    {
      id: 'analyst',
      name: 'ANALYST',
      icon: <Search className="icon-sm" />,
      perk: 'Honeypot Detection & +100% Data Siphon',
      desc: 'Intel specialist who decrypts complex payloads and identifies decoy servers.'
    },
    {
      id: 'engineer',
      name: 'ENGINEER',
      icon: <Cpu className="icon-sm" />,
      perk: '-30% Tool Cooldowns & Overclock Boost',
      desc: 'Hardware guru managing system temperatures, bandwidth, and firewall relays.'
    },
    {
      id: 'recon',
      name: 'RECON',
      icon: <Zap className="icon-sm" />,
      perk: 'Network Mapping & Secondary Vault Finder',
      desc: 'Scout identifying stealth paths, secondary vaults, and security sweep schedules.'
    },
    {
      id: 'support',
      name: 'SUPPORT',
      icon: <LifeBuoy className="icon-sm" />,
      perk: '-25% Trace Buildup & Instant Log Scrub',
      desc: 'Covert protector who masks team signatures, deploys decoys, and wipes syslogs.'
    }
  ];

  return (
    <div className="active-lobby-container">
      {/* Lobby Header with Room Code */}
      <div className="lobby-header-bar">
        <div className="room-title-block">
          <span className="room-status-badge">● SQUAD ASSEMBLED</span>
          <h2>OPERATIONAL ROOM CODE: <strong className="text-cyan">{room.roomCode}</strong></h2>
        </div>

        <div className="room-actions-block">
          <button type="button" onClick={handleCopyCode} className="btn-copy">
            {copied ? <Check className="icon-xs text-emerald" /> : <Copy className="icon-xs" />}
            <span>{copied ? 'COPIED CODE' : 'COPY CODE'}</span>
          </button>
          <button type="button" onClick={handleCopyLink} className="btn-copy">
            <Copy className="icon-xs" />
            <span>SHARE INVITE LINK</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Squad Members + Specialization + Contract Briefing */}
      <div className="lobby-grid">
        {/* Column 1: Squad Members */}
        <div className="lobby-column squad-column">
          <div className="column-header">
            <Users className="icon-sm text-cyan" />
            <h3>SQUAD OPERATIVES ({playersList.length}/5)</h3>
          </div>

          <div className="squad-list">
            {playersList.map((p) => (
              <div key={p.id} className={`squad-card ${p.id === localPlayer.id ? 'is-self' : ''}`}>
                <div className="player-avatar-circle">
                  <Terminal className="icon-sm text-cyan" />
                </div>
                <div className="player-details">
                  <div className="player-name-row">
                    <span className="name">{p.name} {p.id === localPlayer.id && '(YOU)'}</span>
                    {p.isHost && <span className="host-badge">HOST</span>}
                  </div>
                  <div className="player-meta-row">
                    <span>LVL {p.level}</span>
                    <span>•</span>
                    <span className={`role-pill role-${p.role}`}>{p.role.toUpperCase()}</span>
                  </div>
                </div>
                <div className="player-ready-indicator">
                  {p.isReady ? (
                    <span className="ready-badge text-emerald">
                      <CheckCircle className="icon-xs" /> READY
                    </span>
                  ) : (
                    <span className="waiting-badge text-slate">
                      <Circle className="icon-xs" /> PREPARING
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Specialization Picker */}
          <div className="role-picker-section">
            <div className="section-label">CHOOSE YOUR SPECIALIZATION:</div>
            <div className="roles-grid">
              {ROLES_INFO.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleChange(r.id)}
                  className={`role-select-card ${localPlayer.role === r.id ? 'active-role' : ''}`}
                >
                  <div className="role-card-top">
                    {r.icon}
                    <strong>{r.name}</strong>
                  </div>
                  <div className="role-perk">{r.perk}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Contract Selection & Launch */}
        <div className="lobby-column mission-column">
          <div className="column-header">
            <Shield className="icon-sm text-amber" />
            <h3>OPERATION BRIEFING</h3>
          </div>

          {/* Operation Selector for Host */}
          {localPlayer.isHost && (
            <div className="op-selector-box">
              <label>SELECT TARGET CONTRACT:</label>
              <select
                value={currentOp.id}
                onChange={(e) => {
                  const found = OPERATIONS_LIST.find((op) => op.id === e.target.value);
                  if (found) handleSelectOp(found);
                }}
                className="custom-select"
              >
                {OPERATIONS_LIST.map((op) => (
                  <option key={op.id} value={op.id}>
                    [{op.difficulty.toUpperCase()}] {op.organization} - {op.title} (${op.baseReward.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contract Card Details */}
          <div className="briefing-card">
            <div className="briefing-org">{currentOp.organization}</div>
            <h4 className="briefing-title">{currentOp.title}</h4>
            <p className="briefing-desc">{currentOp.description}</p>
            <blockquote className="briefing-lore">{currentOp.loreSnippet}</blockquote>

            <div className="briefing-stats-grid">
              <div className="stat-box">
                <span className="label">SECURITY ICE:</span>
                <strong className="val text-rose">{currentOp.securityType}</strong>
              </div>
              <div className="stat-box">
                <span className="label">DIFFICULTY:</span>
                <strong className="val text-amber">{currentOp.difficulty.toUpperCase()}</strong>
              </div>
              <div className="stat-box">
                <span className="label">BASE REWARD:</span>
                <strong className="val text-emerald">${currentOp.baseReward.toLocaleString()}</strong>
              </div>
              <div className="stat-box">
                <span className="label">EST. NODES:</span>
                <strong className="val text-cyan">{currentOp.nodeCount} NODES</strong>
              </div>
            </div>
          </div>

          {/* Ready & Launch Buttons */}
          <div className="lobby-launch-controls">
            <button
              type="button"
              onClick={handleToggleReady}
              className={`btn-ready ${localPlayer.isReady ? 'btn-ready-active' : ''}`}
            >
              {localPlayer.isReady ? 'CANCEL READY' : 'READY TO INFILTRATE'}
            </button>

            {localPlayer.isHost && (
              <button
                type="button"
                onClick={handleLaunchOperation}
                disabled={!allReady}
                className={`btn-launch ${allReady ? 'btn-launch-ready' : 'btn-launch-disabled'}`}
              >
                <Play className="icon-sm" />
                <span>{allReady ? 'START OPERATION' : 'WAITING FOR ALL OPERATIVES...'}</span>
              </button>
            )}
          </div>

          {/* Lobby Team Chat */}
          <div className="lobby-chat-widget">
            <div className="chat-header">TACTICAL FREQUENCY COMMS</div>
            <div className="chat-feed-box">
              {room.chatMessages.map((m) => (
                <div key={m.id} className={`chat-line ${m.isSystem ? 'line-sys' : ''}`}>
                  <span className="author">[{m.senderName}]:</span>
                  <span className="text">{m.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} className="chat-input-row">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type team broadcast..."
                className="lobby-chat-input"
              />
              <button type="submit" className="lobby-chat-btn">
                <Send className="icon-xs" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
