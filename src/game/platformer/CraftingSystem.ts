import { CraftingRecipe2D, InventorySlot } from '../../types/platformerGame';
import { ITEM_REGISTRY } from './tileRegistry';

export const CRAFTING_RECIPES_2D: CraftingRecipe2D[] = [
  // --- HAND CRAFTING ---
  {
    id: 'rec_planks',
    resultItemId: 'item_wood_plank',
    resultCount: 4,
    category: 'tiles',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_log', count: 1 }]
  },
  {
    id: 'rec_sticks',
    resultItemId: 'item_stick',
    resultCount: 4,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 2 }]
  },
  {
    id: 'rec_workbench',
    resultItemId: 'item_workbench',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 4 }]
  },
  {
    id: 'rec_platform',
    resultItemId: 'item_platform',
    resultCount: 2,
    category: 'tiles',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 1 }]
  },
  {
    id: 'rec_door',
    resultItemId: 'item_door',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 6 }]
  },
  {
    id: 'rec_ladder',
    resultItemId: 'item_ladder',
    resultCount: 4,
    category: 'tiles',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 3 }]
  },
  {
    id: 'rec_wood_wall',
    resultItemId: 'item_wood_wall',
    resultCount: 4,
    category: 'tiles',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 1 }]
  },
  {
    id: 'rec_torch',
    resultItemId: 'item_torch',
    resultCount: 4,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [
      { itemId: 'item_stick', count: 1 },
      { itemId: 'item_wood_log', count: 1 }
    ]
  },
  {
    id: 'rec_salve',
    resultItemId: 'item_salve',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_herbs', count: 2 }]
  },

  // --- WORKBENCH RECIPES ---
  {
    id: 'rec_wood_pick',
    resultItemId: 'tool_wood_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'rec_wood_axe',
    resultItemId: 'tool_wood_axe',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'rec_wood_sword',
    resultItemId: 'weapon_wood_sword',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 2 },
      { itemId: 'item_stick', count: 1 }
    ]
  },
  {
    id: 'rec_wood_hammer',
    resultItemId: 'tool_wood_hammer',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 4 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'rec_bow',
    resultItemId: 'weapon_bow',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 4 },
      { itemId: 'item_herbs', count: 2 }
    ]
  },
  {
    id: 'rec_arrows',
    resultItemId: 'item_arrow',
    resultCount: 10,
    category: 'weapons',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 1 },
      { itemId: 'item_stone', count: 1 }
    ]
  },
  {
    id: 'rec_stone_pick',
    resultItemId: 'tool_stone_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_stone', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'rec_furnace',
    resultItemId: 'item_furnace',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_stone', count: 8 },
      { itemId: 'item_torch', count: 2 }
    ]
  },
  {
    id: 'rec_anvil',
    resultItemId: 'item_anvil',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'workbench',
    ingredients: [{ itemId: 'item_ingot_ironite', count: 5 }]
  },
  {
    id: 'rec_chest',
    resultItemId: 'item_chest',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'workbench',
    ingredients: [{ itemId: 'item_wood_plank', count: 8 }]
  },
  {
    id: 'rec_campfire',
    resultItemId: 'item_campfire',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_log', count: 5 },
      { itemId: 'item_torch', count: 2 }
    ]
  },
  {
    id: 'rec_brick',
    resultItemId: 'item_brick',
    resultCount: 4,
    category: 'tiles',
    stationRequired: 'workbench',
    ingredients: [{ itemId: 'item_stone', count: 4 }]
  },

  // --- SMELTING FURNACE RECIPES ---
  {
    id: 'rec_smelt_iron',
    resultItemId: 'item_ingot_ironite',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'furnace',
    ingredients: [{ itemId: 'item_raw_ironite', count: 1 }]
  },
  {
    id: 'rec_smelt_cobalt',
    resultItemId: 'item_ingot_cobalt',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'furnace',
    ingredients: [{ itemId: 'item_raw_cobalt', count: 1 }]
  },
  {
    id: 'rec_smelt_glass',
    resultItemId: 'item_glass',
    resultCount: 1,
    category: 'tiles',
    stationRequired: 'furnace',
    ingredients: [{ itemId: 'item_sand', count: 1 }]
  },

  // --- METAL ANVIL RECIPES ---
  {
    id: 'rec_iron_pick',
    resultItemId: 'tool_iron_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_ingot_ironite', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'rec_iron_sword',
    resultItemId: 'weapon_iron_sword',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_ingot_ironite', count: 2 },
      { itemId: 'item_stick', count: 1 }
    ]
  },
  {
    id: 'rec_iron_helm',
    resultItemId: 'armor_iron_helm',
    resultCount: 1,
    category: 'armor',
    stationRequired: 'anvil',
    ingredients: [{ itemId: 'item_ingot_ironite', count: 4 }]
  },
  {
    id: 'rec_iron_chest',
    resultItemId: 'armor_iron_chest',
    resultCount: 1,
    category: 'armor',
    stationRequired: 'anvil',
    ingredients: [{ itemId: 'item_ingot_ironite', count: 8 }]
  },
  {
    id: 'rec_iron_boots',
    resultItemId: 'armor_iron_boots',
    resultCount: 1,
    category: 'armor',
    stationRequired: 'anvil',
    ingredients: [{ itemId: 'item_ingot_ironite', count: 4 }]
  },
  {
    id: 'rec_cobalt_pick',
    resultItemId: 'tool_cobalt_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_ingot_cobalt', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'rec_cobalt_sword',
    resultItemId: 'weapon_cobalt_sword',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_ingot_cobalt', count: 3 },
      { itemId: 'item_stick', count: 1 }
    ]
  },
  {
    id: 'rec_prism_drill',
    resultItemId: 'tool_prism_drill',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_prism_crystal', count: 3 },
      { itemId: 'item_ingot_cobalt', count: 2 }
    ]
  },
  {
    id: 'rec_prism_saber',
    resultItemId: 'weapon_prism_saber',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_prism_crystal', count: 2 },
      { itemId: 'item_void_shard', count: 1 },
      { itemId: 'item_ingot_cobalt', count: 2 }
    ]
  },
  {
    id: 'rec_lamp',
    resultItemId: 'item_lamp',
    resultCount: 1,
    category: 'furniture',
    stationRequired: 'anvil',
    ingredients: [
      { itemId: 'item_prism_crystal', count: 2 },
      { itemId: 'item_torch', count: 1 },
      { itemId: 'item_ingot_ironite', count: 2 }
    ]
  }
];

