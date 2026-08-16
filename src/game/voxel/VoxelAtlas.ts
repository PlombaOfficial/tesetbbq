import * as THREE from 'three';
import { BlockDef, ItemDef } from '../../types/voxelGame';

export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 8;
export const TILE_SIZE = 64;

export class VoxelAtlas {
  private static canvasTexture: THREE.CanvasTexture | null = null;

  public static getTexture(): THREE.CanvasTexture {
    if (this.canvasTexture) return this.canvasTexture;

    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_COLS * TILE_SIZE;
    canvas.height = ATLAS_ROWS * TILE_SIZE;
    const ctx = canvas.getContext('2d')!;

    // Background filler
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 0: Aether Grass Top
    this.drawGrassTop(ctx, 0, 0);
    // 1: Mossy Dirt / Loam
    this.drawDirt(ctx, 1, 0);
    // 2: Aether Grass Side (Grass overhang on Loam)
    this.drawGrassSide(ctx, 2, 0);
    // 3: Granite Stone
    this.drawStone(ctx, 3, 0);
    // 4: Sunwood Log Side (Bark)
    this.drawWoodBark(ctx, 4, 0);
    // 5: Sunwood Log Top (Rings)
    this.drawWoodTop(ctx, 5, 0);
    // 6: Sunwood Planks
    this.drawPlanks(ctx, 6, 0);
    // 7: Emerald Leaves
    this.drawLeaves(ctx, 7, 0);

    // Row 1:
    // 8: Scorched Sand
    this.drawSand(ctx, 0, 1);
    // 9: Sandstone
    this.drawSandstone(ctx, 1, 1);
    // 10: Frosted Snow
    this.drawSnow(ctx, 2, 1);
    // 11: Glacial Ice
    this.drawIce(ctx, 3, 1);
    // 12: Clay
    this.drawClay(ctx, 4, 1);
    // 13: Ironite Ore
    this.drawOre(ctx, 5, 1, '#d97706'); // Copper/Iron orange flecks
    // 14: Cobalt Ore
    this.drawOre(ctx, 6, 1, '#06b6d4'); // Blue flecks
    // 15: Prism Crystal Ore
    this.drawOre(ctx, 7, 1, '#ec4899'); // Pink crystal flecks

    // Row 2:
    // 16: Voidstone
    this.drawVoidstone(ctx, 0, 2);
    // 17: Radiant Core (Glow Block)
    this.drawRadiantCore(ctx, 1, 2);
    // 18: Reinforced Brick
    this.drawBrick(ctx, 2, 2);
    // 19: Obsidian Slab
    this.drawObsidian(ctx, 3, 2);
    // 20: Crystal Glass
    this.drawGlass(ctx, 4, 2);
    // 21: Kinetic Conveyor
    this.drawConveyor(ctx, 5, 2);
    // 22: Automated Harvester
    this.drawHarvester(ctx, 6, 2);
    // 23: Crafting Workbench Top
    this.drawWorkbenchTop(ctx, 7, 2);

    // Row 3:
    // 24: Crafting Workbench Side
    this.drawWorkbenchSide(ctx, 0, 3);
    // 25: Smelting Forge
    this.drawForge(ctx, 1, 3);
    // 26: Storage Crate
    this.drawCrate(ctx, 2, 3);
    // 27: Aetherium Water
    this.drawWater(ctx, 3, 3);
    // 28: Magma Flux
    this.drawMagma(ctx, 4, 3);
    // 29: Wild Crop Stage
    this.drawCrop(ctx, 5, 3);
    // 30: Torch
    this.drawTorch(ctx, 6, 3);
    // 31: Redwood Bark
    this.drawRedwoodBark(ctx, 7, 3);

    // Row 4:
    // 32: Redwood Planks
    this.drawRedwoodPlanks(ctx, 0, 4);
    // 33: Bioluminescent Moss
    this.drawBioMoss(ctx, 1, 4);
    // 34: Astral Monolith Stone
    this.drawMonolith(ctx, 2, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    this.canvasTexture = texture;
    return texture;
  }

  // --- DRAW HELPERS ---
  private static drawGrassTop(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#22c55e', '#16a34a', 60);
  }

  private static drawDirt(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#592506', '#92400e', 80);
  }

  private static drawGrassSide(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#592506', '#92400e', 60);
    // Overhanging grass rim
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x, y, TILE_SIZE, 16);
    // Dripping blades
    for (let px = 0; px < TILE_SIZE; px += 8) {
      const drop = (px % 16 === 0) ? 24 : 18;
      ctx.fillRect(x + px, y + 16, 8, drop - 16);
    }
  }

