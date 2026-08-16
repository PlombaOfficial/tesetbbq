import React from 'react';
import { UserProfile } from '../types/game';
import { INTEL_LOGS, IntelLog } from '../data/operationsData';
import { playerStore } from '../progression/playerStore';
import { audioEngine } from '../audio/audioEngine';
import { 
  Unlock, 
  ShieldAlert, 
  Terminal 
} from 'lucide-react';

interface IntelArchiveViewProps {
  profile: UserProfile;
}

export const IntelArchiveView: React.FC<IntelArchiveViewProps> = ({ profile }) => {
  const handleDecrypt = (intel: IntelLog) => {
    audioEngine.playNodeBreach();
    playerStore.unlockIntel(intel.id, intel.bountyCredits);
  };

  return (
    <div className="intel-archive-container">
      <div className="view-header">
        <h2 className="section-title">CONFIDENTIAL INTEL & STORY DOSSIERS</h2>
        <p className="section-subtitle">
          Leaked corporate correspondence, military memos, and encrypted Project Chimera fragments.
        </p>
      </div>

      <div className="intel-grid">
        {INTEL_LOGS.map((intel) => {
          const isUnlocked = profile.unlockedIntel.includes(intel.id);

          return (
            <div
              key={intel.id}
              className={`intel-card ${isUnlocked ? 'intel-decrypted' : 'intel-encrypted'}`}
            >
              {/* Header */}
              <div className="intel-top">
                <div className="intel-classification">
                  <ShieldAlert className="icon-xs" />
                  <span>CLASSIFICATION: {intel.classification.toUpperCase()}</span>
                </div>
                <div className="intel-date">{intel.date}</div>
              </div>

              <h3 className="intel-title">{intel.title}</h3>
              <div className="intel-meta">
                <span>SOURCE: {intel.sourceOrg}</span>
                <span>•</span>
                <span>AUTHOR: {intel.author}</span>
              </div>

              {/* Body */}
              <div className="intel-body-container">
                {isUnlocked ? (
                  <p className="intel-body-text">{intel.body}</p>
                ) : (
                  <div className="encrypted-ciphertext-preview">
                    <span>
                      0x4F9B 0x7E12 [ENCRYPTED_AES256_BLOCK] 0x1A09 0x88FE ... [CLICK DECRYPT TO RECOVER PAYLOAD]
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="intel-footer">
                {isUnlocked ? (
                  <div className="intel-decrypted-status">
                    <Unlock className="icon-xs text-emerald" />
                    <span>DECRYPTED & LOGGED TO ARCHIVES</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDecrypt(intel)}
                    className="btn-decrypt-intel"
                  >
                    <Terminal className="icon-xs" />
                    <span>DECRYPT DOSSIER (+${intel.bountyCredits.toLocaleString()} BOUNTY)</span>
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
