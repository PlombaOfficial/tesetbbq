import * as THREE from 'three';

export class TextureAtlas {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  public static getTexture(name: string): THREE.CanvasTexture {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    switch (name) {
      case 'yellow_wallpaper':
        this.generateYellowWallpaper(ctx, 512, 512);
        break;
      case 'damp_carpet':
        this.generateDampCarpet(ctx, 512, 512);
        break;
      case 'acoustic_tiles':
        this.generateAcousticTiles(ctx, 512, 512);
        break;
      case 'concrete':
        this.generateConcrete(ctx, 512, 512);
        break;
      case 'wet_concrete':
        this.generateWetConcrete(ctx, 512, 512);
        break;
      case 'pipe_corridor':
        this.generatePipeWall(ctx, 512, 512);
        break;
      case 'tiled_floor':
        this.generateTiledFloor(ctx, 512, 512);
        break;
      case 'hotel_wallpaper':
        this.generateHotelWallpaper(ctx, 512, 512);
        break;
      case 'hotel_carpet':
        this.generateHotelCarpet(ctx, 512, 512);
        break;
      case 'office_panel':
        this.generateOfficePanel(ctx, 512, 512);
        break;
      case 'metal_door':
        this.generateMetalDoor(ctx, 512, 512);
        break;
      default:
        this.generateConcrete(ctx, 512, 512);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(name, texture);
    return texture;
  }

  // --- LEVEL 0: THE YELLOW MONOTONY ---
  private static generateYellowWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Base vintage yellow/beige tone
    ctx.fillStyle = '#bda86c';
    ctx.fillRect(0, 0, w, h);

    // Subtle wallpaper vertical stripes
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = x % 32 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, 0, 16, h);
    }

    // Micro noise texture & mold stains
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Water/damp leak stains running down
    ctx.fillStyle = 'rgba(74, 58, 28, 0.18)';
    for (let s = 0; s < 5; s++) {
      const sx = Math.random() * w;
      const sw = 20 + Math.random() * 40;
      ctx.beginPath();
      ctx.ellipse(sx, Math.random() * h, sw, 80 + Math.random() * 120, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static generateDampCarpet(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Base damp greenish-grey office carpet
    ctx.fillStyle = '#4a483a';
    ctx.fillRect(0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 45;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Dark damp puddles & footsteps
    ctx.fillStyle = 'rgba(20, 20, 15, 0.35)';
    for (let p = 0; p < 7; p++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 30 + Math.random() * 50, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static generateAcousticTiles(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // White/grey drop ceiling panels with grid frame
    ctx.fillStyle = '#8f928d';
    ctx.fillRect(0, 0, w, h);

    // Panel grid borders
    ctx.strokeStyle = '#4a4c48';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w / 2, h / 2);
    ctx.strokeRect(w / 2, 0, w / 2, h / 2);
    ctx.strokeRect(0, h / 2, w / 2, h / 2);
    ctx.strokeRect(w / 2, h / 2, w / 2, h / 2);

    // Acoustic puncture dots
    ctx.fillStyle = 'rgba(40, 42, 38, 0.4)';
    for (let i = 0; i < 400; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- INDUSTRIAL & CONCRETE LEVELS ---
  private static generateConcrete(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#484d52';
    ctx.fillRect(0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Hairline cracks
    ctx.strokeStyle = 'rgba(15, 18, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, 0);
    ctx.lineTo(w * 0.35, h * 0.4);
    ctx.lineTo(w * 0.28, h * 0.7);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
  }

  private static generateWetConcrete(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.generateConcrete(ctx, w, h);
    // Add specular puddles
    ctx.fillStyle = 'rgba(10, 15, 20, 0.5)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.6, 120, 70, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private static generatePipeWall(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 0, w, h);

    // Vertical metal sheets
    ctx.strokeStyle = '#221f1c';
    ctx.lineWidth = 4;
    for (let x = 0; x < w; x += 128) {
      ctx.strokeRect(x, 0, 128, h);
      // Rivets
      ctx.fillStyle = '#5c544d';
      for (let y = 16; y < h; y += 48) {
        ctx.beginPath();
        ctx.arc(x + 12, y, 4, 0, Math.PI * 2);
        ctx.arc(x + 116, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private static generateTiledFloor(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#a8b0b5';
    ctx.fillRect(0, 0, w, h);

    const tileSize = 64;
    ctx.strokeStyle = '#3b4247';
    ctx.lineWidth = 3;

    for (let x = 0; x < w; x += tileSize) {
      for (let y = 0; y < h; y += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize);
        if ((x + y) % (tileSize * 2) === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        }
      }
    }
  }

  private static generateHotelWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // 1930s crimson/burgundy damask pattern
    ctx.fillStyle = '#59181c';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#8a2b31';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 64) {
      for (let y = 0; y < h; y += 64) {
        ctx.beginPath();
        ctx.arc(x + 32, y + 32, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private static generateHotelCarpet(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#6b171c';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#bf7e36';
    ctx.lineWidth = 4;
    for (let x = 0; x < w; x += 96) {
      for (let y = 0; y < h; y += 96) {
        ctx.beginPath();
        ctx.moveTo(x + 48, y);
        ctx.lineTo(x + 96, y + 48);
        ctx.lineTo(x + 48, y + 96);
        ctx.lineTo(x, y + 48);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  private static generateOfficePanel(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#7a766f';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#4a4640';
    ctx.lineWidth = 6;
    for (let x = 0; x < w; x += 170) {
      ctx.strokeRect(x, 0, 170, h);
    }
  }

  private static generateMetalDoor(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#2f343b';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#181b1f';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Hazard handle / bar
    ctx.fillStyle = '#d97706';
    ctx.fillRect(w * 0.2, h * 0.5 - 15, w * 0.6, 30);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DO NOT ENTER', w * 0.5, h * 0.5 + 5);
  }
}