  private static drawStone(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#475569', '#94a3b8', 90);
  }

  private static drawWoodBark(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    for (let px = 0; px < TILE_SIZE; px += 8) {
      ctx.fillStyle = px % 16 === 0 ? '#713f12' : '#a16207';
      ctx.fillRect(x + px, y, 8, TILE_SIZE);
    }
  }

  private static drawWoodTop(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 32, y + 32, 12, 0, Math.PI * 2);
    ctx.arc(x + 32, y + 32, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  private static drawPlanks(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    for (let py = 0; py < TILE_SIZE; py += 16) {
      ctx.strokeRect(x, y + py, TILE_SIZE, 16);
    }
  }

  private static drawLeaves(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#16a34a', '#14532d', 110);
  }

  private static drawSand(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#eab308', '#fef08a', 70);
  }

  private static drawSandstone(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(x, y + 16, TILE_SIZE, 8);
    ctx.fillRect(x, y + 40, TILE_SIZE, 8);
  }

  private static drawSnow(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#e2e8f0', '#ffffff', 50);
  }

  private static drawIce(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 8); ctx.lineTo(x + 32, y + 48); ctx.lineTo(x + 56, y + 20);
    ctx.stroke();
  }

  private static drawClay(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  private static drawOre(ctx: CanvasRenderingContext2D, col: number, row: number, fleckColor: string) {
    this.drawStone(ctx, col, row);
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = fleckColor;
    for (let i = 0; i < 7; i++) {
      const fx = x + 10 + (i * 19) % 44;
      const fy = y + 10 + (i * 27) % 44;
      ctx.fillRect(fx, fy, 8, 8);
    }
  }

  private static drawVoidstone(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#0f172a', '#4338ca', 80);
  }

  private static drawRadiantCore(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 16, y + 16, 32, 32);
  }

  private static drawBrick(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    for (let py = 0; py < TILE_SIZE; py += 16) {
      ctx.strokeRect(x, y + py, TILE_SIZE, 16);
    }
  }

  private static drawObsidian(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#581c87', '#18181b', 60);
  }

  private static drawGlass(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  }

  private static drawConveyor(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#06b6d4';
    // Moving chevron arrows
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 12); ctx.lineTo(x + 32, y + 28); ctx.lineTo(x + 48, y + 12);
    ctx.moveTo(x + 16, y + 36); ctx.lineTo(x + 32, y + 52); ctx.lineTo(x + 48, y + 36);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  private static drawHarvester(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x + 32, y + 32, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawWorkbenchTop(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
    // Saw & hammer icon
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 20, y + 20, 24, 6);
  }

