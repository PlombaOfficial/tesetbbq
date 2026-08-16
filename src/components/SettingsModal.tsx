import React, { useState } from 'react';
import { Settings, Volume2, X, Eye } from 'lucide-react';
import { spatialAudio } from '../game/engine/SpatialAudio';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [volume, setVolume] = useState(0.7);
  const [fov, setFov] = useState(75);
  const [vhsGrain, setVhsGrain] = useState(true);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    spatialAudio.setVolume(val);
    spatialAudio.playFlashlightClick();
  };

  return (
    <div className="modal-backdrop">
      <div className="settings-modal-card">
        <div className="settings-header">
          <div className="settings-title-block">
            <Settings className="icon-sm text-cyan" />
            <h3>EXPEDITION SYSTEM CONFIGURATION</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal">
            <X className="icon-sm" />
          </button>
        </div>

        <div className="settings-body">
          {/* Audio */}
          <div className="setting-group">
            <label>
              <Volume2 className="icon-xs text-amber" /> MASTER EXPEDITION AUDIO [{Math.round(volume * 100)}%]
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="custom-range"
            />
          </div>

          {/* Field of View */}
          <div className="setting-group">
            <label>
              <Eye className="icon-xs text-cyan" /> FIELD OF VIEW [{fov}°]
            </label>
            <input
              type="range"
              min="65"
              max="105"
              step="5"
              value={fov}
              onChange={(e) => setFov(Number(e.target.value))}
              className="custom-range"
            />
          </div>

          {/* Analog VHS Grain */}
          <div className="toggle-setting-box">
            <div>
              <strong>Found-Footage VHS Camera Filter</strong>
              <p>Simulates analog camcorder phosphor grain and chromatic aberration.</p>
            </div>
            <button
              type="button"
              onClick={() => setVhsGrain(!vhsGrain)}
              className={`btn-toggle-switch ${vhsGrain ? 'switch-on' : 'switch-off'}`}
            >
              {vhsGrain ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        <div className="settings-footer">
          <button type="button" onClick={onClose} className="btn-save-settings">
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
