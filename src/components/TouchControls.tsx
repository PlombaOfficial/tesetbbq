import React, { useRef } from 'react';
import { 
  ArrowUp, 
  Package, 
  Pickaxe, 
  Layers 
} from 'lucide-react';

interface TouchControlsProps {
  onMove: (dir: { x: number; y: number }) => void;
  onLook: (delta: { x: number; y: number }) => void;
  onJump: (isJumping: boolean) => void;
  onMineStart: () => void;
  onMineEnd: () => void;
  onPlace: () => void;
  onOpenInventory: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onLook,
  onJump,
  onMineStart,
  onMineEnd,
  onPlace,
  onOpenInventory
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const joystickStickRef = useRef<HTMLDivElement | null>(null);
  const lookAreaRef = useRef<HTMLDivElement | null>(null);

  const joystickTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick touch handlers
  const handleJoystickStart = (e: React.TouchEvent) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        if (joystickStickRef.current) {
          joystickStickRef.current.style.transform = `translate(0px, 0px)`;
        }
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !joystickStickRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDist = 45;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    joystickStickRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

    // Output normalized direction (-1 to 1)
    onMove({
      x: dx / maxDist,
      y: -dy / maxDist // Up is positive forward
    });
  };

  // Look touch handlers
  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        onLook({ x: dx * 0.006, y: dy * 0.006 });
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  return (
    <div className="mobile-touch-overlay">
      {/* Left Virtual Joystick */}
      <div 
        ref={joystickBaseRef}
        className="virtual-joystick-base"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        <div ref={joystickStickRef} className="virtual-joystick-stick" />
      </div>

      {/* Right Look Drag Area */}
      <div 
        ref={lookAreaRef}
        className="touch-look-area"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Action Buttons Right Side */}
      <div className="touch-action-buttons-col">
        {/* Mine / Attack */}
        <button 
          type="button" 
          className="touch-btn touch-btn-mine"
          onTouchStart={onMineStart}
          onTouchEnd={onMineEnd}
        >
          <Pickaxe className="icon-sm text-amber" />
          <span>MINE</span>
        </button>

        {/* Place Block */}
        <button 
          type="button" 
          className="touch-btn touch-btn-place"
          onTouchStart={onPlace}
        >
          <Layers className="icon-sm text-cyan" />
          <span>PLACE</span>
        </button>

        {/* Jump / Swim */}
        <button 
          type="button" 
          className="touch-btn touch-btn-jump"
          onTouchStart={() => onJump(true)}
          onTouchEnd={() => onJump(false)}
        >
          <ArrowUp className="icon-sm text-emerald" />
          <span>JUMP</span>
        </button>
      </div>

      {/* Inventory Button Top Center */}
      <div className="touch-top-bar">
        <button type="button" onClick={onOpenInventory} className="touch-btn-inv">
          <Package className="icon-sm" />
          <span>BACKPACK [E]</span>
        </button>
      </div>
    </div>
  );
};