  private static drawWorkbenchSide(ctx: CanvasRenderingContext2D, col: number, row: number) {
    this.drawPlanks(ctx, col, row);
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 10, y + 20, 16, 28); // Hanging tool pouch
  }

  private static drawForge(ctx: CanvasRenderingContext2D, col: number, row: number) {
    this.drawStone(ctx, col, row);
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    // Fiery opening
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 14, y + 22, 36, 28);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 20, y + 28, 24, 16);
  }

  private static drawCrate(ctx: CanvasRenderingContext2D, col: number, row: number) {
    this.drawPlanks(ctx, col, row);
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 28, y + 28, 8, 8); // Lock latch
  }

  private static drawWater(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#38bdf8', '#0369a1', 50);
  }

  private static drawMagma(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#f97316', '#facc15', 70);
  }

  private static drawCrop(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Green stalks
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(x + 14, y + 16, 6, 36);
    ctx.fillRect(x + 30, y + 8, 6, 44);
    ctx.fillRect(x + 46, y + 22, 6, 30);
  }

  private static drawTorch(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Torch stick
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 28, y + 24, 8, 28);
    // Flame
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 26, y + 10, 12, 14);
  }

  private static drawRedwoodBark(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#450a0a', '#991b1b', 70);
  }

  private static drawRedwoodPlanks(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    for (let py = 0; py < TILE_SIZE; py += 16) {
      ctx.strokeRect(x, y + py, TILE_SIZE, 16);
    }
  }

  private static drawBioMoss(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#065f46';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    this.addPixelNoise(ctx, x, y, '#10b981', '#34d399', 90);
  }

  private static drawMonolith(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const x = col * TILE_SIZE, y = row * TILE_SIZE;
    ctx.fillStyle = '#312e81';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 10, y + 10, 44, 44);
  }

  private static addPixelNoise(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    c1: string, 
    c2: string, 
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = i % 2 === 0 ? c1 : c2;
      const px = x + Math.floor(Math.random() * 8) * 8;
      const py = y + Math.floor(Math.random() * 8) * 8;
      ctx.fillRect(px, py, 8, 8);
    }
  }
}

