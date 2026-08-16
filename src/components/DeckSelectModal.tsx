import React, { useState } from 'react';
import { Faction } from '../types/pvpClash';
import { PLANT_REGISTRY, ZOMBIE_REGISTRY } from '../game/clash/unitRegistry';
import { clashAudio } from '../game/clash/ClashAudio';
import { Check, Zap, Skull, Shield, Sparkles, Layers, ArrowRight } from 'lucide-react';

interface DeckSelectModalProps {
  faction: Faction;
  onDeckConfirmed: (selectedCardIds: string[]) => void;
}

export const DeckSelectModal: React.FC<DeckSelectModalProps> = ({
  faction,
  onDeckConfirmed
}) => {
  const isPlants = faction === 'PLANTS';

  // Default 8-card loadout
  const [selectedCards, setSelectedCards] = useState<string[]>(() => {
    if (isPlants) {
      return [
        'plant_sunsprout',
        'plant_peablaster',
        'plant_thornnut',
        'plant_frostwillow',
        'plant_spikemoss',
        'plant_cherrybomb',
        'plant_plasmaorchid',
        'plant_chomper'
      ];
    } else {
      return [
        'zomb_walker',
        'zomb_buckethead',
        'zomb_imprunner',
        'zomb_polevault',
        'zomb_miner',
        'zomb_necromancer',
        'zomb_gargantuar',
        'zomb_plaguespitter'
      ];
    }
  });

  const availableCards = isPlants ? Object.values(PLANT_REGISTRY) : Object.values(ZOMBIE_REGISTRY);

  const toggleCard = (cardId: string) => {
    clashAudio.playResourceCollect();
    if (selectedCards.includes(cardId)) {
      if (selectedCards.length > 1) {
        setSelectedCards(selectedCards.filter((id) => id !== cardId));
      }
    } else {
      if (selectedCards.length < 8) {
        setSelectedCards([...selectedCards, cardId]);
      }
    }
  };

  // Presets
  const applyPreset = (presetType: 'rush' | 'siege' | 'balanced') => {
    clashAudio.playPlantShoot();
    if (isPlants) {
      if (presetType === 'rush') {
        setSelectedCards(['plant_sunsprout', 'plant_peablaster', 'plant_spikemoss', 'plant_twincannon', 'plant_gatlingrose', 'plant_cherrybomb', 'plant_prismsun', 'plant_frostwillow']);
      } else if (presetType === 'siege') {
        setSelectedCards(['plant_sunsprout', 'plant_thornnut', 'plant_prismsun', 'plant_plasmaorchid', 'plant_melonpult', 'plant_coccannon', 'plant_aurablossom', 'plant_magnetlily']);
      } else {
        setSelectedCards(['plant_sunsprout', 'plant_peablaster', 'plant_thornnut', 'plant_frostwillow', 'plant_spikemoss', 'plant_cherrybomb', 'plant_plasmaorchid', 'plant_chomper']);
      }
    } else {
      if (presetType === 'rush') {
        setSelectedCards(['zomb_imprunner', 'zomb_polevault', 'zomb_walker', 'zomb_football', 'zomb_balloon', 'zomb_discolich', 'zomb_miner', 'zomb_bungee']);
      } else if (presetType === 'siege') {
        setSelectedCards(['zomb_buckethead', 'zomb_screendoor', 'zomb_gargantuar', 'zomb_catapult', 'zomb_iceroller', 'zomb_mechavatar', 'zomb_necromancer', 'zomb_plaguespitter']);
      } else {
        setSelectedCards(['zomb_walker', 'zomb_buckethead', 'zomb_imprunner', 'zomb_polevault', 'zomb_miner', 'zomb_necromancer', 'zomb_gargantuar', 'zomb_plaguespitter']);
      }
    }
  };

  const isReady = selectedCards.length === 8;

  return (
    <div className="deck-select-root">
      {/* Header Bar */}
      <div className="deck-select-header">
        <div className="faction-title-pill">
          {isPlants ? <Shield className="icon-sm text-emerald" /> : <Skull className="icon-sm text-rose" />}
          <h2>{isPlants ? 'FLORA LOADOUT SELECTION' : 'NECRO HORDE DRAFT'}</h2>
        </div>

        <div className="deck-presets-cluster">
          <span className="preset-label">PRESETS:</span>
          <button type="button" onClick={() => applyPreset('balanced')} className="btn-preset-pill">BALANCED</button>
          <button type="button" onClick={() => applyPreset('rush')} className="btn-preset-pill">FAST RUSH</button>
          <button type="button" onClick={() => applyPreset('siege')} className="btn-preset-pill">HEAVY SIEGE</button>
        </div>

        <div className="deck-counter-badge">
          SLOTS: <strong className={isReady ? 'text-emerald' : 'text-amber'}>{selectedCards.length}/8</strong>
        </div>
      </div>

      {/* 16-Card Catalog Grid */}
      <div className="deck-cards-catalog-grid">
        {availableCards.map((card) => {
          const isSelected = selectedCards.includes(card.id);
          const cost = 'cost' in card ? card.cost : 50;

          return (
            <div
              key={card.id}
              onClick={() => toggleCard(card.id)}
              className={`unit-catalog-card ${isSelected ? 'is-in-deck' : ''}`}
            >
              <div className="card-top-cost-row">
                <span className="unit-cost-tag">
                  {isPlants ? <Zap className="icon-xxs text-amber" /> : <Skull className="icon-xxs text-purple" />}
                  {cost}
                </span>
                {isSelected && <span className="selected-check-badge"><Check className="icon-xxs" /></span>}
              </div>

              <div className="unit-card-artwork" style={{ backgroundColor: card.color }}>
                <span className="unit-card-name-label">{card.name}</span>
              </div>

              <p className="unit-card-desc-text">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Selected 8 Cards Hotbar & Confirm */}
      <div className="deck-select-bottom-bar">
        <div className="selected-cards-row">
          {Array.from({ length: 8 }).map((_, idx) => {
            const cardId = selectedCards[idx];
            const cardDef = isPlants ? (cardId ? PLANT_REGISTRY[cardId] : null) : (cardId ? ZOMBIE_REGISTRY[cardId] : null);

            return (
              <div
                key={idx}
                className={`selected-hotbar-slot ${cardDef ? 'has-card' : 'is-empty'}`}
                onClick={() => cardId && toggleCard(cardId)}
              >
                {cardDef ? (
                  <>
                    <span className="slot-cost-num">{cardDef.cost}</span>
                    <span className="slot-name-label">{cardDef.name.substring(0, 9)}</span>
                  </>
                ) : (
                  <span className="empty-slot-idx">#{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!isReady}
          onClick={() => isReady && onDeckConfirmed(selectedCards)}
          className={`btn-confirm-deck ${isReady ? 'ready-to-deploy' : 'disabled-deck'}`}
        >
          <span>{isReady ? 'DEPLOY TO BATTLEFIELD' : 'SELECT 8 CARDS'}</span>
          <ArrowRight className="icon-sm" />
        </button>
      </div>
    </div>
  );
};
