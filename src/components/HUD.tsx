import React, { useState, useEffect } from 'react';
import { LevelDefinition, RadioMessage } from '../types/horrorGame';
import { PlayerInventory } from '../game/systems/PlayerController';
import { 
  Battery, 
  Radio, 
  Activity, 
  Droplet, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { backroomsNet } from '../multiplayer/backroomsNet';
import { spatialAudio } from '../game/engine/SpatialAudio';

interface HUDProps {
  levelDef: LevelDefinition;
  health: number;
  sanity: number;
  battery: number;
  stamina: number;
  inventory: PlayerInventory;
  interactPrompt: string | null;
  radioMessages: RadioMessage[];
  roomCode: string;
  onDrinkAlmond: () => void;
  onReloadBattery: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelDef,
  health,
  sanity,
  battery,
  stamina,
  inventory,
  interactPrompt,
  radioMessages,
  roomCode
}) => {
  const [radioInput, setRadioInput] = useState('');
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [timestamp, setTimestamp] = useState('REC [00:00:00]');

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      setTimestamp(`REC [00:${m}:${s}]`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendRadio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!radioInput.trim()) return;

    spatialAudio.playRadioSquelch(true);
    backroomsNet.broadcastRadio(roomCode, {
      id: 'radio_' + Date.now(),
      senderId: 'ME',
      senderName: 'OPERATIVE',
      senderColor: '#eab308',
      text: radioInput.trim(),
      timestamp: Date.now(),
      frequency: 104.5
    });

    setRadioInput('');
  };

  return (
    <div className="found-footage-hud">
      {/* Top Left: VHS Camera Metadata & Timestamp */}
      <div className="vhs-top-left">
        <div className="vhs-rec-indicator">
          <span className="rec-red-dot" />
          <span className="rec-text">{timestamp}</span>
        </div>
        <div className="vhs-level-tag">
          <strong>{levelDef.title} // {levelDef.subtitle}</strong>
          <span className="survival-class">{levelDef.survivalClass}</span>
        </div>
      </div>

      {/* Top Right: Flashlight Battery & Squad Room Code */}
      <div className="vhs-top-right">
        <div className="battery-indicator">
          <Battery className={`icon-xs ${battery < 25 ? 'text-rose animate-pulse' : 'text-amber'}`} />
          <span>BATT {battery}%</span>
        </div>
        <div className="room-code-badge">
          SQUAD: <strong>{roomCode}</strong>
        </div>
      </div>

      {/* Center Screen: Interactive Crosshair & Prompts */}
      <div className="hud-center-crosshair">
        <div className="crosshair-dot" />
        {interactPrompt && (
          <div className="interact-prompt-card animate-pulse">
            {interactPrompt}
          </div>
        )}
      </div>

      {/* Sanity Distortion Vignette */}
      {sanity < 50 && (
        <div 
          className="sanity-vignette-overlay" 
          style={{ opacity: (50 - sanity) / 50 }} 
        />
      )}

      {/* Bottom Left: Vitals & Stamina */}
      <div className="vhs-bottom-left">
        <div className="vital-bar stamina-bar">
          <div className="vital-label">STAMINA</div>
          <div className="vital-track">
            <div className="vital-fill fill-cyan" style={{ width: `${stamina}%` }} />
          </div>
        </div>

        <div className="vital-bar sanity-bar">
          <div className="vital-label">
            <Activity className="icon-xxs text-purple" /> SANITY
          </div>
          <div className="vital-track">
            <div className="vital-fill fill-purple" style={{ width: `${sanity}%` }} />
          </div>
        </div>

        <div className="vital-bar health-bar">
          <div className="vital-label">VITALS</div>
          <div className="vital-track">
            <div className="vital-fill fill-rose" style={{ width: `${health}%` }} />
          </div>
        </div>
      </div>

      {/* Bottom Center: Quick Item Hotbar */}
      <div className="hud-hotbar">
        <div className={`hotbar-slot ${inventory.almondWaterCount > 0 ? 'slot-ready' : 'slot-empty'}`}>
          <Droplet className="icon-sm text-cyan" />
          <span className="slot-count">x{inventory.almondWaterCount}</span>
          <span className="slot-key">[1] ALMOND WATER</span>
        </div>

        <div className={`hotbar-slot ${inventory.batteryCount > 0 ? 'slot-ready' : 'slot-empty'}`}>
          <Battery className="icon-sm text-amber" />
          <span className="slot-count">x{inventory.batteryCount}</span>
          <span className="slot-key">[2] BATTERIES</span>
        </div>

        <div className={`hotbar-slot ${inventory.flareCount > 0 ? 'slot-ready' : 'slot-empty'}`}>
          <Sparkles className="icon-sm text-rose" />
          <span className="slot-count">x{inventory.flareCount}</span>
          <span className="slot-key">[3] FLARE</span>
        </div>

        <div className="hotbar-slot slot-ready">
          <Radio className="icon-sm text-emerald" />
          <span className="slot-count">104.5 MHz</span>
          <span className="slot-key">[T] RADIO</span>
        </div>
      </div>

      {/* Bottom Right: Walkie-Talkie Radio Feed */}
      <div className="hud-radio-feed-container">
        <div className="radio-feed-header" onClick={() => setIsRadioOpen(!isRadioOpen)}>
          <Radio className="icon-xs text-emerald" />
          <span>WALKIE-TALKIE TRANSCEIVER (104.5 MHz)</span>
        </div>

        <div className="radio-feed-messages">
          {radioMessages.slice(-4).map((msg) => (
            <div key={msg.id} className="radio-message-line">
              <span className="radio-author" style={{ color: msg.senderColor }}>
                [{msg.senderName}]:
              </span>
              <span className="radio-body">{msg.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendRadio} className="radio-input-bar">
          <input
            type="text"
            value={radioInput}
            onChange={(e) => setRadioInput(e.target.value)}
            placeholder="Transmit over walkie-talkie..."
            className="radio-input"
          />
          <button type="submit" className="btn-radio-send">
            <Send className="icon-xxs" />
          </button>
        </form>
      </div>
    </div>
  );
};
