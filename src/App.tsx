import { useState, useEffect } from 'react';
import { PlatformerRoomState, PlatformerPlayer, SavedWorld } from './types/platformerGame';
import { platformerNet } from './multiplayer/platformerNet';
import { platformerAudio } from './game/platformer/PlatformerAudio';
import { PlatformerMenu } from './components/PlatformerMenu';
import { PlatformerLobby } from './components/PlatformerLobby';
import { PlatformerCanvas } from './components/PlatformerCanvas';
import './styles/platformer.css';

export function App() {
  const [currentView, setCurrentView] = useState<'MENU' | 'LOBBY' | 'GAME'>('MENU');

  // Local Player Profile
  const [localPlayer] = useState<PlatformerPlayer>(() => {
    let savedId = localStorage.getItem('aetheria_2d_player_id');
    if (!savedId) {
      savedId = 'usr_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('aetheria_2d_player_id', savedId);
    }
    const savedName = localStorage.getItem('aetheria_2d_player_name') || `Adventurer_${Math.floor(100 + Math.random() * 900)}`;
    const savedColor = localStorage.getItem('aetheria_2d_color') || '#3b82f6';

    return {
      id: savedId,
      name: savedName,
      color: savedColor,
      isHost: false,
      isReady: false,
      x: 0,
      y: 30,
      vx: 0,
      vy: 0,
      facingLeft: false,
      isGrounded: false,
      isClimbing: false,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      selectedSlot: 0,
      lastPing: Date.now(),
      toolSwingProgress: 0
    };
  });

  const [activeRoom, setActiveRoom] = useState<PlatformerRoomState | null>(null);

  // Auto-join from URL query ?coop=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('coop');
    if (code) {
      handleJoinMultiplayer(code);
    }
  }, []);

  // Room Subscription
  useEffect(() => {
    if (!activeRoom) return;

    const unsubscribe = platformerNet.subscribeToWorld(
      activeRoom.roomCode,
      localPlayer.id,
      (updatedRoom) => {
        setActiveRoom(updatedRoom);
        if (updatedRoom.phase === 'PLAYING' && currentView === 'LOBBY') {
          setCurrentView('GAME');
        } else if (updatedRoom.phase === 'LOBBY' && currentView === 'GAME') {
          setCurrentView('LOBBY');
        }
      },
      (err) => {
        console.warn('World sync notice:', err);
      }
    );

    return () => unsubscribe();
  }, [activeRoom?.roomCode, currentView, localPlayer.id]);

  // Actions
  const handleContinueWorld = async (saved: SavedWorld) => {
    platformerAudio.init();
    const soloRoom = await platformerNet.createWorld(
      { ...localPlayer, isHost: true, isReady: true },
      saved.name,
      saved.seed,
      saved.modifiedTiles,
      saved.modifiedWalls
    );
    await platformerNet.startWorld(soloRoom.roomCode);
    setActiveRoom(soloRoom);
    setCurrentView('GAME');
  };

  const handleStartSingleplayer = async (worldName: string, seed?: number) => {
    platformerAudio.init();
    const soloRoom = await platformerNet.createWorld(
      { ...localPlayer, isHost: true, isReady: true },
      worldName,
      seed
    );
    await platformerNet.startWorld(soloRoom.roomCode);
    setActiveRoom(soloRoom);
    setCurrentView('GAME');
  };

  const handleCreateMultiplayer = async (worldName: string, seed?: number) => {
    platformerAudio.init();
    const room = await platformerNet.createWorld(
      { ...localPlayer, isHost: true, isReady: true },
      worldName,
      seed
    );
    setActiveRoom(room);
    setCurrentView('LOBBY');
  };

  const handleJoinMultiplayer = async (code: string) => {
    platformerAudio.init();
    const res = await platformerNet.joinWorld(code, localPlayer);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      setCurrentView('LOBBY');
    } else {
      alert(res.error || 'Failed to connect to expedition.');
    }
  };

  const handleLeaveLobby = () => {
    setActiveRoom(null);
    setCurrentView('MENU');
  };

  return (
    <div className="aetheria-platformer-app">
      {/* 1. Main Menu */}
      {currentView === 'MENU' && (
        <PlatformerMenu
          onContinueWorld={handleContinueWorld}
          onStartSingleplayer={handleStartSingleplayer}
          onCreateMultiplayer={handleCreateMultiplayer}
          onJoinMultiplayer={handleJoinMultiplayer}
        />
      )}

      {/* 2. Co-op Staging Lobby */}
      {currentView === 'LOBBY' && activeRoom && (
        <PlatformerLobby
          room={activeRoom}
          localPlayer={localPlayer}
          onLeaveLobby={handleLeaveLobby}
        />
      )}

      {/* 3. Game Viewport */}
      {currentView === 'GAME' && activeRoom && (
        <PlatformerCanvas
          room={activeRoom}
          localPlayer={localPlayer}
          onExitToMenu={handleLeaveLobby}
        />
      )}
    </div>
  );
}

export default App;
