import { SavedWorld } from '../../types/platformerGame';

export class SaveManager {
  private static readonly INDEX_KEY = 'aetheria_world_index';

  public static getSavedWorlds(): SavedWorld[] {
    try {
      const rawIndex = localStorage.getItem(this.INDEX_KEY);
      if (!rawIndex) return [];
      const ids: string[] = JSON.parse(rawIndex);
      const worlds: SavedWorld[] = [];

      ids.forEach((id) => {
        const raw = localStorage.getItem(`aetheria_world_${id}`);
        if (raw) {
          worlds.push(JSON.parse(raw));
        }
      });

      return worlds.sort((a, b) => b.lastSaved - a.lastSaved);
    } catch {
      return [];
    }
  }

  public static getLatestWorld(): SavedWorld | null {
    const list = this.getSavedWorlds();
    return list.length > 0 ? list[0] : null;
  }

  public static saveWorld(world: SavedWorld) {
    try {
      world.lastSaved = Date.now();
      localStorage.setItem(`aetheria_world_${world.id}`, JSON.stringify(world));

      // Update index
      const rawIndex = localStorage.getItem(this.INDEX_KEY);
      let ids: string[] = rawIndex ? JSON.parse(rawIndex) : [];
      if (!ids.includes(world.id)) {
        ids.unshift(world.id);
      }
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(ids));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }

  public static deleteWorld(id: string) {
    try {
      localStorage.removeItem(`aetheria_world_${id}`);
      const rawIndex = localStorage.getItem(this.INDEX_KEY);
      if (rawIndex) {
        const ids: string[] = JSON.parse(rawIndex).filter((x: string) => x !== id);
        localStorage.setItem(this.INDEX_KEY, JSON.stringify(ids));
      }
    } catch {}
  }
}
