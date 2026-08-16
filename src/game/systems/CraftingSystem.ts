import { CraftingRecipe, InventorySlot } from '../../types/voxelGame';
import { ITEM_DEFINITIONS } from '../voxel/VoxelAtlas';

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // --- HAND CRAFTING ---
  {
    id: 'recipe_planks',
    resultItemId: 'item_wood_plank',
    resultCount: 4,
    category: 'blocks',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_log', count: 1 }]
  },
  {
    id: 'recipe_redwood_planks',
    resultItemId: 'item_redwood_plank',
    resultCount: 4,
    category: 'blocks',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_redwood_log', count: 1 }]
  },
  {
    id: 'recipe_sticks',
    resultItemId: 'item_stick',
    resultCount: 4,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 2 }]
  },
  {
    id: 'recipe_workbench',
    resultItemId: 'item_workbench',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wood_plank', count: 4 }]
  },
  {
    id: 'recipe_bread',
    resultItemId: 'item_bread',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [{ itemId: 'item_wheat', count: 3 }]
  },
  {
    id: 'recipe_torch',
    resultItemId: 'item_torch',
    resultCount: 4,
    category: 'survival',
    stationRequired: 'hand',
    ingredients: [
      { itemId: 'item_stick', count: 1 },
      { itemId: 'item_wood_log', count: 1 }
    ]
  },

  // --- WORKBENCH TIER: TOOLS ---
  {
    id: 'recipe_wood_pick',
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
    id: 'recipe_wood_axe',
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
    id: 'recipe_wood_shovel',
    resultItemId: 'tool_wood_shovel',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_wood_plank', count: 1 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'recipe_wood_sword',
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
    id: 'recipe_stone_pick',
    resultItemId: 'tool_stone_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_cobble', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },

  // --- WORKBENCH TIER: STATIONS & STORAGE ---
  {
    id: 'recipe_forge',
    resultItemId: 'item_forge',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'workbench',
    ingredients: [{ itemId: 'item_cobble', count: 8 }]
  },
  {
    id: 'recipe_crate',
    resultItemId: 'item_crate',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'workbench',
    ingredients: [{ itemId: 'item_wood_plank', count: 8 }]
  },
  {
    id: 'recipe_brick',
    resultItemId: 'item_brick',
    resultCount: 4,
    category: 'blocks',
    stationRequired: 'workbench',
    ingredients: [{ itemId: 'item_cobble', count: 4 }]
  },

  // --- METALLURGY TIER: IRONITE & COBALT ---
  {
    id: 'recipe_iron_pick',
    resultItemId: 'tool_iron_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_ingot_ironite', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'recipe_iron_sword',
    resultItemId: 'weapon_iron_sword',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_ingot_ironite', count: 2 },
      { itemId: 'item_stick', count: 1 }
    ]
  },
  {
    id: 'recipe_cobalt_pick',
    resultItemId: 'tool_cobalt_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_ingot_cobalt', count: 3 },
      { itemId: 'item_stick', count: 2 }
    ]
  },
  {
    id: 'recipe_cobalt_sword',
    resultItemId: 'weapon_cobalt_sword',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_ingot_cobalt', count: 2 },
      { itemId: 'item_stick', count: 1 }
    ]
  },

  // --- AUTOMATION & HIGH TECH ---
  {
    id: 'recipe_conveyor',
    resultItemId: 'item_conveyor',
    resultCount: 4,
    category: 'automation',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_ingot_ironite', count: 2 },
      { itemId: 'item_wood_plank', count: 4 }
    ]
  },
  {
    id: 'recipe_harvester',
    resultItemId: 'item_harvester',
    resultCount: 1,
    category: 'automation',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_ingot_ironite', count: 4 },
      { itemId: 'item_radiant_core', count: 1 },
      { itemId: 'item_wood_plank', count: 2 }
    ]
  },
  {
    id: 'recipe_radiant_core',
    resultItemId: 'item_radiant_core',
    resultCount: 1,
    category: 'blocks',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_prism_crystal', count: 4 },
      { itemId: 'item_torch', count: 1 }
    ]
  },

  // --- ENDGAME PRISM TIER ---
  {
    id: 'recipe_prism_drill',
    resultItemId: 'tool_prism_pick',
    resultCount: 1,
    category: 'tools',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_prism_crystal', count: 3 },
      { itemId: 'item_ingot_cobalt', count: 2 }
    ]
  },
  {
    id: 'recipe_prism_saber',
    resultItemId: 'weapon_prism_saber',
    resultCount: 1,
    category: 'weapons',
    stationRequired: 'workbench',
    ingredients: [
      { itemId: 'item_prism_crystal', count: 2 },
      { itemId: 'item_void_shard', count: 1 },
      { itemId: 'item_ingot_cobalt', count: 1 }
    ]
  },

  // --- SMELTING FORGE RECIPES ---
  {
    id: 'recipe_smelt_iron',
    resultItemId: 'item_ingot_ironite',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'forge',
    ingredients: [{ itemId: 'item_raw_ironite', count: 1 }]
  },
  {
    id: 'recipe_smelt_cobalt',
    resultItemId: 'item_ingot_cobalt',
    resultCount: 1,
    category: 'survival',
    stationRequired: 'forge',
    ingredients: [{ itemId: 'item_raw_cobalt', count: 1 }]
  },
  {
    id: 'recipe_smelt_glass',
    resultItemId: 'item_glass',
    resultCount: 1,
    category: 'blocks',
    stationRequired: 'forge',
    ingredients: [{ itemId: 'item_sand', count: 1 }]
  }
];

export class CraftingSystem {
  // Check if player has required ingredients in inventory
  public static canCraft(recipe: CraftingRecipe, inventory: InventorySlot[]): boolean {
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

  // Execute crafting transaction
  public static craft(
    recipe: CraftingRecipe, 
    inventory: InventorySlot[]
  ): boolean {
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

    // Add crafted result to inventory
    const itemDef = ITEM_DEFINITIONS[recipe.resultItemId];
    if (!itemDef) return true;

    let remainder = recipe.resultCount;

    // First try stacking into existing slots
    for (const slot of inventory) {
      if (slot.itemId === recipe.resultItemId && slot.count < itemDef.maxStack) {
        const space = itemDef.maxStack - slot.count;
        const add = Math.min(space, remainder);
        slot.count += add;
        remainder -= add;
        if (remainder <= 0) break;
      }
    }

    // Then put in empty slots
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
