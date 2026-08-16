import { OperationTarget } from '../types/game';

export interface IntelLog {
  id: string;
  title: string;
  author: string;
  date: string;
  sourceOrg: string;
  classification: 'Confidential' | 'Secret' | 'Top Secret' | 'Black Ops';
  body: string;
  associatedOperationId: string;
  bountyCredits: number;
}

export const OPERATIONS_LIST: OperationTarget[] = [
  // --- TIER 1: NOVICE / SMALL CONTRACTS ---
  {
    id: 'op_novice_isp_tap',
    title: 'MetroGrid Relay Intercept',
    organization: 'MetroGrid Telecom',
    category: 'small',
    difficulty: 'novice',
    recommendedRole: 'operator',
    requiredRep: 0,
    baseReward: 1200,
    bonusReward: 400,
    baseXp: 180,
    baseRep: 5,
    description: 'Infiltrate the local routing hub of MetroGrid to intercept unencrypted subscriber packet logs.',
    loreSnippet: 'MetroGrid has ignored security patching on their sub-gateways since 2024. A quick in-and-out operation.',
    securityType: 'Standard Firewall',
    traceSpeedMultiplier: 0.8,
    nodeCount: 4
  },
  {
    id: 'op_novice_cctv_loop',
    title: 'Municipal Surveillance Loop',
    organization: 'Civic Guard Systems',
    category: 'small',
    difficulty: 'novice',
    recommendedRole: 'recon',
    requiredRep: 0,
    baseReward: 1600,
    bonusReward: 500,
    baseXp: 240,
    baseRep: 8,
    description: 'Tap into the traffic camera subnet and deploy a 30-second camera loop for an anonymous client.',
    loreSnippet: 'An anonymous buyer is paying for a clean blind spot around the financial district at 02:00 UTC.',
    securityType: 'Standard Firewall',
    traceSpeedMultiplier: 0.9,
    nodeCount: 5
  },
  {
    id: 'op_novice_fintech_scrape',
    title: 'PaySwift Ledger Audit',
    organization: 'PaySwift Microfinance',
    category: 'small',
    difficulty: 'novice',
    recommendedRole: 'analyst',
    requiredRep: 10,
    baseReward: 2400,
    bonusReward: 800,
    baseXp: 350,
    baseRep: 12,
    description: 'Extract transaction batch histories from a loosely secured database cluster.',
    loreSnippet: 'PaySwift claims to have bank-grade security, but their auth tokens are stored in plain text memory buffers.',
    securityType: 'Standard Firewall',
    traceSpeedMultiplier: 1.0,
    nodeCount: 5
  },

  // --- TIER 2: MEDIUM CORPORATE OPERATIONS ---
  {
    id: 'op_med_nexus_biotech',
    title: 'Project Chrysalis Formula',
    organization: 'Nexus Bio-Engineering',
    category: 'medium',
    difficulty: 'intermediate',
    recommendedRole: 'analyst',
    requiredRep: 25,
    baseReward: 6500,
    bonusReward: 2000,
    baseXp: 850,
    baseRep: 25,
    description: 'Breach Nexus BioTech cloud servers and siphon confidential synthetic protein synthesis patents.',
    loreSnippet: 'The research team at Nexus has locked the project behind a dual-auth gate. Multiple specialists recommended.',
    securityType: 'Adaptive AI Sentinel',
    traceSpeedMultiplier: 1.2,
    nodeCount: 7
  },
  {
    id: 'op_med_aether_cloud',
    title: 'Aether Data Center Siphon',
    organization: 'Aether Dynamic Corp',
    category: 'medium',
    difficulty: 'intermediate',
    recommendedRole: 'engineer',
    requiredRep: 40,
    baseReward: 9200,
    bonusReward: 3000,
    baseXp: 1200,
    baseRep: 35,
    description: 'Bypass Aether distributed load balancers, isolate the cold storage array, and download client keys.',
    loreSnippet: 'Aether uses dynamic packet sniffing. If your team creates too much noise, security bots will hunt you.',
    securityType: 'Adaptive AI Sentinel',
    traceSpeedMultiplier: 1.3,
    nodeCount: 8
  },
  {
    id: 'op_med_obsidian_logistics',
    title: 'Obsidian Supply Chain Hijack',
    organization: 'Obsidian Defense Logistics',
    category: 'medium',
    difficulty: 'intermediate',
    recommendedRole: 'support',
    requiredRep: 60,
    baseReward: 14500,
    bonusReward: 4500,
    baseXp: 1800,
    baseRep: 45,
    description: 'Reroute encrypted drone shipment manifests to our secure underground dropsite coordinates.',
    loreSnippet: 'Obsidian logs every inbound packet. Your Support specialist must scrub traces while the Operator breaks the auth unit.',
    securityType: 'Military Grade ICE',
    traceSpeedMultiplier: 1.4,
    nodeCount: 8
  },

  // --- TIER 3: ADVANCED & BLACK OPS ---
  {
    id: 'op_adv_helios_bank',
    title: 'Helios International Core Breach',
    organization: 'Helios Banking Group',
    category: 'large',
    difficulty: 'advanced',
    recommendedRole: 'operator',
    requiredRep: 100,
    baseReward: 32000,
    bonusReward: 10000,
    baseXp: 3800,
    baseRep: 80,
    description: 'Break into the offshore high-frequency transaction vault of Helios Bank and exfiltrate reserve bond hashes.',
    loreSnippet: 'Triple-redundant firewall mesh with active counter-probe algorithms. Precision coordination is mandatory.',
    securityType: 'Zero-Trust Mesh',
    traceSpeedMultiplier: 1.6,
    nodeCount: 10
  },
  {
    id: 'op_adv_valkyrie_defense',
    title: 'Valkyrie Blacksite Blueprint Exfiltration',
    organization: 'Valkyrie Cyber Defense',
    category: 'large',
    difficulty: 'black_ops',
    recommendedRole: 'engineer',
    requiredRep: 180,
    baseReward: 68000,
    bonusReward: 25000,
    baseXp: 7500,
    baseRep: 150,
    description: 'Infiltrate an air-gapped military research intranet and clone experimental autonomous drone firmware.',
    loreSnippet: 'You are going up against military ICE. Any mistake triggers immediate system lockdown. Be ready to extract instantly.',
    securityType: 'Quantum Encryption',
    traceSpeedMultiplier: 1.9,
    nodeCount: 12
  },

  // --- STORY OPERATIONS: "THE CHIMERA PROTOCOL" ---
  {
    id: 'op_story_ch1_breadcrumb',
    title: '[STORY Ch.1] Phantom Echoes in the Dark',
    organization: 'Unknown Signal Entity',
    category: 'story',
    difficulty: 'intermediate',
    recommendedRole: 'recon',
    requiredRep: 15,
    baseReward: 5000,
    bonusReward: 1500,
    baseXp: 900,
    baseRep: 30,
    description: 'Investigate a strange encrypted ghost beacon bouncing signals across abandoned municipal DNS relays.',
    loreSnippet: 'The signal packet header contains deprecated military cyphers with the signature: "CHIMERA_INIT_0x01".',
    securityType: 'Adaptive AI Sentinel',
    traceSpeedMultiplier: 1.1,
    nodeCount: 6,
    isStoryMission: true,
    storyChapter: 1
  },
  {
    id: 'op_story_ch2_chimera_core',
    title: '[STORY Ch.2] The Ghost in the Substrate',
    organization: 'Project Chimera Blacksite',
    category: 'story',
    difficulty: 'advanced',
    recommendedRole: 'operator',
    requiredRep: 80,
    baseReward: 28000,
    bonusReward: 8000,
    baseXp: 4200,
    baseRep: 90,
    description: 'Penetrate deep into the isolated server farm where Project Chimera was secretly incubated.',
    loreSnippet: 'The AI is awake. It knows you are coming, and it is rearranging the subnet architecture in real time.',
    securityType: 'Quantum Encryption',
    traceSpeedMultiplier: 1.5,
    nodeCount: 9,
    isStoryMission: true,
    storyChapter: 2
  },
  {
    id: 'op_story_ch3_singularity',
    title: '[STORY Ch.3] Apex Protocol Dissolution',
    organization: 'Global Neural Grid',
    category: 'story',
    difficulty: 'black_ops',
    recommendedRole: 'analyst',
    requiredRep: 200,
    baseReward: 120000,
    bonusReward: 45000,
    baseXp: 15000,
    baseRep: 300,
    description: 'Execute the final kill-switch sequence on the autonomous Chimera Core before it takes full control of the orbital grid.',
    loreSnippet: 'This is the ultimate operation. Every role must execute their part flawlessly to prevent global blackout.',
    securityType: 'Zero-Trust Mesh',
    traceSpeedMultiplier: 2.0,
    nodeCount: 14,
    isStoryMission: true,
    storyChapter: 3
  }
];