export class CraftingEngine2D {
  public static canCraft(recipe: CraftingRecipe2D, inventory: InventorySlot[]): boolean {
    for (const req of recipe.ingredients) {
      let countFound = 0;
      for (const slot of inventory) {
        if (slot.itemId === req.itemId) {
          countFound += slot.count;
        }
      }
      if (countFound < req.count) return false;
    }
    return true;
  }

  public static craft(recipe: CraftingRecipe2D, inventory: InventorySlot[]): boolean {
    if (!this.canCraft(recipe, inventory)) return false;

    // Deduct ingredients
    for (const req of recipe.ingredients) {
      let needed = req.count;
      for (const slot of inventory) {
        if (slot.itemId === req.itemId) {
          const take = Math.min(slot.count, needed);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) {
            slot.itemId = null;
            slot.count = 0;
          }
          if (needed <= 0) break;
        }
      }
    }

    // Add result item
    const itemDef = ITEM_REGISTRY[recipe.resultItemId];
    if (!itemDef) return true;

    let remainder = recipe.resultCount;

    // Stack in existing slot
    for (const slot of inventory) {
      if (slot.itemId === recipe.resultItemId && slot.count < itemDef.maxStack) {
        const space = itemDef.maxStack - slot.count;
        const add = Math.min(space, remainder);
        slot.count += add;
        remainder -= add;
        if (remainder <= 0) break;
      }
    }

    // Put in empty slot
    if (remainder > 0) {
      for (const slot of inventory) {
        if (!slot.itemId) {
          slot.itemId = recipe.resultItemId;
          slot.count = remainder;
          remainder = 0;
          break;
        }
      }
    }

    return true;
  }
}
