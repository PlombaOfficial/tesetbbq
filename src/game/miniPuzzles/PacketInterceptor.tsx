import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../audio/audioEngine';

interface PacketInterceptorProps {
  securityLevel: number;
  onSuccess: () => void;
  onFail: () => void;
}

interface Packet {
  id: number;
  type: 'auth' | 'data' | 'probe' | 'corrupt';
  label: string;
  lane: number; // 0, 1, 2
  y: number; // 0-100%
  speed: number;
}

export const PacketInterceptor: React.FC<PacketInterceptorProps> = ({ securityLevel, onSuccess, onFail }) => {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [interceptedCount, setInterceptedCount] = useState(0);
  const targetCount = 3 + securityLevel;
  const [misses, setMisses] = useState(0);
  const maxMisses = 3;

  useEffect(() => {
    let packetId = 0;
    const spawnInterval = setInterval(() => {
      const types: Array<'auth' | 'data' | 'probe' | 'corrupt'> = ['auth', 'data', 'probe', 'corrupt'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const lane = Math.floor(Math.random() * 3);

      const labels = {
        auth: 'AUTH_TOKEN_0x',
        data: 'RAW_PAYLOAD_PKT',
        probe: 'SENTINEL_PROBE',
        corrupt: 'NULL_BYTE_STREAM'
      };

      const newPacket: Packet = {
        id: ++packetId,
        type: chosenType,
        label: labels[chosenType] + Math.floor(10 + Math.random() * 89),
        lane,
        y: 0,
        speed: 1.2 + securityLevel * 0.3
      };

      setPackets((prev) => [...prev, newPacket]);
    }, 1200);

    return () => clearInterval(spawnInterval);
  }, [securityLevel]);

  // Movement loop
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPackets((prev) => {
        const next: Packet[] = [];
        let newMisses = 0;

        for (const p of prev) {
          const updatedY = p.y + p.speed;
          if (updatedY >= 95) {
            if (p.type === 'auth' || p.type === 'data') {
              newMisses++;
            }
          } else {
            next.push({ ...p, y: updatedY });
          }
        }

        if (newMisses > 0) {
          setMisses((m) => {
            const total = m + newMisses;
            if (total >= maxMisses) {
              audioEngine.playError();
              onFail();
            }
            return total;
          });
        }

        return next;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [maxMisses, onFail]);

  const handlePacketClick = (packet: Packet) => {
    audioEngine.playClick();
    setPackets((prev) => prev.filter((p) => p.id !== packet.id));

    if (packet.type === 'auth' || packet.type === 'data') {
      const nextCount = interceptedCount + 1;
      setInterceptedCount(nextCount);
      audioEngine.playToolActivate();

      if (nextCount >= targetCount) {
        audioEngine.playNodeBreach();
        onSuccess();
      }
    } else if (packet.type === 'probe') {
      audioEngine.playAlert();
      setMisses((m) => {
        const total = m + 1;
        if (total >= maxMisses) {
          audioEngine.playError();
          onFail();
        }
        return total;
      });
    }
  };

  return (
    <div className="packet-interceptor-deck">
      <div className="puzzle-header">
        <div className="puzzle-title">
          <span className="badge-tag">STREAM SNIFFER</span>
          <span>Capture Auth Stream Packets</span>
        </div>
        <div className="puzzle-stats-row">
          <span>CAPTURED: <strong className="text-cyan">{interceptedCount} / {targetCount}</strong></span>
          <span>ANOMALIES: <strong className="text-rose">{misses} / {maxMisses}</strong></span>
        </div>
      </div>

      <div className="packet-lanes-board">
        <div className="lane-header">
          <span>LANE 01</span>
          <span>LANE 02</span>
          <span>LANE 03</span>
        </div>

        <div className="lanes-canvas">
          <div className="interception-threshold-line" />

          {packets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePacketClick(p)}
              style={{
                top: `${p.y}%`,
                left: `${p.lane * 33.33 + 2}%`,
                width: '29%'
              }}
              className={`packet-item packet-${p.type}`}
            >
              <span className="packet-icon">
                {p.type === 'auth' ? '🔑' : p.type === 'data' ? '📦' : p.type === 'probe' ? '⚠️' : '⚡'}
              </span>
              <span className="packet-label">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="packet-footer-hint">
        Click <strong className="text-cyan">AUTH</strong> and <strong className="text-emerald">DATA</strong> packets. Avoid <strong className="text-rose">SENTINEL PROBES</strong>!
      </div>
    </div>
  );
};