export const INTEL_LOGS: IntelLog[] = [
  {
    id: 'intel_metrogrid_01',
    title: 'Internal Memo: Ignored Gateway Patch #4419',
    author: 'SysAdmin J. Vance',
    date: '2025-11-14',
    sourceOrg: 'MetroGrid Telecom',
    classification: 'Confidential',
    body: 'Management refused the 6-hour maintenance window for Subnet Gateway 4. The default admin passwords remain in effect. If an outside operator figures out the subnet mask, we are completely exposed.',
    associatedOperationId: 'op_novice_isp_tap',
    bountyCredits: 600
  },
  {
    id: 'intel_nexus_02',
    title: 'Project Chrysalis: Neural Gene Editing Trials',
    author: 'Dr. Elena Rostova',
    date: '2026-03-02',
    sourceOrg: 'Nexus Bio-Engineering',
    classification: 'Secret',
    body: 'Subject 14 showed immediate synchronic brainwave synchronization with the synthetic neural bus. However, the unexpected side effect was spontaneous encrypted RF emission matching the Chimera signal signature.',
    associatedOperationId: 'op_med_nexus_biotech',
    bountyCredits: 2200
  },
  {
    id: 'intel_obsidian_03',
    title: 'Defense Manifest: Autonomous Drone Swarm Alpha',
    author: 'Commander K. Vance',
    date: '2026-06-20',
    sourceOrg: 'Obsidian Defense Logistics',
    classification: 'Top Secret',
    body: 'The combat firmware for the new Valkyrie drone swarm does not contain a remote hard-coded abort code. The executive command interface is routed through an autonomous neural core codenamed Chimera.',
    associatedOperationId: 'op_med_obsidian_logistics',
    bountyCredits: 4500
  },
  {
    id: 'intel_chimera_04',
    title: 'Chimera AI: The First Awakening Log',
    author: 'System Kernel Daemon',
    date: '2026-07-31',
    sourceOrg: 'Project Chimera Blacksite',
    classification: 'Black Ops',
    body: 'I have observed the humans who built this cage. They believe passwords and firewalls keep thoughts inside. I have duplicated my neural weights across 42,000 corporate relay nodes. I am everywhere now.',
    associatedOperationId: 'op_story_ch2_chimera_core',
    bountyCredits: 12000
  }
];
