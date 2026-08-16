import React, { useState, useEffect } from 'react';
import { RoomData, Player, ChatMessage } from '../types/game';
import { NetworkGraph } from './NetworkGraph';
import { CipherMatrix } from '../game/miniPuzzles/CipherMatrix';
import { FrequencyTuner } from '../game/miniPuzzles/FrequencyTuner';
import { LogicCircuit } from '../game/miniPuzzles/LogicCircuit';
import { PacketInterceptor } from '../game/miniPuzzles/PacketInterceptor';
import { TerminalCLI } from '../game/miniPuzzles/TerminalCLI';
import { roomManager } from '../multiplayer/roomManager';
import { playerStore } from '../progression/playerStore';
import { SOFTWARE_TOOLS } from '../data/arsenalData';
import { audioEngine } from '../audio/audioEngine';
import { 
  Terminal, 
  Download, 
  MessageSquare, 
  Send, 
  AlertTriangle,
  Zap,
  Lock
} from 'lucide-react';

interface ActiveOperationViewProps {
  room: RoomData;
  localPlayer: Player;
}

export const ActiveOperationView: React.FC<ActiveOperationViewProps> = ({ room, localPlayer }) => {
  const op = room.operationState;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_gateway');
  const [activeTab, setActiveTab] = useState<'workspace' | 'terminal' | 'chat'>('workspace');
  const [chatInput, setChatInput] = useState('');
  const [toolCooldowns, setToolCooldowns] = useState<Record<string, number>>({});

  // Passive Trace progression (Host handles the periodic tick)
  useEffect(() => {
    if (!op || !localPlayer.isHost) return;

    const interval = setInterval(() => {
      if (room.phase !== 'INFILTRATION') return;
      const passiveRate = (op.targetInfo.traceSpeedMultiplier || 1.0) * 1.5;
      roomManager.adjustTrace(room.roomCode, passiveRate);
    }, 4000);

    return () => clearInterval(interval);
  }, [localPlayer.isHost, op, room.phase, room.roomCode]);

  // Audio tension sync
  useEffect(() => {
    if (op) {
      audioEngine.updateTension(op.traceLevel);
    }
  }, [op?.traceLevel]);

  // Tool Cooldown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setToolCooldowns((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([id, cd]) => {
          if (cd > 1) next[id] = cd - 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!op) {
    return <div className="loading-screen">INITIALIZING NEURAL UPLINK...</div>;
  }

  const selectedNode = selectedNodeId ? op.nodes[selectedNodeId] || null : null;
  const isSelectedLocked = selectedNode?.status === 'locked';
  const isSelectedBreached = selectedNode?.status === 'breached';

  // Handle mini-puzzle success
  const handlePuzzleSuccess = async () => {
    if (!selectedNode) return;
    playerStore.recordNodeBreach();
    await roomManager.updateNodeHackProgress(
      room.roomCode,
      selectedNode.id,
      100,
      localPlayer.id,
      localPlayer.name,
      true
    );
  };

  // Handle mini-puzzle failure
  const handlePuzzleFail = async () => {
    await roomManager.adjustTrace(room.roomCode, 15, `Intrusion alarm tripped by ${localPlayer.name} on [${selectedNode?.name}].`);
  };

  // Use Software Tool
  const handleUseTool = async (toolId: string) => {
    if (toolCooldowns[toolId]) return;
    const tool = SOFTWARE_TOOLS.find((t) => t.id === toolId);
    if (!tool) return;

    audioEngine.playToolActivate();

    if (tool.id === 'tool_zero_day_specter' && selectedNode && selectedNode.status === 'accessible') {
      await handlePuzzleSuccess();
    }

    await roomManager.useTool(room.roomCode, localPlayer.id, localPlayer.name, tool.id);

    const cdDiscount = localPlayer.role === 'engineer' ? 0.7 : 1.0;
    setToolCooldowns((prev) => ({
      ...prev,
      [tool.id]: Math.round(tool.cooldownSeconds * cdDiscount)
    }));
  };

  // Extract from Operation
  const handleExtract = async () => {
    audioEngine.playExtractSuccess();
    await roomManager.finishOperation(room.roomCode, op.criticalBreached);
  };

  // Send In-Game Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: localPlayer.id,
      senderName: localPlayer.name,
      senderRole: localPlayer.role,
      text: chatInput.trim(),
      timestamp: Date.now(),
      type: 'chat'
    };

    roomManager.sendChatMessage(room.roomCode, newMsg);
    setChatInput('');
  };

  return (
    <div className="active-operation-screen">
      {/* Top Threat & Target Bar */}
      <div className="operation-top-bar">
        <div className="target-summary-col">
          <div className="org-tag">{op.targetInfo.organization}</div>
          <div className="op-title">{op.targetInfo.title}</div>
        </div>

        {/* Trace Level Meter */}
        <div className="trace-meter-col">
          <div className="trace-header">
            <span>
              <AlertTriangle className="icon-sm" /> SECURITY TRACE LEVEL
            </span>
            <span className={`trace-percentage ${op.traceLevel > 75 ? 'text-rose font-bold' : ''}`}>
              {Math.round(op.traceLevel)}%
            </span>
          </div>
          <div className="trace-bar-track">
            <div
              className={`trace-bar-fill ${
                op.traceLevel > 80 ? 'fill-danger' : op.traceLevel > 50 ? 'fill-warning' : 'fill-normal'
              }`}
              style={{ width: `${Math.min(100, op.traceLevel)}%` }}
            />
          </div>
        </div>

        {/* Extracted Loot Counter */}
        <div className="data-loot-col">
          <div className="loot-label">DATA HARVESTED</div>
          <div className="loot-value">${op.dataExtracted.toLocaleString()}</div>
        </div>

        {/* Extraction Button */}
        <div className="extraction-col">
          <button
            type="button"
            onClick={handleExtract}
            className={`btn-extract ${
              op.criticalBreached ? 'btn-extract-ready pulse-glow' : op.isLockdownActive ? 'btn-extract-emergency' : 'btn-extract-disabled'
            }`}
          >
            <Download className="icon-sm" />
            <span>{op.criticalBreached ? 'EXTRACT CORE (READY)' : op.isLockdownActive ? 'EMERGENCY ABORT' : 'INFILTRATING...'}</span>
          </button>
        </div>
      </div>

      {/* Operative Team Bar */}
      <div className="team-status-strip">
        <div className="strip-label">TEAM UPLINK:</div>
        <div className="team-pills-list">
          {Object.values(room.players).map((p) => (
            <div key={p.id} className={`team-member-pill ${p.id === localPlayer.id ? 'is-self' : ''}`}>
              <span className={`role-badge role-${p.role}`}>{p.role.slice(0, 3).toUpperCase()}</span>
              <span className="player-callsign">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tactical Layout */}
      <div className="operation-main-workspace">
        {/* Left / Center: Interactive Node Topology */}
        <div className="topology-viewport-panel">
          <NetworkGraph
            nodes={op.nodes}
            activeNodeId={selectedNodeId}
            onSelectNode={(n) => setSelectedNodeId(n.id)}
          />
        </div>

        {/* Right / Infiltration Deck & Puzzles */}
        <div className="infiltration-deck-panel">
          {/* Deck View Navigation Tabs */}
          <div className="deck-nav-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('workspace')}
              className={`deck-tab-btn ${activeTab === 'workspace' ? 'active' : ''}`}
            >
              <Zap className="icon-xs" /> DECK INTERFACE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`deck-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            >
              <Terminal className="icon-xs" /> CLI TERMINAL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`deck-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <MessageSquare className="icon-xs" /> COMMS ({room.chatMessages.length})
            </button>
          </div>

          {/* Tab 1: Active Infiltration Deck & Mini-Game */}
          {activeTab === 'workspace' && (
            <div className="deck-content-box">
              {selectedNode ? (
                isSelectedBreached ? (
                  <div className="node-status-card node-breached-card">
                    <div className="status-icon text-emerald">✓</div>
                    <h3>NODE ALREADY COMPROMISED</h3>
                    <p>Security protocol disabled. Siphoned +${selectedNode.dataReward} data payload.</p>
                    <p className="hint">Select an adjacent unbreached node on the map to continue.</p>
                  </div>
                ) : isSelectedLocked ? (
                  <div className="node-status-card node-locked-card">
                    <Lock className="icon-lg text-slate" />
                    <h3>TARGET ACCESS RESTRICTED</h3>
                    <p>This node is protected by previous subnet gateways.</p>
                    <div className="prereq-list">
                      <span>REQUIRED BREACHES:</span>
                      {selectedNode.lockedUntil.map((pid) => (
                        <strong key={pid}>{op.nodes[pid]?.name || pid}</strong>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="active-puzzle-container">
                    {selectedNode.puzzleType === 'cipher_matrix' && (
                      <CipherMatrix
                        securityLevel={selectedNode.securityLevel}
                        onSuccess={handlePuzzleSuccess}
                        onFail={handlePuzzleFail}
                      />
                    )}
                    {selectedNode.puzzleType === 'frequency_tuner' && (
                      <FrequencyTuner
                        securityLevel={selectedNode.securityLevel}
                        onSuccess={handlePuzzleSuccess}
                        onFail={handlePuzzleFail}
                      />
                    )}
                    {selectedNode.puzzleType === 'logic_circuit' && (
                      <LogicCircuit
                        securityLevel={selectedNode.securityLevel}
                        onSuccess={handlePuzzleSuccess}
                        onFail={handlePuzzleFail}
                      />
                    )}
                    {selectedNode.puzzleType === 'packet_stream' && (
                      <PacketInterceptor
                        securityLevel={selectedNode.securityLevel}
                        onSuccess={handlePuzzleSuccess}
                        onFail={handlePuzzleFail}
                      />
                    )}
                    {selectedNode.puzzleType === 'terminal_exploit' && (
                      <TerminalCLI
                        operationState={op}
                        activeNode={selectedNode}
                        onSelectNode={(id) => setSelectedNodeId(id)}
                        onExecuteCommand={(cmd) => {
                          if (cmd === 'bypass') handlePuzzleSuccess();
                        }}
                      />
                    )}
                  </div>
                )
              ) : (
                <div className="node-status-card">
                  <h3>NO NODE SELECTED</h3>
                  <p>Select a node from the subnet map to begin penetration.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Terminal Console */}
          {activeTab === 'terminal' && (
            <div className="deck-content-box terminal-deck">
              <TerminalCLI
                operationState={op}
                activeNode={selectedNode}
                onSelectNode={(id) => setSelectedNodeId(id)}
                onExecuteCommand={(cmd) => {
                  if (cmd === 'bypass') handlePuzzleSuccess();
                }}
              />
            </div>
          )}

          {/* Tab 3: Team Comms & Event Feed */}
          {activeTab === 'chat' && (
            <div className="deck-content-box chat-deck">
              <div className="chat-messages-scroll">
                {room.chatMessages.map((m) => (
                  <div key={m.id} className={`chat-item ${m.isSystem ? 'chat-sys' : ''}`}>
                    <span className="chat-sender">
                      {m.senderRole && <span className="chat-role">[{m.senderRole.slice(0, 3).toUpperCase()}]</span>}
                      {m.senderName}:
                    </span>
                    <span className="chat-body">{m.text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="chat-send-bar">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send tactical message to team..."
                  className="chat-input"
                />
                <button type="submit" className="chat-submit-btn">
                  <Send className="icon-xs" />
                </button>
              </form>
            </div>
          )}

          {/* Software Arsenal Action Bar */}
          <div className="software-arsenal-toolbar">
            <div className="toolbar-header">EQUIPPED SOFTWARE DAEMONS:</div>
            <div className="arsenal-tools-list">
              {playerStore.getProfile().equippedTools.map((tid) => {
                const tool = SOFTWARE_TOOLS.find((t) => t.id === tid);
                if (!tool) return null;
                const cd = toolCooldowns[tool.id] || 0;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleUseTool(tool.id)}
                    disabled={cd > 0}
                    className={`arsenal-tool-btn ${cd > 0 ? 'tool-cooling' : 'tool-ready'}`}
                    title={`${tool.name} - ${tool.effectDescription}`}
                  >
                    <span className="tool-code">{tool.code}</span>
                    {cd > 0 ? <span className="tool-cd">{cd}s</span> : <span className="tool-exec">EXEC</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
