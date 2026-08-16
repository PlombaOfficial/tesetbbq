import React, { useState } from 'react';
import { InventorySlot, CraftingRecipe } from '../types/voxelGame';
import { ITEM_DEFINITIONS } from '../game/voxel/VoxelAtlas';
import { CRAFTING_RECIPES, CraftingSystem } from '../game/systems/CraftingSystem';
import { 
  Package, 
  Hammer, 
  Shield, 
  X, 
  Layers, 
  Pickaxe, 
  Sword 
} from 'lucide-react';
import { voxelAudio } from '../game/audio/VoxelAudio';

interface InventoryModalProps {
  inventory: InventorySlot[];
  hotbar: InventorySlot[];
  onClose: () => void;
  onUpdateInventory: (inv: InventorySlot[]) => void;
  onUpdateHotbar: (hb: InventorySlot[]) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  hotbar,
  onClose,
  onUpdateInventory,
  onUpdateHotbar
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [craftingCategory, setCraftingCategory] = useState<'all' | 'tools' | 'blocks' | 'weapons' | 'automation'>('all');

  // Combine all items for crafting check
  const allSlots = [...hotbar, ...inventory];

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (craftingCategory === 'all') return true;
    return r.category === craftingCategory;
  });

  const handleCraft = (recipe: CraftingRecipe) => {
    const combined = [...hotbar, ...inventory];
    const success = CraftingSystem.craft(recipe, combined);
    if (success) {
      voxelAudio.playBlockPlace();
      onUpdateHotbar(combined.slice(0, 9));
      onUpdateInventory(combined.slice(9));
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="inventory-modal-card">
        {/* Header Tabs */}
        <div className="inventory-modal-header">
          <div className="inv-tabs-list">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`inv-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            >
              <Package className="icon-xs" /> STORAGE & GEAR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crafting')}
              className={`inv-tab-btn ${activeTab === 'crafting' ? 'active' : ''}`}
            >
              <Hammer className="icon-xs" /> CRAFTING BENCH
            </button>
          </div>
          <button type="button" onClick={onClose} className="btn-close-inv">
            <X className="icon-sm" />
          </button>
        </div>

        {/* Tab 1: Storage & Equipment */}
        {activeTab === 'inventory' && (
          <div className="inventory-grid-body">
            {/* Equipment Slots */}
            <div className="gear-equipment-column">
              <h4>EQUIPMENT</h4>
              <div className="armor-slots-grid">
                <div className="armor-slot"><Shield className="icon-xs text-muted" /> HELMET</div>
                <div className="armor-slot"><Shield className="icon-xs text-muted" /> CHESTPLATE</div>
                <div className="armor-slot"><Shield className="icon-xs text-muted" /> LEGGINGS</div>
                <div className="armor-slot"><Shield className="icon-xs text-muted" /> BOOTS</div>
              </div>
            </div>

            {/* Main 27-slot Storage */}
            <div className="backpack-slots-column">
              <h4>BACKPACK STORAGE</h4>
              <div className="slots-grid-27">
                {inventory.map((slot, idx) => {
                  const itemDef = slot.itemId ? ITEM_DEFINITIONS[slot.itemId] : null;
                  return (
                    <div
                      key={idx}
                      className={`inv-item-slot ${slot.itemId ? 'has-item' : 'empty-slot'}`}
                    >
                      {itemDef && (
                        <>
                          <span className="item-name-tag">{itemDef.name.substring(0, 10)}</span>
                          {slot.count > 1 && <span className="item-stack-count">{slot.count}</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 9-slot Hotbar row */}
              <h4 className="hotbar-title-divider">QUICK HOTBAR (1-9)</h4>
              <div className="hotbar-slots-row">
                {hotbar.map((slot, idx) => {
                  const itemDef = slot.itemId ? ITEM_DEFINITIONS[slot.itemId] : null;
                  return (
                    <div
                      key={idx}
                      className={`inv-item-slot hotbar-slot ${slot.itemId ? 'has-item' : 'empty-slot'}`}
                    >
                      <span className="slot-num-key">[{idx + 1}]</span>
                      {itemDef && (
                        <>
                          <span className="item-name-tag">{itemDef.name.substring(0, 8)}</span>
                          {slot.count > 1 && <span className="item-stack-count">{slot.count}</span>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Crafting Recipes */}
        {activeTab === 'crafting' && (
          <div className="crafting-tab-body">
            {/* Category Filter Chips */}
            <div className="crafting-categories-bar">
              <button 
                type="button" 
                onClick={() => setCraftingCategory('all')} 
                className={`category-chip ${craftingCategory === 'all' ? 'active' : ''}`}
              >
                ALL
              </button>
              <button 
                type="button" 
                onClick={() => setCraftingCategory('tools')} 
                className={`category-chip ${craftingCategory === 'tools' ? 'active' : ''}`}
              >
                <Pickaxe className="icon-xxs" /> TOOLS
              </button>
              <button 
                type="button" 
                onClick={() => setCraftingCategory('weapons')} 
                className={`category-chip ${craftingCategory === 'weapons' ? 'active' : ''}`}
              >
                <Sword className="icon-xxs" /> WEAPONS
              </button>
              <button 
                type="button" 
                onClick={() => setCraftingCategory('blocks')} 
                className={`category-chip ${craftingCategory === 'blocks' ? 'active' : ''}`}
              >
                <Layers className="icon-xxs" /> BLOCKS
              </button>
              <button 
                type="button" 
                onClick={() => setCraftingCategory('automation')} 
                className={`category-chip ${craftingCategory === 'automation' ? 'active' : ''}`}
              >
                <Hammer className="icon-xxs" /> AUTOMATION
              </button>
            </div>

            {/* Recipes Grid */}
            <div className="recipes-grid-list">
              {filteredRecipes.map((recipe) => {
                const resultDef = ITEM_DEFINITIONS[recipe.resultItemId];
                const canMake = CraftingSystem.canCraft(recipe, allSlots);

                return (
                  <div 
                    key={recipe.id} 
                    className={`recipe-card ${canMake ? 'can-craft' : 'cannot-craft'}`}
                  >
                    <div className="recipe-header-row">
                      <strong>{resultDef?.name || recipe.resultItemId}</strong>
                      <span className="recipe-amount">x{recipe.resultCount}</span>
                    </div>

                    <p className="recipe-desc">{resultDef?.description}</p>

                    {/* Ingredients needed */}
                    <div className="ingredients-list">
                      {recipe.ingredients.map((ing) => {
                        const ingDef = ITEM_DEFINITIONS[ing.itemId];
                        return (
                          <span key={ing.itemId} className="ingredient-badge">
                            {ingDef?.name || ing.itemId} x{ing.count}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!canMake}
                      onClick={() => handleCraft(recipe)}
                      className={`btn-craft-action ${canMake ? 'btn-craft-ready' : 'btn-craft-disabled'}`}
                    >
                      {canMake ? 'CRAFT' : 'MISSING MATERIALS'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
