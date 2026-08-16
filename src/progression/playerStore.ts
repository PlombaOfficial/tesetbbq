import { UserProfile, PlayerRole } from '../types/game';
import { HARDWARE_ITEMS, SOFTWARE_TOOLS } from '../data/arsenalData';
import { ACHIEVEMENTS_DATA } from '../data/achievementsData';
import { audioEngine } from '../audio/audioEngine';

const STORAGE_KEY = 'cybernet_user_profile_v2';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_' + Math.random().toString(36).substring(2, 9),
  name: 'NetRunner_' + Math.floor(1000 + Math.random() * 9000),
  avatar: 'terminal',
  title: 'Script Novice',
  level: 1,
  xp: 0,
  nextLevelXp: 500,
  credits: 2500,
  rep: 5,
  ownedHardware: ['rig_solderboard_v1', 'cpu_dualcore_base', 'ram_8gb_standard', 'uplink_copper_base', 'cooling_fan_stock'],
  ownedTools: ['tool_hydra'],
  equippedRig: 'rig_solderboard_v1',
  equippedCpu: 'cpu_dualcore_base',
  equippedRam: 'ram_8gb_standard',
  equippedUplink: 'uplink_copper_base',
  equippedCooling: 'cooling_fan_stock',
  equippedTools: ['tool_hydra'],
  unlockedIntel: [],
  stats: {
    operationsStarted: 0,
    operationsCompleted: 0,
    operationsFailed: 0,
    totalCreditsEarned: 2500,
    nodesBreached: 0,
    stealthRuns: 0,
    lockdownEscapes: 0,
    toolsUsed: 0,
    playTimeMinutes: 0,
    favoriteRole: 'operator'
  },
  achievements: {},
  settings: {
    masterVolume: 0.6,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    crtEffect: true,
    screenShake: true,
    highContrast: false
  }
};

class PlayerStore {
  private profile: UserProfile;
  private listeners: Array<(profile: UserProfile) => void> = [];

  constructor() {
    this.profile = this.loadProfile();
    // Update audio engine with saved volume settings
    audioEngine.setVolumes(
      this.profile.settings.masterVolume,
      this.profile.settings.sfxVolume,
      this.profile.settings.musicVolume
    );
  }

