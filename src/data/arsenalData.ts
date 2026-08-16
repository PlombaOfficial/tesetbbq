import { HardwareItem, SoftwareTool } from '../types/game';

export const HARDWARE_ITEMS: HardwareItem[] = [
  // Rigs
  {
    id: 'rig_solderboard_v1',
    name: 'Mk-1 Solderboard Rig',
    category: 'rig',
    tier: 1,
    price: 0,
    requiredRep: 0,
    description: 'A refurbished underground breadboard rig with exposed copper traces and dual-channel bus.',
    stats: { bandwidth: 6, stealthBonus: 0, hackSpeedBonus: 0, heatDissipation: 10 },
    iconName: 'Cpu'
  },
  {
    id: 'rig_cyberdeck_v2',
    name: 'Neon-Ghost Cyberdeck v2',
    category: 'rig',
    tier: 2,
    price: 3500,
    requiredRep: 25,
    description: 'Custom portable aluminum deck with reinforced thermal pads and an active packet coprocessor.',
    stats: { bandwidth: 10, stealthBonus: 10, hackSpeedBonus: 15, heatDissipation: 25 },
    iconName: 'Laptop'
  },
  {
    id: 'rig_obsidian_blade',
    name: 'Obsidian Blade Terminal',
    category: 'rig',
    tier: 3,
    price: 12000,
    requiredRep: 75,
    description: 'High-density stealth rig housed in titanium-carbon casing with integrated RF noise shield.',
    stats: { bandwidth: 14, stealthBonus: 22, hackSpeedBonus: 30, heatDissipation: 45 },
    iconName: 'Server'
  },
  {
    id: 'rig_valkyrie_milspec',
    name: 'Valkyrie Mil-Spec Node',
    category: 'rig',
    tier: 4,
    price: 38000,
    requiredRep: 180,
    description: 'Decommissioned military reconnaissance chassis. Features hardware-level zero-trace routing.',
    stats: { bandwidth: 18, stealthBonus: 35, hackSpeedBonus: 45, heatDissipation: 70 },
    iconName: 'ShieldAlert'
  },
  {
    id: 'rig_quantum_nexus',
    name: 'Quantum Nexus Super-Node',
    category: 'rig',
    tier: 5,
    price: 95000,
    requiredRep: 350,
    description: 'Experimental quantum substrate node. Capable of manipulating logic matrix gates at photonic speeds.',
    stats: { bandwidth: 24, stealthBonus: 50, hackSpeedBonus: 70, heatDissipation: 100 },
    iconName: 'Zap'
  },

  // CPUs
  {
    id: 'cpu_dualcore_base',
    name: '3.2GHz Dual-Core RISC',
    category: 'cpu',
    tier: 1,
    price: 0,
    requiredRep: 0,
    description: 'Standard compute unit for basic network exploration.',
    stats: { bandwidth: 0, stealthBonus: 0, hackSpeedBonus: 0, heatDissipation: 5 },
    iconName: 'Cpu'
  },
  {
    id: 'cpu_octacore_overclock',
    name: 'Octa-Core Matrix Engine 4.8GHz',
    category: 'cpu',
    tier: 2,
    price: 2400,
    requiredRep: 20,
    description: 'Overclocked compute cluster capable of handling parallel brute-force threads.',
    stats: { bandwidth: 0, stealthBonus: 0, hackSpeedBonus: 18, heatDissipation: 15 },
    iconName: 'Flame'
  },
  {
    id: 'cpu_neural_quantum',
    name: 'Neural Photonic Core v9',
    category: 'cpu',
    tier: 4,
    price: 22000,
    requiredRep: 120,
    description: 'Direct neural interface processor with sub-nanosecond instruction cycles.',
    stats: { bandwidth: 0, stealthBonus: 10, hackSpeedBonus: 40, heatDissipation: 35 },
    iconName: 'Activity'
  },

  // RAM
  {
    id: 'ram_8gb_standard',
    name: '8GB DDR4 Low-Profile',
    category: 'ram',
    tier: 1,
    price: 0,
    requiredRep: 0,
    description: 'Standard memory bank with baseline bus width.',
    stats: { bandwidth: 0, stealthBonus: 0, hackSpeedBonus: 0, heatDissipation: 5 },
    iconName: 'Layers'
  },
  {
    id: 'ram_32gb_hyperx',
    name: '32GB Hyper-Matrix RAM',
    category: 'ram',
    tier: 2,
    price: 1800,
    requiredRep: 15,
    description: 'Expands available tool bandwidth to load concurrent software daemons.',
    stats: { bandwidth: 4, stealthBonus: 0, hackSpeedBonus: 5, heatDissipation: 10 },
    iconName: 'Layers'
  },
  {
    id: 'ram_128gb_optical',
    name: '128GB Optical Holographic Memory',
    category: 'ram',
    tier: 4,
    price: 18000,
    requiredRep: 100,
    description: 'Massive optical buffer for executing high-tier enterprise intrusion daemons.',
    stats: { bandwidth: 8, stealthBonus: 5, hackSpeedBonus: 12, heatDissipation: 20 },
    iconName: 'Grid'
  },

  // Uplinks
  {
    id: 'uplink_copper_base',
    name: '100Mbps Copper Uplink',
    category: 'uplink',
    tier: 1,
    price: 0,
    requiredRep: 0,
    description: 'Basic broadband tunnel with standard network latency.',
    stats: { bandwidth: 0, stealthBonus: 0, hackSpeedBonus: 0, heatDissipation: 5 },
    iconName: 'Wifi'
  },
  {
    id: 'uplink_orbital_sat',
    name: 'Orbital Sat-Link Array',
    category: 'uplink',
    tier: 3,
    price: 7500,
    requiredRep: 60,
    description: 'Bypasses terrestrial ISP monitors by relaying packets through low-orbit nanosatellites.',
    stats: { bandwidth: 2, stealthBonus: 18, hackSpeedBonus: 10, heatDissipation: 15 },
    iconName: 'Radio'
  },
  {
    id: 'uplink_quantum_darknet',
    name: 'Darknet Quantum Entanglement Relay',
    category: 'uplink',
    tier: 5,
    price: 32000,
    requiredRep: 220,
    description: 'Zero-latency, uninterceptable quantum stream direct into target backbones.',
    stats: { bandwidth: 4, stealthBonus: 35, hackSpeedBonus: 25, heatDissipation: 30 },
    iconName: 'Globe'
  },

  // Cooling
  {
    id: 'cooling_fan_stock',
    name: 'Stock Radial Fan',
    category: 'cooling',
    tier: 1,
    price: 0,
    requiredRep: 0,
    description: 'Baseline acoustic cooling for everyday operations.',
    stats: { bandwidth: 0, stealthBonus: 0, hackSpeedBonus: 0, heatDissipation: 10 },
    iconName: 'Wind'
  },
  {
    id: 'cooling_cryo_vacuum',
    name: 'Cryogenic Vacuum Loop',
    category: 'cooling',
    tier: 3,
    price: 8500,
    requiredRep: 70,
    description: 'Maintains sub-zero operating temperatures, reducing tool cooldowns by 30%.',
    stats: { bandwidth: 0, stealthBonus: 12, hackSpeedBonus: 15, heatDissipation: 50 },
    iconName: 'Sparkles'
  }
];