// Block definitions catalog
export const BLOCK_DEFINITIONS: Record<number, BlockDef> = {
  1: {
    id: 1,
    name: 'Aether Grass',
    hardness: 0.6,
    bestTool: 'shovel',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_dirt',
    dropCount: 1,
    textureIndices: { top: 0, bottom: 1, side: 2 }
  },
  2: {
    id: 2,
    name: 'Mossy Loam',
    hardness: 0.5,
    bestTool: 'shovel',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_dirt',
    dropCount: 1,
    textureIndices: { top: 1, bottom: 1, side: 1 }
  },
  3: {
    id: 3,
    name: 'Granite Stone',
    hardness: 1.5,
    bestTool: 'pickaxe',
    minToolTier: 1,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_cobble',
    dropCount: 1,
    textureIndices: { top: 3, bottom: 3, side: 3 }
  },
  4: {
    id: 4,
    name: 'Sunwood Log',
    hardness: 1.2,
    bestTool: 'axe',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_wood_log',
    dropCount: 1,
    textureIndices: { top: 5, bottom: 5, side: 4 }
  },
  5: {
    id: 5,
    name: 'Sunwood Planks',
    hardness: 0.9,
    bestTool: 'axe',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_wood_plank',
    dropCount: 1,
    textureIndices: { top: 6, bottom: 6, side: 6 }
  },
  6: {
    id: 6,
    name: 'Emerald Leaves',
    hardness: 0.2,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: true,
    isTransparent: true,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_sapling',
    dropCount: 1,
    textureIndices: { top: 7, bottom: 7, side: 7 }
  },
  7: {
    id: 7,
    name: 'Scorched Sand',
    hardness: 0.5,
    bestTool: 'shovel',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_sand',
    dropCount: 1,
    textureIndices: { top: 8, bottom: 8, side: 8 }
  },
  8: {
    id: 8,
    name: 'Sandstone',
    hardness: 1.2,
    bestTool: 'pickaxe',
    minToolTier: 1,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_sandstone',
    dropCount: 1,
    textureIndices: { top: 9, bottom: 9, side: 9 }
  },
  9: {
    id: 9,
    name: 'Frosted Snow',
    hardness: 0.3,
    bestTool: 'shovel',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_snowball',
    dropCount: 4,
    textureIndices: { top: 10, bottom: 10, side: 10 }
  },
  10: {
    id: 10,
    name: 'Glacial Ice',
    hardness: 0.8,
    bestTool: 'pickaxe',
    minToolTier: 1,
    isSolid: true,
    isTransparent: true,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_ice',
    dropCount: 1,
    textureIndices: { top: 11, bottom: 11, side: 11 }
  },
  12: {
    id: 12,
    name: 'Ironite Ore',
    hardness: 2.2,
    bestTool: 'pickaxe',
    minToolTier: 2,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_raw_ironite',
    dropCount: 1,
    textureIndices: { top: 13, bottom: 13, side: 13 }
  },
  13: {
    id: 13,
    name: 'Cobalt Ore',
    hardness: 3.0,
    bestTool: 'pickaxe',
    minToolTier: 3,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_raw_cobalt',
    dropCount: 1,
    textureIndices: { top: 14, bottom: 14, side: 14 }
  },
  14: {
    id: 14,
    name: 'Prism Crystal',
    hardness: 3.5,
    bestTool: 'pickaxe',
    minToolTier: 3,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 8,
    dropItem: 'item_prism_crystal',
    dropCount: 2,
    textureIndices: { top: 15, bottom: 15, side: 15 }
  },
  15: {
    id: 15,
    name: 'Voidstone Ore',
    hardness: 4.5,
    bestTool: 'pickaxe',
    minToolTier: 4,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_void_shard',
    dropCount: 1,
    textureIndices: { top: 16, bottom: 16, side: 16 }
  },
  16: {
    id: 16,
    name: 'Radiant Core',
    hardness: 0.5,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 15,
    dropItem: 'item_radiant_core',
    dropCount: 1,
    textureIndices: { top: 17, bottom: 17, side: 17 }
  },
  17: {
    id: 17,
    name: 'Reinforced Brick',
    hardness: 2.0,
    bestTool: 'pickaxe',
    minToolTier: 1,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_brick',
    dropCount: 1,
    textureIndices: { top: 18, bottom: 18, side: 18 }
  },
  18: {
    id: 18,
    name: 'Obsidian Slab',
    hardness: 6.0,
    bestTool: 'pickaxe',
    minToolTier: 4,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_obsidian',
    dropCount: 1,
    textureIndices: { top: 19, bottom: 19, side: 19 }
  },
  19: {
    id: 19,
    name: 'Crystal Glass',
    hardness: 0.3,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: true,
    isTransparent: true,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_glass',
    dropCount: 1,
    textureIndices: { top: 20, bottom: 20, side: 20 }
  },
  20: {
    id: 20,
    name: 'Kinetic Conveyor',
    hardness: 1.0,
    bestTool: 'pickaxe',
    minToolTier: 1,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 3,
    dropItem: 'item_conveyor',
    dropCount: 1,
    textureIndices: { top: 21, bottom: 3, side: 3 }
  },
  21: {
    id: 21,
    name: 'Automated Harvester',
    hardness: 1.5,
    bestTool: 'pickaxe',
    minToolTier: 2,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 4,
    dropItem: 'item_harvester',
    dropCount: 1,
    textureIndices: { top: 22, bottom: 3, side: 3 }
  },
  22: {
    id: 22,
    name: 'Crafting Workbench',
    hardness: 1.0,
    bestTool: 'axe',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_workbench',
    dropCount: 1,
    textureIndices: { top: 23, bottom: 6, side: 24 }
  },
  23: {
    id: 23,
    name: 'Smelting Forge',
    hardness: 2.0,
    bestTool: 'pickaxe',
    minToolTier: 1,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 12,
    dropItem: 'item_forge',
    dropCount: 1,
    textureIndices: { top: 3, bottom: 3, side: 25 }
  },
  24: {
    id: 24,
    name: 'Storage Crate',
    hardness: 1.0,
    bestTool: 'axe',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_crate',
    dropCount: 1,
    textureIndices: { top: 26, bottom: 26, side: 26 }
  },
  25: {
    id: 25,
    name: 'Aetherium Water',
    hardness: 0,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: false,
    isTransparent: true,
    isLiquid: true,
    lightEmission: 2,
    dropItem: '',
    dropCount: 0,
    textureIndices: { top: 27, bottom: 27, side: 27 }
  },
  26: {
    id: 26,
    name: 'Magma Flux',
    hardness: 0,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: false,
    isTransparent: false,
    isLiquid: true,
    lightEmission: 15,
    dropItem: '',
    dropCount: 0,
    textureIndices: { top: 28, bottom: 28, side: 28 }
  },
  27: {
    id: 27,
    name: 'Wild Crop',
    hardness: 0.1,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: false,
    isTransparent: true,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_wheat',
    dropCount: 2,
    textureIndices: { top: 29, bottom: 29, side: 29 }
  },
  28: {
    id: 28,
    name: 'Torch',
    hardness: 0.1,
    bestTool: 'none',
    minToolTier: 0,
    isSolid: false,
    isTransparent: true,
    isLiquid: false,
    lightEmission: 14,
    dropItem: 'item_torch',
    dropCount: 1,
    textureIndices: { top: 30, bottom: 30, side: 30 }
  },
  29: {
    id: 29,
    name: 'Dark Redwood Log',
    hardness: 1.5,
    bestTool: 'axe',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_redwood_log',
    dropCount: 1,
    textureIndices: { top: 5, bottom: 5, side: 31 }
  },
  30: {
    id: 30,
    name: 'Dark Redwood Planks',
    hardness: 1.0,
    bestTool: 'axe',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 0,
    dropItem: 'item_redwood_plank',
    dropCount: 1,
    textureIndices: { top: 32, bottom: 32, side: 32 }
  },
  31: {
    id: 31,
    name: 'Bioluminescent Moss',
    hardness: 0.4,
    bestTool: 'shovel',
    minToolTier: 0,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 11,
    dropItem: 'item_biomoss',
    dropCount: 1,
    textureIndices: { top: 33, bottom: 33, side: 33 }
  },
  32: {
    id: 32,
    name: 'Astral Monolith Stone',
    hardness: 5.0,
    bestTool: 'pickaxe',
    minToolTier: 3,
    isSolid: true,
    isTransparent: false,
    isLiquid: false,
    lightEmission: 9,
    dropItem: 'item_astral_stone',
    dropCount: 1,
    textureIndices: { top: 34, bottom: 34, side: 34 }
  }
};

