import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../audio/audioEngine';

interface LogicCircuitProps {
  securityLevel: number;
  onSuccess: () => void;
  onFail: () => void;
}

type GateType = 'AND' | 'OR' | 'XOR' | 'NOT';

export const LogicCircuit: React.FC<LogicCircuitProps> = ({ securityLevel, onSuccess, onFail }) => {
  const [switches, setSwitches] = useState<boolean[]>([false, false, false, false]);
  const [gate1] = useState<GateType>(() => (securityLevel > 2 ? 'XOR' : 'AND'));
  const [gate2] = useState<GateType>(() => (securityLevel > 1 ? 'OR' : 'XOR'));
  const [gateFinal] = useState<GateType>('AND');

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          audioEngine.playError();
          onFail();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onFail]);

  // Compute logic outputs
  const evalGate = (g: GateType, in1: boolean, in2: boolean): boolean => {
    switch (g) {
      case 'AND': return in1 && in2;
      case 'OR': return in1 || in2;
      case 'XOR': return in1 !== in2;
      case 'NOT': return !in1;
      default: return false;
    }
  };

  const out1 = evalGate(gate1, switches[0], switches[1]);
  const out2 = evalGate(gate2, switches[2], switches[3]);
  const finalOut = evalGate(gateFinal, out1, out2);

  const toggleSwitch = (idx: number) => {
    audioEngine.playClick(800 + idx * 100);
    const newSwitches = [...switches];
    newSwitches[idx] = !newSwitches[idx];
    setSwitches(newSwitches);
  };

  useEffect(() => {
    if (finalOut) {
      audioEngine.playNodeBreach();
      const timer = setTimeout(() => {
        onSuccess();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [finalOut, onSuccess]);

  return (
    <div className="logic-circuit-deck">
      <div className="puzzle-header">
        <div className="puzzle-title">
          <span className="badge-tag">LOGIC GATE ROUTER</span>
          <span>Bypass Security Sub-Relay</span>
        </div>
        <div className={`puzzle-timer ${timeLeft < 10 ? 'urgent' : ''}`}>
          T-{timeLeft}s
        </div>
      </div>

      <div className="circuit-schematic-board">
        {/* Input Switches Column */}
        <div className="circuit-column switches-column">
          <div className="column-title">INPUT BUS</div>
          {switches.map((val, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleSwitch(idx)}
              className={`circuit-switch-btn ${val ? 'switch-high' : 'switch-low'}`}
            >
              <span>SIG_{idx + 1}</span>
              <strong>{val ? '1 [HIGH]' : '0 [LOW]'}</strong>
            </button>
          ))}
        </div>

        {/* Stage 1 Gates */}
        <div className="circuit-column gates-column">
          <div className="column-title">STAGE 1</div>
          
          <div className={`gate-box ${out1 ? 'gate-active' : ''}`}>
            <span className="gate-name">{gate1} GATE</span>
            <span className="gate-status">{out1 ? 'ACTIVE (1)' : 'IDLE (0)'}</span>
          </div>

          <div className={`gate-box ${out2 ? 'gate-active' : ''}`}>
            <span className="gate-name">{gate2} GATE</span>
            <span className="gate-status">{out2 ? 'ACTIVE (1)' : 'IDLE (0)'}</span>
          </div>
        </div>

        {/* Stage 2 Final Gate */}
        <div className="circuit-column final-column">
          <div className="column-title">FIREWALL CORE</div>
          
          <div className={`gate-box final-gate ${finalOut ? 'gate-active pulse-glow' : ''}`}>
            <span className="gate-name">{gateFinal} OUTPUT CORE</span>
            <span className={`gate-status ${finalOut ? 'text-emerald font-bold' : ''}`}>
              {finalOut ? '⚡ BYPASS CONFIRMED (1)' : '⛔ RESTRICTED (0)'}
            </span>
          </div>
        </div>
      </div>

      <div className="circuit-footer-hint">
        Goal: Route power to trigger <strong>FIREWALL CORE = 1</strong> to open this subnet relay.
      </div>
    </div>
  );
};
