import React, { useState, useEffect } from 'react';
import { audioEngine } from '../../audio/audioEngine';

interface CipherMatrixProps {
  securityLevel: number;
  onSuccess: () => void;
  onFail: () => void;
}

const HEX_POOL = ['7A', '1C', 'E9', '55', 'BD', 'FF', '3A', 'C2', '9F', 'D4', '8B', '6E'];

export const CipherMatrix: React.FC<CipherMatrixProps> = ({ securityLevel, onSuccess, onFail }) => {
  const gridSize = 5;
  const sequenceLength = Math.min(5, 2 + securityLevel);

  const [matrix, setMatrix] = useState<string[][]>([]);
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [playerBuffer, setPlayerBuffer] = useState<string[]>([]);
  const [currentRow, setCurrentRow] = useState<number | null>(0); // Starts on Row 0
  const [currentCol, setCurrentCol] = useState<number | null>(null);
  const [isRowTurn, setIsRowTurn] = useState<boolean>(true);
  const [usedCells, setUsedCells] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(30 + securityLevel * 5);

  useEffect(() => {
    // Generate Matrix
    const newMatrix: string[][] = [];
    for (let r = 0; r < gridSize; r++) {
      const row: string[] = [];
      for (let c = 0; c < gridSize; c++) {
        row.push(HEX_POOL[Math.floor(Math.random() * HEX_POOL.length)]);
      }
      newMatrix.push(row);
    }
    setMatrix(newMatrix);

    // Pick solvable target sequence
    const seq: string[] = [];
    let r = 0;
    let c = Math.floor(Math.random() * gridSize);
    seq.push(newMatrix[r][c]);

    let rowStep = false;
    for (let i = 1; i < sequenceLength; i++) {
      if (rowStep) {
        c = Math.floor(Math.random() * gridSize);
      } else {
        r = Math.floor(Math.random() * gridSize);
      }
      seq.push(newMatrix[r][c]);
      rowStep = !rowStep;
    }

    setTargetSequence(seq);
    setPlayerBuffer([]);
    setCurrentRow(0);
    setCurrentCol(null);
    setIsRowTurn(true);
    setUsedCells(new Set());
  }, [securityLevel]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      audioEngine.playError();
      onFail();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onFail]);

  const handleCellClick = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (usedCells.has(key)) return;

    // Check if move is in active row or column
    if (isRowTurn && r !== currentRow) {
      audioEngine.playError();
      return;
    }
    if (!isRowTurn && c !== currentCol) {
      audioEngine.playError();
      return;
    }

    audioEngine.playKeypress();
    const val = matrix[r][c];
    const newBuffer = [...playerBuffer, val];
    const newUsed = new Set(usedCells).add(key);

    setPlayerBuffer(newBuffer);
    setUsedCells(newUsed);

    // Check sequence match
    const isMatching = targetSequence.slice(0, newBuffer.length).every((v, i) => v === newBuffer[i]);

    if (!isMatching) {
      // Wrong hex chosen
      audioEngine.playError();
      onFail();
      return;
    }

    if (newBuffer.length === targetSequence.length) {
      audioEngine.playNodeBreach();
      onSuccess();
      return;
    }

    // Toggle turn direction
    if (isRowTurn) {
      setIsRowTurn(false);
      setCurrentCol(c);
      setCurrentRow(null);
    } else {
      setIsRowTurn(true);
      setCurrentRow(r);
      setCurrentCol(null);
    }
  };

  return (
    <div className="cipher-matrix-deck">
      <div className="puzzle-header">
        <div className="puzzle-title">
          <span className="badge-tag">CIPHER PROTOCOL</span>
          <span>Buffer Sequence Extraction</span>
        </div>
        <div className={`puzzle-timer ${timeLeft < 10 ? 'urgent' : ''}`}>
          T-{timeLeft}s
        </div>
      </div>

      <div className="target-sequence-bar">
        <div className="target-label">REQUIRED BUFFER:</div>
        <div className="target-chips">
          {targetSequence.map((hex, idx) => {
            const isFilled = idx < playerBuffer.length;
            const isCorrect = isFilled && playerBuffer[idx] === hex;
            return (
              <div 
                key={idx} 
                className={`sequence-chip ${isFilled ? (isCorrect ? 'chip-correct' : 'chip-wrong') : 'chip-empty'}`}
              >
                {hex}
              </div>
            );
          })}
        </div>
      </div>

      <div className="matrix-instruction">
        {isRowTurn ? `▶ Select code from ACTIVE ROW [${(currentRow ?? 0) + 1}]` : `▼ Select code from ACTIVE COLUMN [${(currentCol ?? 0) + 1}]`}
      </div>

      <div className="matrix-grid">
        {matrix.map((row, r) => (
          <div key={r} className="matrix-row">
            {row.map((val, c) => {
              const key = `${r}-${c}`;
              const isUsed = usedCells.has(key);
              const isActive = (isRowTurn && r === currentRow) || (!isRowTurn && c === currentCol);

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  disabled={isUsed || !isActive}
                  className={`matrix-cell ${isUsed ? 'cell-used' : ''} ${isActive ? 'cell-active' : ''}`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