  private loadProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults in case of new fields
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          stats: { ...DEFAULT_PROFILE.stats, ...(parsed.stats || {}) },
          settings: { ...DEFAULT_PROFILE.settings, ...(parsed.settings || {}) }
        };
      }
    } catch {
      // Ignore parse error
    }
    return { ...DEFAULT_PROFILE };
  }

  public saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      this.notify();
    } catch {
      // Quota or storage disabled
    }
  }

  public getProfile(): UserProfile {
    return { ...this.profile };
  }

  public subscribe(listener: (profile: UserProfile) => void): () => void {
    this.listeners.push(listener);
    listener(this.getProfile());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const p = this.getProfile();
    this.listeners.forEach((fn) => fn(p));
  }

  // --- PROGRESSION ACTIONS ---

  public updateName(name: string) {
    if (!name.trim()) return;
    this.profile.name = name.trim().slice(0, 18);
    this.saveProfile();
  }

  public updateAvatar(avatar: string) {
    this.profile.avatar = avatar;
    this.saveProfile();
  }

  public addRewards(credits: number, xp: number, rep: number) {
    this.profile.credits += Math.max(0, credits);
    this.profile.rep += Math.max(0, rep);
    this.profile.stats.totalCreditsEarned += Math.max(0, credits);
    this.addXp(xp);
    this.checkAchievements();
    this.saveProfile();
  }

  public addXp(amount: number) {
    this.profile.xp += Math.max(0, amount);
    // Level formula: Level = Math.floor(Math.sqrt(xp / 250)) + 1
    const newLevel = Math.floor(Math.sqrt(this.profile.xp / 250)) + 1;
    if (newLevel > this.profile.level) {
      this.profile.level = newLevel;
      this.updateTitle();
      audioEngine.playExtractSuccess();
    }
    this.profile.nextLevelXp = Math.pow(this.profile.level, 2) * 250;
    this.saveProfile();
  }

  private updateTitle() {
    const lvl = this.profile.level;
    if (lvl >= 30) this.profile.title = 'Apex Cyber Deity';
    else if (lvl >= 25) this.profile.title = 'Ghost Protocol';
    else if (lvl >= 20) this.profile.title = 'Master Netrunner';
    else if (lvl >= 15) this.profile.title = 'Cyber Operative';
    else if (lvl >= 10) this.profile.title = 'Black Hat Specialist';
    else if (lvl >= 5) this.profile.title = 'Subnet Infiltrator';
    else this.profile.title = 'Script Novice';
  }

  public buyHardware(item: typeof HARDWARE_ITEMS[0]): boolean {
    if (this.profile.ownedHardware.includes(item.id)) return true;
    if (this.profile.credits < item.price || this.profile.rep < item.requiredRep) {
      audioEngine.playError();
      return false;
    }

    this.profile.credits -= item.price;
    this.profile.ownedHardware.push(item.id);
    audioEngine.playToolActivate();
    this.saveProfile();
    return true;
  }

  public buyTool(tool: typeof SOFTWARE_TOOLS[0]): boolean {
    if (this.profile.ownedTools.includes(tool.id)) return true;
    if (this.profile.credits < tool.price || this.profile.rep < tool.requiredRep) {
      audioEngine.playError();
      return false;
    }

    this.profile.credits -= tool.price;
    this.profile.ownedTools.push(tool.id);
    audioEngine.playToolActivate();
    this.saveProfile();
    return true;
  }

  public equipHardware(category: 'rig' | 'cpu' | 'ram' | 'uplink' | 'cooling', itemId: string) {
    if (!this.profile.ownedHardware.includes(itemId)) return;

    if (category === 'rig') this.profile.equippedRig = itemId;
    else if (category === 'cpu') this.profile.equippedCpu = itemId;
    else if (category === 'ram') this.profile.equippedRam = itemId;
    else if (category === 'uplink') this.profile.equippedUplink = itemId;
    else if (category === 'cooling') this.profile.equippedCooling = itemId;

    // Validate bandwidth when rig or RAM changes
    this.validateEquippedTools();
    audioEngine.playClick();
    this.saveProfile();
  }

  public toggleEquipTool(toolId: string): boolean {
    if (!this.profile.ownedTools.includes(toolId)) return false;

    const isEquipped = this.profile.equippedTools.includes(toolId);
    if (isEquipped) {
      this.profile.equippedTools = this.profile.equippedTools.filter((id) => id !== toolId);
      audioEngine.playClick();
      this.saveProfile();
      return true;
    }

    // Check bandwidth limit
    const totalBandwidth = this.calculateTotalBandwidth();
    const currentUsed = this.calculateUsedBandwidth();
    const tool = SOFTWARE_TOOLS.find((t) => t.id === toolId);
    if (!tool) return false;

    if (currentUsed + tool.bandwidthCost > totalBandwidth) {
      audioEngine.playError();
      return false;
    }

    this.profile.equippedTools.push(toolId);
    audioEngine.playClick();
    this.saveProfile();
    return true;
  }

  public calculateTotalBandwidth(): number {
    const rig = HARDWARE_ITEMS.find((h) => h.id === this.profile.equippedRig);
    const ram = HARDWARE_ITEMS.find((h) => h.id === this.profile.equippedRam);
    const uplink = HARDWARE_ITEMS.find((h) => h.id === this.profile.equippedUplink);

    let bw = 6;
    if (rig) bw += rig.stats.bandwidth;
    if (ram) bw += ram.stats.bandwidth;
    if (uplink) bw += uplink.stats.bandwidth;
    return bw;
  }

  public calculateUsedBandwidth(): number {
    return this.profile.equippedTools.reduce((sum, tid) => {
      const tool = SOFTWARE_TOOLS.find((t) => t.id === tid);
      return sum + (tool ? tool.bandwidthCost : 0);
    }, 0);
  }

  private validateEquippedTools() {
    const total = this.calculateTotalBandwidth();
    let used = 0;
    const validTools: string[] = [];

    for (const tid of this.profile.equippedTools) {
      const tool = SOFTWARE_TOOLS.find((t) => t.id === tid);
      if (tool && used + tool.bandwidthCost <= total) {
        validTools.push(tid);
        used += tool.bandwidthCost;
      }
    }
    this.profile.equippedTools = validTools;
  }

  public unlockIntel(intelId: string, bounty: number) {
    if (!this.profile.unlockedIntel.includes(intelId)) {
      this.profile.unlockedIntel.push(intelId);
      this.profile.credits += bounty;
      audioEngine.playExtractSuccess();
      this.saveProfile();
    }
  }

  public recordOperationFinish(success: boolean, stealth: boolean, lockdown: boolean, role: PlayerRole) {
    this.profile.stats.operationsStarted += 1;
    if (success) {
      this.profile.stats.operationsCompleted += 1;
      if (stealth) this.profile.stats.stealthRuns += 1;
      if (lockdown) this.profile.stats.lockdownEscapes += 1;
    } else {
      this.profile.stats.operationsFailed += 1;
    }
    this.profile.stats.favoriteRole = role;
    this.checkAchievements();
    this.saveProfile();
  }

  public recordNodeBreach() {
    this.profile.stats.nodesBreached += 1;
    this.saveProfile();
  }

  public recordToolUsed() {
    this.profile.stats.toolsUsed += 1;
    this.saveProfile();
  }

  public checkAchievements() {
    ACHIEVEMENTS_DATA.forEach((ach) => {
      if (this.profile.achievements[ach.id]) return;

      let unlock = false;
      const s = this.profile.stats;

      if (ach.id === 'ach_first_breach' && s.operationsCompleted >= 1) unlock = true;
      if (ach.id === 'ach_stealth_ghost' && s.stealthRuns >= 1) unlock = true;
      if (ach.id === 'ach_level_5' && this.profile.level >= 5) unlock = true;
      if (ach.id === 'ach_level_15' && this.profile.level >= 15) unlock = true;
      if (ach.id === 'ach_level_30' && this.profile.level >= 30) unlock = true;
      if (ach.id === 'ach_high_roller' && s.totalCreditsEarned >= 100000) unlock = true;
      if (ach.id === 'ach_quantum_rig' && this.profile.ownedHardware.includes('rig_quantum_nexus')) unlock = true;
      if (ach.id === 'ach_lockdown_escape' && s.lockdownEscapes >= 1) unlock = true;
      if (ach.id === 'ach_intel_hoarder' && this.profile.unlockedIntel.length >= 4) unlock = true;

      if (unlock) {
        this.profile.achievements[ach.id] = true;
        this.profile.credits += ach.rewardCredits;
        this.profile.xp += ach.rewardXp;
        audioEngine.playExtractSuccess();
      }
    });
  }

  public updateSettings(settings: Partial<UserProfile['settings']>) {
    this.profile.settings = { ...this.profile.settings, ...settings };
    audioEngine.setVolumes(
      this.profile.settings.masterVolume,
      this.profile.settings.sfxVolume,
      this.profile.settings.musicVolume
    );
    this.saveProfile();
  }
}

export const playerStore = new PlayerStore();
