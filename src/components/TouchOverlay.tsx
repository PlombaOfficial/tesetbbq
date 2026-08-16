import React, { useRef } from 'react';
import { 
  ArrowUp, 
  Pickaxe, 
  Layers, 
  Package, 
  Hammer, 
  ArrowDown, 
  Crosshair 
} from 'lucide-react';

interface TouchOverlayProps {
  onMove: (dir: { x: number; y: number }) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onActionStart: () => void;
  onActionEnd: () => void;
  onInteract: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({
  onMove,
  onJumpStart,
  onJumpEnd,
  onActionStart,
  onActionEnd,
  onInteract,
  onOpenInventory,
  onOpenCrafting
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const joystickStickRef = useRef<HTMLDivElement | null>(null);
  const joystickTouchIdRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        if (joystickStickRef.current) {
          joystickStickRef.current.style.transform = 'translate(0px, 0px)';
        }
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !joystickStickRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDist = 45;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    joystickStickRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

    const normX = dx / maxDist;
    const normY = dy / maxDist;

    onMove({
      x: Math.abs(normX) > 0.2 ? (normX > 0 ? 1 : -1) : 0,
      y: Math.abs(normY) > 0.35 ? (normY > 0 ? 1 : -1) : 0
    });
  };

  return (
    <div className="mobile-touch-screen-root">
      {/* Left Virtual Joystick */}
      <div
        ref={joystickBaseRef}
        className="virtual-joystick-base"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div ref={joystickStickRef} className="virtual-joystick-stick" />
      </div>

      {/* Right Action Cluster */}
      <div className="touch-actions-cluster">
        {/* Mine / Attack */}
        <button
          type="button"
          className="touch-round-btn btn-mine-attack"
          onTouchStart={onActionStart}
          onTouchEnd={onActionEnd}
        >
          <Pickaxe className="icon-sm text-amber" />
          <span>ACTION</span>
        </button>

        {/* Place / Interact */}
        <button
          type="button"
          className="touch-round-btn btn-place-use"
          onTouchStart={onInteract}
        >
          <Layers className="icon-sm text-cyan" />
          <span>USE</span>
        </button>

        {/* Jump */}
        <button
          type="button"
          className="touch-round-btn btn-jump-main"
          onTouchStart={onJumpStart}
          onTouchEnd={onJumpEnd}
        >
          <ArrowUp className="icon-md text-emerald" />
          <span>JUMP</span>
        </button>
      </div>

      {/* Top Center Shortcuts */}
      <div className="touch-top-shortcuts">
        <button type="button" onClick={onOpenInventory} className="touch-shortcut-pill">
          <Package className="icon-xs" />
          <span>BAG [E]</span>
        </button>
        <button type="button" onClick={onOpenCrafting} className="touch-shortcut-pill">
          <Hammer className="icon-xs" />
          <span>CRAFT [C]</span>
        </button>
      </div>
    </div>
  );
};
