import React, { useState, useEffect } from 'react';
import { Faction } from '../types/pvpClash';
import { clashAudio } from '../game/clash/ClashAudio';
import { Sparkles, Shield, Skull, Dna, ArrowRight } from 'lucide-react';

interface RoleRollModalProps {
  myFaction: Faction;
  opponentName: string;
  onFinished: () => void;
}

export const RoleRollModal: React.FC<RoleRollModalProps> = ({
  myFaction,
  opponentName,
  onFinished
}) => {
  const [animStage, setAnimStage] = useState<'rolling' | 'revealed'>('rolling');
  const [ticker, setTicker] = useState<'PLANTS' | 'ZOMBIES'>('PLANTS');
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    clashAudio.init();

    // Fast roulette flicker for 1.2 seconds
    const interval = window.setInterval(() => {
      setTicker((prev) => (prev === 'PLANTS' ? 'ZOMBIES' : 'PLANTS'));
      clashAudio.playPlantShoot();
    }, 100);

    const revealTimeout = window.setTimeout(() => {
      clearInterval(interval);
      setAnimStage('revealed');
      clashAudio.playVictory();
    }, 1200);

    // 3-second countdown after reveal
    const countTimer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countTimer);
          onFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(revealTimeout);
      clearInterval(countTimer);
    };
  }, [onFinished]);

  const isPlants = (animStage === 'revealed' ? myFaction : ticker) === 'PLANTS';

  return (
    <div className="role-roll-root-backdrop">
      <div className={`role-roll-card ${animStage === 'revealed' ? (myFaction === 'PLANTS' ? 'role-plants-theme' : 'role-zombies-theme') : 'role-rolling-theme'}`}>
        <div className="role-roll-header">
          <Sparkles className="icon-sm text-amber animate-spin" />
          <span>{animStage === 'rolling' ? 'ROLLING MATCH ROLES...' : 'ROLES DETERMINED!'}</span>
        </div>

        <div className="role-emblem-badge-large">
          {isPlants ? (
            <div className="emblem-inner flora-glow">
              <Shield className="icon-xl text-emerald" />
              <h2>FLORA DEFENDERS</h2>
            </div>
          ) : (
            <div className="emblem-inner undead-glow">
              <Skull className="icon-xl text-rose" />
              <h2>NECRO HORDE</h2>
            </div>
          )}
        </div>

        {animStage === 'revealed' ? (
          <div className="role-instructions-wrap animate-fade-in">
            <h3 className="role-assignment-title">
              YOU ARE THE <strong>{myFaction === 'PLANTS' ? '🌱 FLORA COMMANDER' : '🧟 UNDEAD OVERLORD'}</strong>
            </h3>
            <p className="role-objective-desc">
              {myFaction === 'PLANTS'
                ? `Plant defensive roots, harvest solar energy, and defend your core from ${opponentName}!`
                : `Dispatch waves of undead, overwhelm defenses, and breach ${opponentName}'s base!`}
            </p>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  clashAudio.playResourceCollect();
                  onFinished();
                }}
                className="btn-confirm-deck ready-to-deploy"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>CONTINUE TO DECK DRAFT ({countdown}s)</span>
                <ArrowRight className="icon-sm" />
              </button>
            </div>
          </div>
        ) : (
          <div className="role-rolling-spinner-text">
            <Dna className="icon-xs animate-bounce" />
            <span>Randomizing factions for this match...</span>
          </div>
        )}
      </div>
    </div>
  );
};
