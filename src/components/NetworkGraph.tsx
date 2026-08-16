import React from 'react';
import { NetworkNode, NodeType } from '../types/game';
import { audioEngine } from '../audio/audioEngine';

interface NetworkGraphProps {
  nodes: Record<string, NetworkNode>;
  activeNodeId: string | null;
  onSelectNode: (node: NetworkNode) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, activeNodeId, onSelectNode }) => {
  const nodeList = Object.values(nodes);

  const getNodeColor = (type: NodeType, status: string) => {
    if (status === 'breached') return '#10b981';
    if (status === 'locked') return '#475569';
    switch (type) {
      case 'gateway': return '#00e5ff';
      case 'firewall': return '#ef4444';
      case 'auth_server': return '#f59e0b';
      case 'database': return '#10b981';
      case 'mainframe': return '#a855f7';
      case 'honeypot': return '#ec4899';
      case 'audit_node': return '#3b82f6';
      default: return '#00e5ff';
    }
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'gateway': return 'GW';
      case 'firewall': return 'ICE';
      case 'auth_server': return 'AUTH';
      case 'database': return 'DATA';
      case 'mainframe': return 'CORE';
      case 'honeypot': return 'TRAP';
      case 'audit_node': return 'LOG';
      default: return 'NODE';
    }
  };

  const handleNodeClick = (node: NetworkNode) => {
    audioEngine.playNodeSelect();
    onSelectNode(node);
  };

  return (
    <div className="network-graph-container">
      <div className="graph-overlay-header">
        <span>SUBNET TOPOLOGY MAP</span>
        <span className="node-count-pill">{nodeList.filter((n) => n.status === 'breached').length} / {nodeList.length} NODES BREACHED</span>
      </div>

      <svg className="network-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Draw Connection Edges */}
        {nodeList.map((source) =>
          source.connectedTo.map((targetId) => {
            const target = nodes[targetId];
            if (!target) return null;

            const isSourceBreached = source.status === 'breached';
            const isTargetBreached = target.status === 'breached';
            const isLineActive = isSourceBreached;

            return (
              <line
                key={`${source.id}-${target.id}`}
                x1={`${source.x}%`}
                y1={`${source.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={isTargetBreached ? '#10b981' : isLineActive ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
                strokeWidth={isLineActive ? '1.8' : '1'}
                strokeDasharray={isLineActive ? 'none' : '2,2'}
                className={isLineActive ? 'network-edge-active' : 'network-edge-dormant'}
              />
            );
          })
        )}
      </svg>

      {/* Render Node DOM elements for high interactivity & tooltips */}
      <div className="nodes-layer">
        {nodeList.map((node) => {
          const isSelected = activeNodeId === node.id;
          const isBreached = node.status === 'breached';
          const color = getNodeColor(node.type, node.status);
          const icon = getNodeIcon(node.type);

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                borderColor: color,
                boxShadow: isSelected ? `0 0 16px ${color}` : undefined
              }}
              className={`network-node-point node-${node.status} ${isSelected ? 'node-selected' : ''}`}
            >
              <div className="node-icon-tag" style={{ color }}>
                {isBreached ? '✓' : icon}
              </div>

              {/* Teammate active indicator */}
              {node.currentHackerName && !isBreached && (
                <div className="teammate-hacking-badge">
                  <span className="animate-ping dot" />
                  <span>{node.currentHackerName}</span>
                </div>
              )}

              {/* Tooltip on hover */}
              <div className="node-info-tooltip">
                <div className="tooltip-name">{node.name}</div>
                <div className="tooltip-meta">
                  <span>SEC LVL: {node.securityLevel}</span>
                  <span className={`status-${node.status}`}>{node.status.toUpperCase()}</span>
                </div>
                {node.isCriticalObjective && <div className="tooltip-crit">★ PRIMARY TARGET</div>}
                {node.isSecondaryObjective && <div className="tooltip-sec">◆ CONFIDENTIAL VAULT</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
