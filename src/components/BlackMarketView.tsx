import React, { useState } from 'react';
import { UserProfile, HardwareItem, SoftwareTool } from '../types/game';
import { HARDWARE_ITEMS, SOFTWARE_TOOLS } from '../data/arsenalData';
import { playerStore } from '../progression/playerStore';
import { 
  DollarSign, 
  Shield, 
  Cpu, 
  Terminal, 
  Check, 
  Server
} from 'lucide-react';

interface BlackMarketViewProps {
  profile: UserProfile;
}

export const BlackMarketView: React.FC<BlackMarketViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'rigs' | 'components' | 'software'>('rigs');

  const handleBuyHardware = (item: HardwareItem) => {
    playerStore.buyHardware(item);
  };

  const handleBuyTool = (tool: SoftwareTool) => {
    playerStore.buyTool(tool);
  };

  const rigs = HARDWARE_ITEMS.filter((h) => h.category === 'rig');
  const components = HARDWARE_ITEMS.filter((h) => h.category !== 'rig');

  return (
    <div className="black-market-container">
      {/* Header Banner */}
      <div className="market-header">
        <div>
          <h2 className="section-title">DARKNET BLACK MARKET</h2>
          <p className="section-subtitle">
            Acquire illicit zero-day exploits, mil-spec cyberdeck chassis, and photonic components.
          </p>
        </div>

        <div className="market-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('rigs')}
            className={`market-tab-btn ${activeTab === 'rigs' ? 'active' : ''}`}
          >
            <Server className="icon-xs" /> RIG CHASSIS ({rigs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`market-tab-btn ${activeTab === 'components' ? 'active' : ''}`}
          >
            <Cpu className="icon-xs" /> COMPONENTS ({components.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('software')}
            className={`market-tab-btn ${activeTab === 'software' ? 'active' : ''}`}
          >
            <Terminal className="icon-xs" /> ZERO-DAYS & TOOLS ({SOFTWARE_TOOLS.length})
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="market-grid">
        {/* Rigs Tab */}
        {activeTab === 'rigs' &&
          rigs.map((rig) => {
            const isOwned = profile.ownedHardware.includes(rig.id);
            const canAfford = profile.credits >= rig.price;
            const meetsRep = profile.rep >= rig.requiredRep;

            return (
              <div key={rig.id} className={`market-item-card ${isOwned ? 'item-owned' : ''}`}>
                <div className="item-tier-badge">TIER {rig.tier} CHASSIS</div>
                <h3 className="item-name">{rig.name}</h3>
                <p className="item-desc">{rig.description}</p>

                <div className="item-specs-box">
                  <div className="spec-row">
                    <span>Tool Bandwidth:</span>
                    <strong className="text-cyan">+{rig.stats.bandwidth} GB</strong>
                  </div>
                  <div className="spec-row">
                    <span>Hack Speed:</span>
                    <strong className="text-emerald">+{rig.stats.hackSpeedBonus}%</strong>
                  </div>
                  <div className="spec-row">
                    <span>Stealth Bonus:</span>
                    <strong className="text-purple">+{rig.stats.stealthBonus}%</strong>
                  </div>
                </div>

                <div className="item-pricing-row">
                  <div className="price-tag">
                    <DollarSign className="icon-xs text-amber" />
                    <span>{rig.price === 0 ? 'FREE' : `$${rig.price.toLocaleString()}`}</span>
                  </div>
                  {rig.requiredRep > 0 && (
                    <div className={`rep-tag ${meetsRep ? 'text-cyan' : 'text-rose'}`}>
                      <Shield className="icon-xs" />
                      <span>{rig.requiredRep} REP REQ</span>
                    </div>
                  )}
                </div>

                <div className="item-action-row">
                  {isOwned ? (
                    <button type="button" disabled className="btn-market-owned">
                      <Check className="icon-xs" /> PURCHASED
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyHardware(rig)}
                      disabled={!canAfford || !meetsRep}
                      className="btn-market-buy"
                    >
                      {!meetsRep ? 'LOCKED BY REP' : !canAfford ? 'INSUFFICIENT FUNDS' : 'PURCHASE CHASSIS'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {/* Components Tab */}
        {activeTab === 'components' &&
          components.map((item) => {
            const isOwned = profile.ownedHardware.includes(item.id);
            const canAfford = profile.credits >= item.price;
            const meetsRep = profile.rep >= item.requiredRep;

            return (
              <div key={item.id} className={`market-item-card ${isOwned ? 'item-owned' : ''}`}>
                <div className="item-tier-badge">{item.category.toUpperCase()} MODULE</div>
                <h3 className="item-name">{item.name}</h3>
                <p className="item-desc">{item.description}</p>

                <div className="item-specs-box">
                  {item.stats.bandwidth > 0 && (
                    <div className="spec-row">
                      <span>Bandwidth Expansion:</span>
                      <strong className="text-cyan">+{item.stats.bandwidth} GB</strong>
                    </div>
                  )}
                  {item.stats.hackSpeedBonus > 0 && (
                    <div className="spec-row">
                      <span>Instruction Clock:</span>
                      <strong className="text-emerald">+{item.stats.hackSpeedBonus}%</strong>
                    </div>
                  )}
                  {item.stats.stealthBonus > 0 && (
                    <div className="spec-row">
                      <span>Noise Dampening:</span>
                      <strong className="text-purple">+{item.stats.stealthBonus}%</strong>
                    </div>
                  )}
                </div>

                <div className="item-pricing-row">
                  <div className="price-tag">
                    <DollarSign className="icon-xs text-amber" />
                    <span>{item.price === 0 ? 'FREE' : `$${item.price.toLocaleString()}`}</span>
                  </div>
                  {item.requiredRep > 0 && (
                    <div className={`rep-tag ${meetsRep ? 'text-cyan' : 'text-rose'}`}>
                      <Shield className="icon-xs" />
                      <span>{item.requiredRep} REP REQ</span>
                    </div>
                  )}
                </div>

                <div className="item-action-row">
                  {isOwned ? (
                    <button type="button" disabled className="btn-market-owned">
                      <Check className="icon-xs" /> INSTALLED
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyHardware(item)}
                      disabled={!canAfford || !meetsRep}
                      className="btn-market-buy"
                    >
                      {!meetsRep ? 'LOCKED BY REP' : !canAfford ? 'INSUFFICIENT FUNDS' : 'BUY COMPONENT'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

        {/* Software Arsenal Tab */}
        {activeTab === 'software' &&
          SOFTWARE_TOOLS.map((tool) => {
            const isOwned = profile.ownedTools.includes(tool.id);
            const canAfford = profile.credits >= tool.price;
            const meetsRep = profile.rep >= tool.requiredRep;

            return (
              <div key={tool.id} className={`market-item-card ${isOwned ? 'item-owned' : ''}`}>
                <div className="item-tier-badge">{tool.code}</div>
                <h3 className="item-name">{tool.name}</h3>
                <p className="item-desc">{tool.description}</p>
                <div className="item-effect-highlight">{tool.effectDescription}</div>

                <div className="item-pricing-row">
                  <div className="price-tag">
                    <DollarSign className="icon-xs text-amber" />
                    <span>${tool.price.toLocaleString()}</span>
                  </div>
                  <div className={`rep-tag ${meetsRep ? 'text-cyan' : 'text-rose'}`}>
                    <Shield className="icon-xs" />
                    <span>{tool.requiredRep} REP REQ</span>
                  </div>
                </div>

                <div className="item-action-row">
                  {isOwned ? (
                    <button type="button" disabled className="btn-market-owned">
                      <Check className="icon-xs" /> LICENSED
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyTool(tool)}
                      disabled={!canAfford || !meetsRep}
                      className="btn-market-buy"
                    >
                      {!meetsRep ? 'LOCKED BY REP' : !canAfford ? 'INSUFFICIENT FUNDS' : 'ACQUIRE EXPLOIT'}
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
