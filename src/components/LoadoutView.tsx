import React from 'react';
import { UserProfile } from '../types/game';
import { HARDWARE_ITEMS, SOFTWARE_TOOLS } from '../data/arsenalData';
import { playerStore } from '../progression/playerStore';
import { 
  Cpu, 
  Layers, 
  Wifi, 
  Wind, 
  Terminal, 
  Lock, 
  Server
} from 'lucide-react';

interface LoadoutViewProps {
  profile: UserProfile;
}

export const LoadoutView: React.FC<LoadoutViewProps> = ({ profile }) => {
  const currentRig = HARDWARE_ITEMS.find((h) => h.id === profile.equippedRig) || HARDWARE_ITEMS[0];
  const currentCpu = HARDWARE_ITEMS.find((h) => h.id === profile.equippedCpu) || HARDWARE_ITEMS[5];
  const currentRam = HARDWARE_ITEMS.find((h) => h.id === profile.equippedRam) || HARDWARE_ITEMS[8];
  const currentUplink = HARDWARE_ITEMS.find((h) => h.id === profile.equippedUplink) || HARDWARE_ITEMS[11];
  const currentCooling = HARDWARE_ITEMS.find((h) => h.id === profile.equippedCooling) || HARDWARE_ITEMS[14];

  const totalBandwidth = playerStore.calculateTotalBandwidth();
  const usedBandwidth = playerStore.calculateUsedBandwidth();

  const handleToggleTool = (toolId: string) => {
    playerStore.toggleEquipTool(toolId);
  };

  return (
    <div className="loadout-view-container">
      {/* Title Header */}
      <div className="view-header">
        <h2 className="section-title">HARDWARE RIG & SOFTWARE ARSENAL</h2>
        <p className="section-subtitle">
          Configure your cyberdeck components, manage memory bandwidth, and equip mission daemons.
        </p>
      </div>

      {/* Main Grid: Hardware Workbench & Tool Loadout */}
      <div className="loadout-grid">
        {/* Left Column: Rig Chassis & Installed Components */}
        <div className="workbench-column">
          <div className="workbench-card">
            <div className="rig-showcase-header">
              <Server className="icon-md text-cyan" />
              <div>
                <span className="rig-tag">ACTIVE CHASSIS</span>
                <h3>{currentRig.name}</h3>
              </div>
            </div>

            {/* Rig Stats Summary */}
            <div className="rig-stats-meters">
              <div className="stat-meter-item">
                <span className="meter-label">TOOL BANDWIDTH:</span>
                <strong className="meter-val text-cyan">{usedBandwidth} / {totalBandwidth} GB</strong>
                <div className="meter-bar-track">
                  <div 
                    className="meter-bar-fill fill-cyan"
                    style={{ width: `${Math.min(100, (usedBandwidth / totalBandwidth) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="stat-meter-item">
                <span className="meter-label">HACK SPEED BONUS:</span>
                <strong className="meter-val text-emerald">+{currentRig.stats.hackSpeedBonus + currentCpu.stats.hackSpeedBonus}%</strong>
              </div>

              <div className="stat-meter-item">
                <span className="meter-label">STEALTH / TRACE RESIST:</span>
                <strong className="meter-val text-purple">+{currentRig.stats.stealthBonus + currentUplink.stats.stealthBonus}%</strong>
              </div>
            </div>

            {/* Component Slots */}
            <div className="hardware-slots-list">
              {/* CPU Slot */}
              <div className="hardware-slot-row">
                <div className="slot-icon"><Cpu className="icon-sm text-cyan" /></div>
                <div className="slot-info">
                  <span className="slot-name">PROCESSOR (CPU)</span>
                  <strong>{currentCpu.name}</strong>
                </div>
              </div>

              {/* RAM Slot */}
              <div className="hardware-slot-row">
                <div className="slot-icon"><Layers className="icon-sm text-purple" /></div>
                <div className="slot-info">
                  <span className="slot-name">MEMORY BUFFER (RAM)</span>
                  <strong>{currentRam.name}</strong>
                </div>
              </div>

              {/* Uplink Slot */}
              <div className="hardware-slot-row">
                <div className="slot-icon"><Wifi className="icon-sm text-emerald" /></div>
                <div className="slot-info">
                  <span className="slot-name">NETWORK UPLINK</span>
                  <strong>{currentUplink.name}</strong>
                </div>
              </div>

              {/* Cooling Slot */}
              <div className="hardware-slot-row">
                <div className="slot-icon"><Wind className="icon-sm text-amber" /></div>
                <div className="slot-info">
                  <span className="slot-name">THERMAL DISSIPATION</span>
                  <strong>{currentCooling.name}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Owned Software Arsenal */}
        <div className="arsenal-column">
          <div className="column-header">
            <Terminal className="icon-sm text-cyan" />
            <h3>SOFTWARE DAEMON ARSENAL</h3>
            <span className="bandwidth-badge">{usedBandwidth}/{totalBandwidth} GB USED</span>
          </div>

          <div className="tools-deck-grid">
            {SOFTWARE_TOOLS.map((tool) => {
              const isOwned = profile.ownedTools.includes(tool.id);
              const isEquipped = profile.equippedTools.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  className={`tool-card ${isEquipped ? 'tool-equipped' : ''} ${!isOwned ? 'tool-locked' : ''}`}
                >
                  <div className="tool-card-header">
                    <span className="tool-code-badge">{tool.code}</span>
                    <span className="tool-bw-cost">{tool.bandwidthCost} GB BW</span>
                  </div>

                  <h4 className="tool-name">{tool.name}</h4>
                  <p className="tool-desc">{tool.description}</p>
                  <div className="tool-effect">{tool.effectDescription}</div>

                  <div className="tool-card-footer">
                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => handleToggleTool(tool.id)}
                        className={`btn-tool-toggle ${isEquipped ? 'btn-tool-unequip' : 'btn-tool-equip'}`}
                      >
                        {isEquipped ? 'EQUIPPED ✓' : 'EQUIP DAEMON'}
                      </button>
                    ) : (
                      <span className="tool-unowned-badge">
                        <Lock className="icon-xs" /> UNLOCKED ON BLACK MARKET
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
