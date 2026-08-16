import { NetworkNode, OperationTarget, PuzzleType, NodeType } from '../types/game';

export function generateNetworkTopology(target: OperationTarget): Record<string, NetworkNode> {
  const nodes: Record<string, NetworkNode> = {};
  const nodeCount = Math.max(4, target.nodeCount);

  // 1. Gateway Entry Node (Always Breachable first)
  nodes['node_gateway'] = {
    id: 'node_gateway',
    name: 'External Gateway / Port 443',
    type: 'gateway',
    status: 'accessible',
    securityLevel: 1,
    puzzleType: 'frequency_tuner',
    x: 10,
    y: 50,
    connectedTo: [],
    lockedUntil: [],
    hackProgress: 0,
    dataReward: 150
  };

  // Puzzle distribution
  const puzzles: PuzzleType[] = ['cipher_matrix', 'logic_circuit', 'frequency_tuner', 'packet_stream', 'terminal_exploit'];

  // Layer 2: Subnet Routers & Firewalls
  const layer2Count = Math.min(3, Math.max(2, Math.floor(nodeCount / 3)));
  const layer2Ids: string[] = [];

  for (let i = 0; i < layer2Count; i++) {
    const id = `node_l2_${i + 1}`;
    layer2Ids.push(id);
    const isFirewall = i === 0;
    const type: NodeType = isFirewall ? 'firewall' : 'router';

    nodes[id] = {
      id,
      name: isFirewall ? `Sentinel Firewall ICE-0${i + 1}` : `Subnet Switch 10.0.${i + 1}.1`,
      type,
      status: 'locked',
      securityLevel: target.difficulty === 'novice' ? 1 : 2,
      puzzleType: puzzles[(i + 1) % puzzles.length],
      x: 32,
      y: 20 + i * (60 / Math.max(1, layer2Count - 1)),
      connectedTo: [],
      lockedUntil: ['node_gateway'],
      hackProgress: 0,
      dataReward: 300
    };
    nodes['node_gateway'].connectedTo.push(id);
  }

  // Layer 3: Auth Relay, Audit Log & Secondary Vault
  const layer3Count = Math.max(2, Math.floor(nodeCount / 3));
  const layer3Ids: string[] = [];

  for (let i = 0; i < layer3Count; i++) {
    const id = `node_l3_${i + 1}`;
    layer3Ids.push(id);

    let type: NodeType = 'auth_server';
    let isSec = false;

    if (i === 0) {
      type = 'auth_server';
    } else if (i === 1 && layer3Count >= 2) {
      type = 'audit_node';
    } else {
      type = 'vault';
      isSec = true;
    }

    // Connect to layer 2
    const parentId = layer2Ids[i % layer2Ids.length];
    if (nodes[parentId]) {
      nodes[parentId].connectedTo.push(id);
    }

    nodes[id] = {
      id,
      name: type === 'auth_server' ? 'Kerberos Auth Daemon' : type === 'audit_node' ? 'Syslog Audit Sentinel' : 'Encrypted Shadow Cache',
      type,
      status: 'locked',
      securityLevel: target.difficulty === 'novice' ? 2 : 3,
      puzzleType: puzzles[(i + 2) % puzzles.length],
      x: 60,
      y: 22 + i * (56 / Math.max(1, layer3Count - 1)),
      connectedTo: [],
      lockedUntil: [parentId],
      hackProgress: 0,
      dataReward: 600,
      isSecondaryObjective: isSec
    };
  }

  // Optional Honeypot node if tier > novice
  if (target.difficulty !== 'novice' && nodeCount > 5) {
    const honeyId = 'node_honeypot';
    const parentId = layer2Ids[layer2Ids.length - 1];
    nodes[honeyId] = {
      id: honeyId,
      name: 'Unprotected Root Archive [DECOY]',
      type: 'honeypot',
      status: 'locked',
      securityLevel: 1,
      puzzleType: 'frequency_tuner',
      x: 55,
      y: 85,
      connectedTo: [],
      lockedUntil: [parentId],
      hackProgress: 0,
      dataReward: 50
    };
    if (nodes[parentId]) nodes[parentId].connectedTo.push(honeyId);
  }

  // Layer 4: Primary Mainframe Core & High-Value DB
  const coreId = 'node_core_mainframe';
  const mainAuthParent = layer3Ids[0];

  nodes[coreId] = {
    id: coreId,
    name: `${target.organization.split(' ')[0]} Central Mainframe Core`,
    type: 'mainframe',
    status: 'locked',
    securityLevel: target.difficulty === 'novice' ? 2 : target.difficulty === 'intermediate' ? 3 : 5,
    puzzleType: target.difficulty === 'novice' ? 'cipher_matrix' : 'logic_circuit',
    x: 88,
    y: 45,
    connectedTo: [],
    lockedUntil: [mainAuthParent],
    hackProgress: 0,
    dataReward: target.baseReward,
    isCriticalObjective: true,
    intelPayload: `EXTRACTED_ARCHIVE_${target.id.toUpperCase()}`
  };
  if (nodes[mainAuthParent]) {
    nodes[mainAuthParent].connectedTo.push(coreId);
  }

  // Optional Secondary Database node
  if (nodeCount >= 7) {
    const dbId = 'node_secondary_db';
    const dbParent = layer3Ids[Math.min(1, layer3Ids.length - 1)];

    nodes[dbId] = {
      id: dbId,
      name: 'R&D Encrypted Schematics DB',
      type: 'database',
      status: 'locked',
      securityLevel: 3,
      puzzleType: 'packet_stream',
      x: 85,
      y: 78,
      connectedTo: [],
      lockedUntil: [dbParent],
      hackProgress: 0,
      dataReward: target.bonusReward,
      isSecondaryObjective: true
    };
    if (nodes[dbParent]) {
      nodes[dbParent].connectedTo.push(dbId);
    }
  }

  return nodes;
}
