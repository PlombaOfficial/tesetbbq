import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../../audio/audioEngine';

interface FrequencyTunerProps {
  securityLevel: number;
  onSuccess: () => void;
  onFail: () => void;
}

export const FrequencyTuner: React.FC<FrequencyTunerProps> = ({ securityLevel, onSuccess, onFail }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Target randomized parameters
  const [targetFreq] = useState(() => 2 + Math.floor(Math.random() * 4));
  const [targetAmp] = useState(() => 25 + Math.floor(Math.random() * 30));
  const [targetPhase] = useState(() => Math.floor(Math.random() * 6));

  // Player slider states
  const [playerFreq, setPlayerFreq] = useState(1);
  const [playerAmp, setPlayerAmp] = useState(10);
  const [playerPhase, setPlayerPhase] = useState(0);

  const [coherence, setCoherence] = useState(0);
  const [lockProgress, setLockProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => Math.max(20, 35 - securityLevel * 2));

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

  // Calculate Coherence & Animation Loop
  useEffect(() => {
    let animId: number;
    let timeOffset = 0;

    const diffFreq = Math.abs(playerFreq - targetFreq);
    const diffAmp = Math.abs(playerAmp - targetAmp);
    const diffPhase = Math.abs(playerPhase - targetPhase);

    // Coherence calculation: 100% max
    const score = Math.max(0, 100 - (diffFreq * 20 + diffAmp * 1.5 + diffPhase * 8));
    setCoherence(Math.round(score));

    const render = () => {
      timeOffset += 0.05;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Draw Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Draw Target Carrier Wave (Amber/Red)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const rad = (x / w) * targetFreq * Math.PI * 2 + targetPhase + timeOffset;
        const y = centerY + Math.sin(rad) * targetAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Player Modulated Wave (Cyan/Green)
      ctx.strokeStyle = score > 85 ? '#10b981' : '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const rad = (x / w) * playerFreq * Math.PI * 2 + playerPhase + timeOffset;
        const y = centerY + Math.sin(rad) * playerAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [playerFreq, playerAmp, playerPhase, targetFreq, targetAmp, targetPhase]);

  // Lock progress accumulation
  useEffect(() => {
    let lockTimer: number;
    if (coherence >= 88) {
      lockTimer = window.setInterval(() => {
        setLockProgress((prev) => {
          if (prev >= 100) {
            audioEngine.playFrequencyMatch();
            onSuccess();
            return 100;
          }
          return prev + 25;
        });
      }, 200);
    } else {
      setLockProgress(0);
    }

    return () => clearInterval(lockTimer);
  }, [coherence, onSuccess]);

  const handleFreqChange = (val: number) => {
    setPlayerFreq(val);
    audioEngine.playClick(600 + val * 100);
  };

  const handleAmpChange = (val: number) => {
    setPlayerAmp(val);
    audioEngine.playClick(400 + val * 5);
  };

  const handlePhaseChange = (val: number) => {
    setPlayerPhase(val);
    audioEngine.playClick(500 + val * 40);
  };

  return (
    <div className="frequency-tuner-deck">
      <div className="puzzle-header">
        <div className="puzzle-title">
          <span className="badge-tag">SUBNET RF OVERRIDE</span>
          <span>Harmonic Carrier Sync (Lvl {securityLevel})</span>
        </div>
        <div className={`puzzle-timer ${timeLeft < 10 ? 'urgent' : ''}`}>
          T-{timeLeft}s
        </div>
      </div>

      <div className="tuner-screen-wrapper">
        <canvas ref={canvasRef} width={480} height={180} className="tuner-canvas" />
        
        <div className="signal-coherence-indicator">
          <div className="coherence-label">
            <span>SIGNAL COHERENCE:</span>
            <span className={coherence > 85 ? 'text-emerald' : 'text-cyan'}>{coherence}%</span>
          </div>
          <div className="coherence-bar-bg">
            <div 
              className={`coherence-bar-fill ${coherence > 85 ? 'fill-emerald' : 'fill-cyan'}`} 
              style={{ width: `${coherence}%` }}
            />
          </div>
          {lockProgress > 0 && (
            <div className="lock-progress-text animate-pulse">
              LOCKING FREQUENCY: {lockProgress}%
            </div>
          )}
        </div>
      </div>

      <div className="tuner-controls-grid">
        <div className="tuner-control-group">
          <label>FREQUENCY [{playerFreq} GHz]</label>
          <input 
            type="range" 
            min="1" 
            max="6" 
            step="1"
            value={playerFreq} 
            onChange={(e) => handleFreqChange(Number(e.target.value))}
            className="custom-range"
          />
        </div>

        <div className="tuner-control-group">
          <label>AMPLITUDE [{playerAmp} dBm]</label>
          <input 
            type="range" 
            min="10" 
            max="60" 
            step="5"
            value={playerAmp} 
            onChange={(e) => handleAmpChange(Number(e.target.value))}
            className="custom-range"
          />
        </div>

        <div className="tuner-control-group">
          <label>PHASE OFFSET [φ {playerPhase * 30}°]</label>
          <input 
            type="range" 
            min="0" 
            max="6" 
            step="1"
            value={playerPhase} 
            onChange={(e) => handlePhaseChange(Number(e.target.value))}
            className="custom-range"
          />
        </div>
      </div>
    </div>
  );
};
