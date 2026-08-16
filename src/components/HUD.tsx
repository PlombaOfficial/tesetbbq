import React, { useState } from 'react';
import { InventorySlot, BiomeType } from '../types/voxelGame';
import { ITEM_DEFINITIONS } from '../game/voxel/VoxelAtlas';
import { 
  Heart, 
  Utensils, 
  Compass, 
  Sun, 
  Moon, 
  Send, 
  Smartphone,
  Package
} from 'lucide-react';
import { voxelNet } from '../multiplayer/voxelNet';

interface HUDProps {
  health: number; // 0-20
  hunger: number; // 0-20
  hotbar: InventorySlot[];
  selectedSlotIndex: number;
  onSelectSlot: (idx: number) => void;
  miningProgress: number; // 0 to 1
  playerPos: { x: number; y: number; z: number };
  biomeName: BiomeType;
  gameTime: number; // 0-24000
  roomCode: string;
  chatMessages: Array<{ id: string; sender: string; text: string; color: string }>;
  playerName: string;
  playerColor: string;
  isMobileTouch: boolean;
  onToggleMobileTouch: () => void;
  onOpenInventory: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  hunger,
  hotbar,
  selectedSlotIndex,
  onSelectSlot,
  miningProgress,
  playerPos,
  biomeName,
  gameTime,
  roomCode,
  chatMessages,
  playerName,
  playerColor,
  isMobileTouch,
  onToggleMobileTouch,
  onOpenInventory
}) => {
  const [chatInput, setChatInput] = useState('');

  const isDay = gameTime > 0 && gameTime < 13000;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    voxelNet.sendChat(roomCode, playerName, chatInput.trim(), playerColor);
    setChatInput('');
  };

  const heartsCount = Math.ceil(health / 2);
  const hungerCount = Math.ceil(hunger / 2);

  return (
    <div className="voxel-game-hud">
      {/* Top Left: Compass & World Stats */}
      <div className="hud-top-left">
        <div className="hud-stat-badge">
          <Compass className="icon-xs text-amber" />
          <span>XYZ: {Math.floor(playerPos.x)}, {Math.floor(playerPos.y)}, {Math.floor(playerPos.z)}</span>
        </div>
        <div className="hud-stat-badge">
          <span className="biome-tag">{biomeName.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div className="hud-stat-badge">
          {isDay ? <Sun className="icon-xs text-amber" /> : <Moon className="icon-xs text-cyan" />}
          <span>{isDay ? 'DAYLIGHT' : 'NIGHTFALL'}</span>
        </div>
      </div>

      {/* Top Right: Squad Code & Mobile Mode Toggle */}
      <div className="hud-top-right">
        <button 
          type="button" 
          onClick={onOpenInventory}
          className="btn-touch-toggle"
          title="Open Backpack & Crafting"
        >
          <Package className="icon-xs text-amber" />
          <span>INVENTORY [E]</span>
        </button>

        <button 
          type="button" 
          onClick={onToggleMobileTouch} 
          className={`btn-touch-toggle ${isMobileTouch ? 'touch-on' : ''}`}
          title="Toggle Mobile Touch Controls"
        >
          <Smartphone className="icon-xs" />
          <span>{isMobileTouch ? 'MOBILE: ON' : 'TOUCH CONTROLS'}</span>
        </button>

        <div className="hud-room-code">
          REALM: <strong>{roomCode}</strong>
        </div>
      </div>

      {/* Center Reticle & Mining Progress Bar */}
      <div className="hud-center-reticle">
        <div className="reticle-cross" />
        {miningProgress > 0 && (
          <div className="mining-progress-circle">
            <div 
              className="mining-fill-bar" 
              style={{ width: `${Math.min(100, miningProgress * 100)}%` }} 
            />
          </div>
        )}
      </div>

      {/* Bottom Center: Vitals (Health Hearts & Hunger) + Hotbar */}
      <div className="hud-bottom-center">
        {/* Vitals Row */}
        <div className="hud-vitals-row">
          {/* Hearts */}
          <div className="hearts-track">
            {Array.from({ length: 10 }).map((_, i) => (
              <Heart
                key={i}
                className={`heart-icon ${i < heartsCount ? 'heart-full text-rose' : 'heart-empty text-slate'}`}
              />
            ))}
          </div>

          {/* Hunger Meat */}
          <div className="hunger-track">
            {Array.from({ length: 10 }).map((_, i) => (
              <Utensils
                key={i}
                className={`hunger-icon ${i < hungerCount ? 'hunger-full text-amber' : 'hunger-empty text-slate'}`}
              />
            ))}
          </div>
        </div>

        {/* 9-Slot Hotbar */}
        <div className="game-hotbar-container">
          {hotbar.map((slot, idx) => {
            const itemDef = slot.itemId ? ITEM_DEFINITIONS[slot.itemId] : null;
            const isSelected = selectedSlotIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`hotbar-item-slot ${isSelected ? 'slot-active' : ''} ${slot.itemId ? 'has-item' : ''}`}
              >
                <span className="hotbar-key-num">{idx + 1}</span>
                {itemDef && (
                  <>
                    <span className="hotbar-item-label">{itemDef.name.substring(0, 7)}</span>
                    {slot.count > 1 && <span className="hotbar-count-badge">{slot.count}</span>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Left: Chat & Multiplayer Comms */}
      <div className="hud-bottom-left">
        <div className="hud-chat-box">
          <div className="chat-messages-scroll">
            {chatMessages.slice(-5).map((msg) => (
              <div key={msg.id} className="chat-line">
                <span className="chat-sender" style={{ color: msg.color }}>[{msg.sender}]:</span>
                <span className="chat-text">{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="chat-input-row">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Press Enter to chat..."
              className="chat-input-field"
            />
            <button type="submit" className="btn-chat-send">
              <Send className="icon-xxs" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
