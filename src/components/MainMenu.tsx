import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  Settings, 
  Play, 
  ShieldAlert, 
  KeyRound 
} from 'lucide-react';
import { spatialAudio } from '../game/engine/SpatialAudio';

interface MainMenuProps {
  onStartSolo: () => void;
  onCreateLobby: () => void;
  onJoinLobby: (code: string) => void;
  onOpenCodex: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartSolo,
  onCreateLobby,
  onJoinLobby,
  onOpenCodex,
  onOpenSettings
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleButtonClick = (action: () => void) => {
    spatialAudio.playFlashlightClick();
    action();
  };

  return (
    <div className="main-menu-container">
      {/* Background Ambience & Found Footage Branding */}
      <div className="menu-vhs-scanlines" />

      <div className="menu-content-box">
        {/* Title Header */}
        <div className="title-header-block">
          <div className="m-e-g-tag">
            <ShieldAlert className="icon-xs text-amber" />
            <span>M.E.G. CLASSIFIED EXPEDITION SYSTEM // 1998</span>
          </div>
          <h1 className="horror-main-title">THE COMPLEX</h1>
          <p className="horror-main-subtitle">
            ANOMALOUS NON-EUCLIDEAN MULTIPLAYER EXPEDITION
          </p>
        </div>

        {/* Action Buttons */}
        <div className="menu-buttons-list">
          <button
            type="button"
            onClick={() => handleButtonClick(onCreateLobby)}
            className="btn-horror-menu btn-create-lobby"
          >
            <Users className="icon-sm text-amber" />
            <div className="btn-text-block">
              <strong>CREATE SQUAD EXPEDITION</strong>
              <span>Host multiplayer lobby & generate encrypted room code</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              spatialAudio.playFlashlightClick();
              setShowJoinModal(true);
            }}
            className="btn-horror-menu btn-join-lobby"
          >
            <KeyRound className="icon-sm text-cyan" />
            <div className="btn-text-block">
              <strong>JOIN VIA FREQUENCY CODE</strong>
              <span>Connect to an ongoing squad in the Complex</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleButtonClick(onStartSolo)}
            className="btn-horror-menu btn-solo-run"
          >
            <Play className="icon-sm text-emerald" />
            <div className="btn-text-block">
              <strong>SOLO DESCENT (TRAINING)</strong>
              <span>Enter the Backrooms alone</span>
            </div>
          </button>

          <div className="menu-secondary-row">
            <button
              type="button"
              onClick={() => handleButtonClick(onOpenCodex)}
              className="btn-secondary-menu"
            >
              <BookOpen className="icon-xs" />
              <span>RESEARCH CODEX</span>
            </button>

            <button
              type="button"
              onClick={() => handleButtonClick(onOpenSettings)}
              className="btn-secondary-menu"
            >
              <Settings className="icon-xs" />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>

        {/* Footer Warning */}
        <div className="menu-footer-warning">
          WARNING: IF YOU HEAR SOMETHING WANDERING NEARBY, IT HAS DEFINITELY HEARD YOU.
        </div>
      </div>

      {/* Join Code Modal */}
      {showJoinModal && (
        <div className="modal-backdrop">
          <div className="join-modal-card">
            <h3>ENTER EXPEDITION ROOM CODE</h3>
            <p>Type the 6-character access code provided by your squad leader.</p>

            <input
              type="text"
              placeholder="ROOM-XXXX"
              value={joinCode}
              maxLength={8}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="join-code-input"
              autoFocus
            />

            <div className="join-modal-actions">
              <button
                type="button"
                onClick={() => {
                  if (joinCode.trim()) onJoinLobby(joinCode.trim());
                }}
                className="btn-confirm-join"
              >
                CONNECT
              </button>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="btn-cancel-join"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
