import React, { useState } from 'react';
import { BACKROOMS_LEVELS } from '../game/engine/LevelsConfig';
import { 
  BookOpen, 
  Layers, 
  Skull, 
  HelpCircle, 
  ShieldAlert, 
  X, 
  Volume2, 
  Eye 
} from 'lucide-react';
import { spatialAudio } from '../game/engine/SpatialAudio';

interface CodexViewProps {
  onClose: () => void;
}

export const CodexView: React.FC<CodexViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'entities' | 'survival'>('levels');
  const [selectedLevelId, setSelectedLevelId] = useState(0);

  const selectedLevel = BACKROOMS_LEVELS[selectedLevelId] || BACKROOMS_LEVELS[0];

  const ENTITIES_DATA = [
    {
      id: 'listener',
      name: 'THE LISTENER (Entity 14)',
      class: 'Threat Class: Lethal (Blind)',
      desc: 'A tall, emaciated humanoid with fungal sensory growths where eyes should be. Completely blind, but has acute acoustic echolocation.',
      behavior: 'Wanders corridors calmly. If a player sprints or slams a door within 25 meters, it emits a guttural roar and charges at full speed toward the noise.',
      countermeasure: 'Crouch and walk slowly. Do not run. If pursued, break line of sight around two consecutive 90-degree corners and remain silent.'
    },
    {
      id: 'mimic',
      name: 'THE SHADOW MIMIC (Entity 29)',
      class: 'Threat Class: Psychological & Mimetic',
      desc: 'An anomalous shapeshifting entity that lurks behind walls and structural partitions.',
      behavior: 'Simulates the voice of disconnected teammates, emits distorted radio chatter over 104.5 MHz, and creates phantom footstep echoes to lure operatives away from the group.',
      countermeasure: 'Verify all teammate locations using the Walkie-Talkie callsign protocol before following distant shadows.'
    },
    {
      id: 'stalker',
      name: 'THE PERIPHERAL STALKER (Entity 3)',
      class: 'Threat Class: Opportunistic',
      desc: 'A dark semi-transparent silhouette that only manifests at the extreme edges of human vision.',
      behavior: 'Silently creeps toward players when their back is turned or when their flashlight is powered off. Freezes in place when illuminated directly.',
      countermeasure: 'Regularly check your 6 o’clock. Keep flashlights charged using backup batteries.'
    },
    {
      id: 'smiler',
      name: 'THE SMILER (Entity 10)',
      class: 'Threat Class: Highly Aggressive in Darkness',
      desc: 'Two glowing luminescent eyes and a razor-sharp crescent grin floating in pitch-black areas.',
      behavior: 'Attracted to light sources, but becomes enraged and aggressive if blinded by direct continuous beam. Charges rapidly in tight spaces.',
      countermeasure: 'Back away slowly without turning around. Do not shine your flashlight directly into its eyes.'
    }
  ];

  return (
    <div className="modal-backdrop">
      <div className="codex-modal-card">
        {/* Header */}
        <div className="codex-header">
          <div className="codex-title-block">
            <BookOpen className="icon-sm text-amber" />
            <h3>M.E.G. ARCHIVAL CODEX // ANOMALY DATABASE</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal">
            <X className="icon-sm" />
          </button>
        </div>

        {/* Nav Tabs */}
        <div className="codex-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('levels')}
            className={`codex-tab ${activeTab === 'levels' ? 'active' : ''}`}
          >
            <Layers className="icon-xs" /> KNOWN LEVELS ({BACKROOMS_LEVELS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('entities')}
            className={`codex-tab ${activeTab === 'entities' ? 'active' : ''}`}
          >
            <Skull className="icon-xs" /> DOCUMENTED ENTITIES (4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('survival')}
            className={`codex-tab ${activeTab === 'survival' ? 'active' : ''}`}
          >
            <HelpCircle className="icon-xs" /> SURVIVAL DIRECTIVES
          </button>
        </div>

        {/* Body Content */}
        <div className="codex-content-body">
          {/* TAB 1: LEVELS */}
          {activeTab === 'levels' && (
            <div className="codex-levels-layout">
              {/* Level List Sidebar */}
              <div className="levels-selector-col">
                {BACKROOMS_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => {
                      spatialAudio.playFlashlightClick();
                      setSelectedLevelId(lvl.id);
                    }}
                    className={`level-tab-btn ${selectedLevelId === lvl.id ? 'active' : ''}`}
                  >
                    <strong>{lvl.title}</strong>
                    <span>{lvl.subtitle}</span>
                  </button>
                ))}
              </div>

              {/* Level Details View */}
              <div className="level-dossier-panel">
                <div className="dossier-tag">{selectedLevel.title} DOSSIER</div>
                <h2>{selectedLevel.subtitle}</h2>
                <div className="dossier-class-pill">{selectedLevel.survivalClass}</div>

                <p className="dossier-body">{selectedLevel.description}</p>

                <div className="dossier-data-grid">
                  <div className="data-box">
                    <span>WALL COMPOSITION:</span>
                    <strong>{selectedLevel.wallTextureType.replace('_', ' ').toUpperCase()}</strong>
                  </div>
                  <div className="data-box">
                    <span>FLOOR COMPOSITION:</span>
                    <strong>{selectedLevel.floorTextureType.replace('_', ' ').toUpperCase()}</strong>
                  </div>
                  <div className="data-box">
                    <span>ACOUSTIC RESONANCE:</span>
                    <strong>{selectedLevel.dronePitch} Hz</strong>
                  </div>
                  <div className="data-box">
                    <span>TRANSITION MECHANISM:</span>
                    <strong>{selectedLevel.exitCondition.replace('_', ' ').toUpperCase()}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENTITIES */}
          {activeTab === 'entities' && (
            <div className="entities-dossier-grid">
              {ENTITIES_DATA.map((ent) => (
                <div key={ent.id} className="entity-card">
                  <div className="entity-card-header">
                    <Skull className="icon-sm text-rose" />
                    <div>
                      <h4>{ent.name}</h4>
                      <span className="entity-threat-tag">{ent.class}</span>
                    </div>
                  </div>

                  <p className="entity-desc">{ent.desc}</p>

                  <div className="entity-behavior-box">
                    <strong>BEHAVIORAL PROFILE:</strong>
                    <p>{ent.behavior}</p>
                  </div>

                  <div className="entity-countermeasure-box">
                    <strong>SURVIVAL COUNTERMEASURE:</strong>
                    <p>{ent.countermeasure}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SURVIVAL DIRECTIVES */}
          {activeTab === 'survival' && (
            <div className="survival-guidelines-list">
              <div className="guide-card">
                <ShieldAlert className="icon-sm text-amber" />
                <div>
                  <strong>RULE 1: MAINTAIN RADIO COMMUNICATON (104.5 MHz)</strong>
                  <p>When separated from your squad, transmit short status updates over the Walkie-Talkie. If you hear static voices calling your real name without using radio squelch protocol, do not respond.</p>
                </div>
              </div>

              <div className="guide-card">
                <Volume2 className="icon-sm text-cyan" />
                <div>
                  <strong>RULE 2: CONSERVE SANITY WITH ALMOND WATER</strong>
                  <p>Extended exposure to uniform yellow wallpapers and darkness will destabilize human cognition. Drink Almond Water [1] when hearing persistent heartbeats or phantom whispers.</p>
                </div>
              </div>

              <div className="guide-card">
                <Eye className="icon-sm text-emerald" />
                <div>
                  <strong>RULE 3: MARK YOUR CORRIDORS WITH CHALK</strong>
                  <p>The Complex shifts when not observed. Use Chalk to draw directional arrows toward the elevator exit room.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
