import React from 'react';
import { UserProfile } from '../types/game';
import { playerStore } from '../progression/playerStore';
import { audioEngine } from '../audio/audioEngine';
import { 
  X, 
  Volume2, 
  Monitor, 
  HelpCircle, 
  Cpu, 
  Terminal, 
  Search, 
  LifeBuoy, 
  Zap 
} from 'lucide-react';

interface SettingsModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ profile, onClose }) => {
  const settings = profile.settings;

  const handleVolumeChange = (type: 'master' | 'sfx' | 'music', val: number) => {
    const next = {
      masterVolume: type === 'master' ? val : settings.masterVolume,
      sfxVolume: type === 'sfx' ? val : settings.sfxVolume,
      musicVolume: type === 'music' ? val : settings.musicVolume
    };
    playerStore.updateSettings(next);
    if (type === 'sfx') audioEngine.playClick();
  };

  const handleToggle = (key: 'crtEffect' | 'screenShake' | 'highContrast') => {
    playerStore.updateSettings({ [key]: !settings[key] });
    audioEngine.playClick();
  };

  return (
    <div className="modal-backdrop">
      <div className="settings-modal-box">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Monitor className="icon-sm text-cyan" />
            <h3>SYSTEM SETTINGS & FIELD MANUAL</h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X className="icon-sm" />
          </button>
        </div>

        {/* Body Tabs / Sections */}
        <div className="modal-body-scroll">
          {/* Audio Section */}
          <div className="settings-section">
            <h4 className="section-subtitle">
              <Volume2 className="icon-xs" /> SOUND & SYNTHESIZER
            </h4>

            <div className="setting-slider-row">
              <label>MASTER VOLUME [{Math.round(settings.masterVolume * 100)}%]</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('master', Number(e.target.value))}
                className="custom-range"
              />
            </div>

            <div className="setting-slider-row">
              <label>SFX / TACTICAL SOUNDS [{Math.round(settings.sfxVolume * 100)}%]</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', Number(e.target.value))}
                className="custom-range"
              />
            </div>

            <div className="setting-slider-row">
              <label>BACKGROUND CYBER AMBIENT [{Math.round(settings.musicVolume * 100)}%]</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('music', Number(e.target.value))}
                className="custom-range"
              />
            </div>
          </div>

          {/* Visual Preferences */}
          <div className="settings-section">
            <h4 className="section-subtitle">
              <Monitor className="icon-xs" /> VISUAL & DISPLAY
            </h4>

            <div className="toggle-setting-row">
              <div>
                <strong>CRT Scanline & Terminal Bloom</strong>
                <p>Simulates vintage cyberdeck phosphorescent phosphor display.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('crtEffect')}
                className={`btn-toggle ${settings.crtEffect ? 'toggle-on' : 'toggle-off'}`}
              >
                {settings.crtEffect ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="toggle-setting-row">
              <div>
                <strong>Tactical Screen Shake</strong>
                <p>Subtle feedback upon security alarms, ICE spikes, and node compromises.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('screenShake')}
                className={`btn-toggle ${settings.screenShake ? 'toggle-on' : 'toggle-off'}`}
              >
                {settings.screenShake ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Field Manual & Specializations */}
          <div className="settings-section">
            <h4 className="section-subtitle">
              <HelpCircle className="icon-xs" /> OPERATIVE FIELD MANUAL
            </h4>

            <div className="manual-cards-list">
              <div className="manual-item">
                <Terminal className="icon-sm text-cyan" />
                <div>
                  <strong>OPERATOR:</strong> Frontline infiltrator. Deals massive breach damage to firewalls and authentication nodes (+35% hack speed).
                </div>
              </div>

              <div className="manual-item">
                <Search className="icon-sm text-amber" />
                <div>
                  <strong>ANALYST:</strong> Identifies deceptive honeypot nodes and doubles extracted database bounties.
                </div>
              </div>

              <div className="manual-item">
                <Cpu className="icon-sm text-emerald" />
                <div>
                  <strong>ENGINEER:</strong> Reduces software daemon cooldowns by 30% and activates team overclock boosts.
                </div>
              </div>

              <div className="manual-item">
                <Zap className="icon-sm text-purple" />
                <div>
                  <strong>RECON:</strong> Spots secondary confidential vaults and monitors security sweep intervals.
                </div>
              </div>

              <div className="manual-item">
                <LifeBuoy className="icon-sm text-rose" />
                <div>
                  <strong>SUPPORT:</strong> Drops decoy nodes, reduces passive trace buildup by 25%, and wipes syslogs.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-modal-close">
            CLOSE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