// Item catalog
export const ITEM_DEFINITIONS: Record<string, ItemDef> = {
  // Blocks
  item_dirt: { id: 'item_dirt', name: 'Mossy Loam', description: 'Rich earthen soil.', category: 'block', maxStack: 64, placeBlockId: 2 },
  item_cobble: { id: 'item_cobble', name: 'Granite Cobblestone', description: 'Rough quarried rock.', category: 'block', maxStack: 64, placeBlockId: 3 },
  item_wood_log: { id: 'item_wood_log', name: 'Sunwood Log', description: 'Sturdy golden timber.', category: 'block', maxStack: 64, placeBlockId: 4 },
  item_wood_plank: { id: 'item_wood_plank', name: 'Sunwood Planks', description: 'Refined construction wood.', category: 'block', maxStack: 64, placeBlockId: 5 },
  item_sand: { id: 'item_sand', name: 'Scorched Sand', description: 'Fine silica grains.', category: 'block', maxStack: 64, placeBlockId: 7 },
  item_sandstone: { id: 'item_sandstone', name: 'Sandstone', description: 'Compacted desert stone.', category: 'block', maxStack: 64, placeBlockId: 8 },
  item_snowball: { id: 'item_snowball', name: 'Snowball', description: 'Chilled glacial sphere.', category: 'material', maxStack: 16 },
  item_ice: { id: 'item_ice', name: 'Glacial Ice', description: 'Slippery frozen block.', category: 'block', maxStack: 64, placeBlockId: 10 },
  item_brick: { id: 'item_brick', name: 'Reinforced Brick', description: 'Kiln-fired building brick.', category: 'block', maxStack: 64, placeBlockId: 17 },
  item_obsidian: { id: 'item_obsidian', name: 'Obsidian Slab', description: 'Volcanic glass rock.', category: 'block', maxStack: 64, placeBlockId: 18 },
  item_glass: { id: 'item_glass', name: 'Crystal Glass', description: 'Smelted transparent pane.', category: 'block', maxStack: 64, placeBlockId: 19 },
  item_radiant_core: { id: 'item_radiant_core', name: 'Radiant Core', description: 'Emits glowing aether light.', category: 'block', maxStack: 64, placeBlockId: 16 },
  item_torch: { id: 'item_torch', name: 'Aether Torch', description: 'Provides steady perimeter light.', category: 'block', maxStack: 64, placeBlockId: 28 },
  item_workbench: { id: 'item_workbench', name: 'Crafting Workbench', description: 'Enables advanced item synthesis.', category: 'block', maxStack: 16, placeBlockId: 22 },
  item_forge: { id: 'item_forge', name: 'Smelting Forge', description: 'Refines raw ores into metal ingots.', category: 'block', maxStack: 16, placeBlockId: 23 },
  item_crate: { id: 'item_crate', name: 'Storage Crate', description: 'Expands item storage.', category: 'block', maxStack: 16, placeBlockId: 24 },
  item_conveyor: { id: 'item_conveyor', name: 'Kinetic Conveyor', description: 'Automates item & entity movement.', category: 'automation', maxStack: 64, placeBlockId: 20 },
  item_harvester: { id: 'item_harvester', name: 'Automated Harvester', description: 'Gathers adjacent mature crops.', category: 'automation', maxStack: 16, placeBlockId: 21 },
  item_redwood_log: { id: 'item_redwood_log', name: 'Dark Redwood Log', description: 'Dense forest trunk.', category: 'block', maxStack: 64, placeBlockId: 29 },
  item_redwood_plank: { id: 'item_redwood_plank', name: 'Dark Redwood Planks', description: 'Heavy crimson construction wood.', category: 'block', maxStack: 64, placeBlockId: 30 },
  item_biomoss: { id: 'item_biomoss', name: 'Bioluminescent Moss', description: 'Glowing wetland vegetation.', category: 'block', maxStack: 64, placeBlockId: 31 },
  item_astral_stone: { id: 'item_astral_stone', name: 'Astral Monolith Stone', description: 'Resonates with cosmic energy.', category: 'block', maxStack: 64, placeBlockId: 32 },

  // Ores & Materials
  item_raw_ironite: { id: 'item_raw_ironite', name: 'Raw Ironite', description: 'Unrefined iron mineral.', category: 'material', maxStack: 64 },
  item_ingot_ironite: { id: 'item_ingot_ironite', name: 'Ironite Ingot', description: 'Smelted industrial metal.', category: 'material', maxStack: 64 },
  item_raw_cobalt: { id: 'item_raw_cobalt', name: 'Raw Cobalt', description: 'High-tensile blue ore.', category: 'material', maxStack: 64 },
  item_ingot_cobalt: { id: 'item_ingot_cobalt', name: 'Cobalt Ingot', description: 'Hardened deep-strata alloy.', category: 'material', maxStack: 64 },
  item_prism_crystal: { id: 'item_prism_crystal', name: 'Prism Crystal', description: 'Focuses energy and laser optics.', category: 'material', maxStack: 64 },
  item_void_shard: { id: 'item_void_shard', name: 'Void Shard', description: 'Dense dimensional matter.', category: 'material', maxStack: 64 },
  item_wheat: { id: 'item_wheat', name: 'Aether Grain', description: 'Nutritious harvested grain.', category: 'consumable', maxStack: 64, hungerAmount: 5 },
  item_bread: { id: 'item_bread', name: 'Golden Bread', description: 'Baked sustenance (restores 8 hunger).', category: 'consumable', maxStack: 64, hungerAmount: 8, healAmount: 4 },
  item_stick: { id: 'item_stick', name: 'Timber Stick', description: 'Basic tool handle.', category: 'material', maxStack: 64 },

  // Tools: Pickaxes
  tool_wood_pick: { id: 'tool_wood_pick', name: 'Wooden Pickaxe', description: 'Mines stone & coal.', category: 'tool', maxStack: 1, toolType: 'pickaxe', toolTier: 1, miningSpeed: 2.0, durability: 60 },
  tool_stone_pick: { id: 'tool_stone_pick', name: 'Stone Pickaxe', description: 'Mines Ironite.', category: 'tool', maxStack: 1, toolType: 'pickaxe', toolTier: 2, miningSpeed: 3.5, durability: 130 },
  tool_iron_pick: { id: 'tool_iron_pick', name: 'Ironite Pickaxe', description: 'Mines Cobalt and Prism crystals.', category: 'tool', maxStack: 1, toolType: 'pickaxe', toolTier: 3, miningSpeed: 5.5, durability: 260 },
  tool_cobalt_pick: { id: 'tool_cobalt_pick', name: 'Cobalt Pickaxe', description: 'Rapidly pierces Voidstone.', category: 'tool', maxStack: 1, toolType: 'pickaxe', toolTier: 4, miningSpeed: 8.0, durability: 600 },
  tool_prism_pick: { id: 'tool_prism_pick', name: 'Prism Drill-Pick', description: 'Laser-resonant supreme mining drill.', category: 'tool', maxStack: 1, toolType: 'pickaxe', toolTier: 5, miningSpeed: 12.0, durability: 1500 },

  // Tools: Axes & Shovels
  tool_wood_axe: { id: 'tool_wood_axe', name: 'Wooden Axe', description: 'Chops trees efficiently.', category: 'tool', maxStack: 1, toolType: 'axe', toolTier: 1, miningSpeed: 2.5, durability: 60 },
  tool_iron_axe: { id: 'tool_iron_axe', name: 'Ironite Axe', description: 'Heavy lumberjack axe.', category: 'tool', maxStack: 1, toolType: 'axe', toolTier: 3, miningSpeed: 6.0, durability: 260 },
  tool_wood_shovel: { id: 'tool_wood_shovel', name: 'Wooden Shovel', description: 'Digs loam and sand.', category: 'tool', maxStack: 1, toolType: 'shovel', toolTier: 1, miningSpeed: 2.5, durability: 60 },
  tool_iron_shovel: { id: 'tool_iron_shovel', name: 'Ironite Shovel', description: 'Digs sand, loam and clay rapidly.', category: 'tool', maxStack: 1, toolType: 'shovel', toolTier: 3, miningSpeed: 6.0, durability: 260 },

  // Weapons & Combat
  weapon_wood_sword: { id: 'weapon_wood_sword', name: 'Sunwood Blade', description: 'Basic melee weapon (+4 Damage).', category: 'weapon', maxStack: 1, damage: 4, durability: 60 },
  weapon_iron_sword: { id: 'weapon_iron_sword', name: 'Ironite Broadsword', description: 'Solid forged blade (+7 Damage).', category: 'weapon', maxStack: 1, damage: 7, durability: 260 },
  weapon_cobalt_sword: { id: 'weapon_cobalt_sword', name: 'Cobalt Greatsword', description: 'Heavy deep-strike weapon (+11 Damage).', category: 'weapon', maxStack: 1, damage: 11, durability: 600 },
  weapon_prism_saber: { id: 'weapon_prism_saber', name: 'Prism Light-Saber', description: 'Energy blade slicing through armor (+16 Damage).', category: 'weapon', maxStack: 1, damage: 16, durability: 1500 }
};