export const SOFTWARE_TOOLS: SoftwareTool[] = [
  {
    id: 'tool_hydra',
    name: 'Hydra Multi-Brute v4.2',
    code: 'HYDRA_BTF',
    tier: 1,
    price: 800,
    bandwidthCost: 2,
    requiredRep: 5,
    description: 'Parallel dictionary and permutation cracker for gateway authentication nodes.',
    effectDescription: '+40% Hack speed on Password & Gateway nodes for 15s.',
    roleAffinity: 'operator',
    cooldownSeconds: 15,
    iconName: 'Terminal'
  },
  {
    id: 'tool_ghost_proxy',
    name: 'Ghost-Proxy Cascade',
    code: 'PROXY_CASCADE',
    tier: 1,
    price: 1200,
    bandwidthCost: 3,
    requiredRep: 10,
    description: 'Routes trace telemetry through disposable overseas proxy circuits.',
    effectDescription: 'Instantly reduces team Trace Level by -20%.',
    roleAffinity: 'support',
    cooldownSeconds: 25,
    iconName: 'ShieldCheck'
  },
  {
    id: 'tool_deep_recon',
    name: 'Spectral Vulnerability Scanner',
    code: 'SPEC_SCAN',
    tier: 1,
    price: 950,
    bandwidthCost: 2,
    requiredRep: 8,
    description: 'Maps out firewall weaknesses and reveals honeypots across the subnet.',
    effectDescription: 'Reveals all hidden node types and drops puzzle complexity by 1 tier.',
    roleAffinity: 'analyst',
    cooldownSeconds: 20,
    iconName: 'Search'
  },
  {
    id: 'tool_overclock_daemon',
    name: 'Voltaic Overclock Daemon',
    code: 'VOLT_OVERCLOCK',
    tier: 2,
    price: 2500,
    bandwidthCost: 3,
    requiredRep: 25,
    description: 'Pumps excess voltage through team neural links to double compute output.',
    effectDescription: 'All team members gain +50% Hack Speed for 12 seconds.',
    roleAffinity: 'engineer',
    cooldownSeconds: 30,
    iconName: 'Zap'
  },
  {
    id: 'tool_zero_day_specter',
    name: 'Zero-Day: Specter Memory Bypass',
    code: 'ZDAY_SPECTER',
    tier: 3,
    price: 8500,
    bandwidthCost: 4,
    requiredRep: 60,
    description: 'Unpublished kernel vulnerability exploit that instantly bypasses authentication.',
    effectDescription: 'Instantly completes the currently targeted node without mini-game.',
    roleAffinity: 'operator',
    cooldownSeconds: 60,
    iconName: 'LockOpen'
  },
  {
    id: 'tool_ice_shatter',
    name: 'ICE-Shatter Protocol',
    code: 'ICE_SHATTER',
    tier: 3,
    price: 6800,
    bandwidthCost: 3,
    requiredRep: 50,
    description: 'Corrupts military-grade intrusion countermeasure electronics (ICE).',
    effectDescription: 'Freezes security patrol sweeps and disables trace buildup for 15 seconds.',
    roleAffinity: 'engineer',
    cooldownSeconds: 40,
    iconName: 'Snowflake'
  },
  {
    id: 'tool_audit_scrub',
    name: 'Daemon Log-Scrubber v7',
    code: 'AUDIT_SCRUB',
    tier: 2,
    price: 3200,
    bandwidthCost: 2,
    requiredRep: 30,
    description: 'Wipes all intrusion footprints from syslog and security event journals.',
    effectDescription: 'Reduces Trace by -15% and eliminates active security alerts.',
    roleAffinity: 'support',
    cooldownSeconds: 20,
    iconName: 'Eraser'
  },
  {
    id: 'tool_decoy_emitter',
    name: 'Honeypot Decoy Beacon',
    code: 'DECOY_EMIT',
    tier: 2,
    price: 3800,
    bandwidthCost: 3,
    requiredRep: 35,
    description: 'Spawns synthetic malicious traffic at a fake subnet address to mislead AI security.',
    effectDescription: 'Distracts Sentinel Hunter Bots away from active breach nodes for 25s.',
    roleAffinity: 'recon',
    cooldownSeconds: 35,
    iconName: 'Radio'
  },
  {
    id: 'tool_quantum_extractor',
    name: 'Quantum Data Siphon',
    code: 'Q_SIPHON',
    tier: 4,
    price: 15000,
    bandwidthCost: 5,
    requiredRep: 120,
    description: 'Photonic data stream extractor that doubles extracted confidential payloads.',
    effectDescription: '+100% Data Extraction Reward from Database & Mainframe nodes.',
    roleAffinity: 'analyst',
    cooldownSeconds: 50,
    iconName: 'Database'
  }
];
