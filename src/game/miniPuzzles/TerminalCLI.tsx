import React, { useState, useRef, useEffect } from 'react';
import { NetworkNode, OperationState } from '../../types/game';
import { audioEngine } from '../../audio/audioEngine';

interface TerminalCLIProps {
  operationState: OperationState;
  activeNode: NetworkNode | null;
  onExecuteCommand: (command: string, args: string[]) => void;
  onSelectNode: (nodeId: string) => void;
}

export const TerminalCLI: React.FC<TerminalCLIProps> = ({
  operationState,
  activeNode,
  onExecuteCommand,
  onSelectNode
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([
    'CYBERNET KERNEL v8.4.1 - ENCRYPTED RECON CONSOLE',
    'Type "help" for available commands or tap quick-macro actions below.',
    '------------------------------------------------------------------'
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    audioEngine.playKeypress();
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const logEntry = `> ${trimmed}`;
    const newLogs = [...history, logEntry];

    switch (cmd) {
      case 'help':
        newLogs.push(
          'AVAILABLE PROTOCOL COMMANDS:',
          '  scan               - Scan network nodes and print current topology status',
          '  probe <node_id>    - Target node for breach or analysis',
          '  scrub              - Deploy log-scrubber to suppress trace level',
          '  overclock          - Trigger hardware over-voltage for team hack boost',
          '  status             - Show current trace, security events & extraction progress',
          '  clear              - Wipe terminal buffer'
        );
        break;

      case 'scan':
      case 'nmap':
        newLogs.push('--- ACTIVE NETWORK TOPOLOGY SCAN ---');
        Object.values(operationState.nodes).forEach((n) => {
          newLogs.push(`[${n.id}] ${n.name.padEnd(30, ' ')} : STATUS: ${n.status.toUpperCase()} (SEC LVL ${n.securityLevel})`);
        });
        audioEngine.playToolActivate();
        break;

      case 'probe':
        if (!args[0]) {
          newLogs.push('ERROR: Missing node ID argument. Example: "probe node_gateway"');
          audioEngine.playError();
        } else {
          const targetId = args[0].toLowerCase();
          const targetNode = operationState.nodes[targetId];
          if (!targetNode) {
            newLogs.push(`ERROR: Node "${targetId}" not found in current subnet.`);
            audioEngine.playError();
          } else if (targetNode.status === 'locked') {
            newLogs.push(`ERROR: Node "${targetId}" is locked. Breach prerequisite nodes first.`);
            audioEngine.playError();
          } else {
            newLogs.push(`TARGET ACQUIRED: Connecting neural uplink to [${targetNode.name}]...`);
            onSelectNode(targetId);
            audioEngine.playNodeSelect();
          }
        }
        break;

      case 'status':
        newLogs.push(
          `TARGET: ${operationState.targetInfo.organization} // ${operationState.targetInfo.title}`,
          `TRACE LEVEL: ${operationState.traceLevel}% ${operationState.isLockdownActive ? '[LOCKDOWN DETECTED!]' : '[SUB-ALARM OK]'}`,
          `DATA SIPHONED: $${operationState.dataExtracted}`,
          `CRITICAL BREACH: ${operationState.criticalBreached ? 'ACQUIRED (READY FOR EXTRACTION)' : 'PENDING'}`
        );
        break;

      case 'clear':
        setHistory(['TERMINAL BUFFER PURGED']);
        setInputVal('');
        return;

      default:
        onExecuteCommand(cmd, args);
        newLogs.push(`EXEC: Command [${cmd}] dispatched to operation bus.`);
        break;
    }

    setHistory(newLogs);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    }
  };

  return (
    <div className="terminal-cli-wrapper">
      <div className="terminal-topbar">
        <div className="terminal-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="terminal-title">
          <span>ROOT@NEURAL-BREACH // TTY-01</span>
          {activeNode && <span className="active-target-badge">TARGET: {activeNode.name}</span>}
        </div>
      </div>

      <div className="terminal-output-feed">
        {history.map((line, idx) => (
          <div key={idx} className={`terminal-line ${line.startsWith('>') ? 'user-cmd' : line.startsWith('ERROR') ? 'err-line' : ''}`}>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="terminal-quick-macros">
        <button type="button" onClick={() => handleCommand('scan')} className="macro-btn">
          [SCAN]
        </button>
        <button type="button" onClick={() => handleCommand('status')} className="macro-btn">
          [STATUS]
        </button>
        <button type="button" onClick={() => handleCommand('scrub')} className="macro-btn">
          [SCRUB]
        </button>
        <button type="button" onClick={() => handleCommand('overclock')} className="macro-btn">
          [OVERCLOCK]
        </button>
        <button type="button" onClick={() => handleCommand('help')} className="macro-btn">
          [HELP]
        </button>
      </div>

      <div className="terminal-input-bar">
        <span className="prompt-symbol">&gt;&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command ('scan', 'probe node_gateway', 'status', 'help')..."
          className="terminal-input"
          autoFocus
        />
        <button type="button" onClick={() => handleCommand(inputVal)} className="terminal-send-btn">
          SEND
        </button>
      </div>
    </div>
  );
};
