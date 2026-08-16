import { useState, useEffect } from 'react';
import { VoxelRoomState, VoxelPlayer } from './types/voxelGame';
import { voxelNet } from './multiplayer/voxelNet';
import { VoxelMainMenu } from './components/VoxelMainMenu';
import { VoxelLobby } from './components/VoxelLobby';
import { VoxelCanvas } from './components/VoxelCanvas';
import { voxelAudio } from './game/audio/VoxelAudio';
import './styles/voxel.css';

export function App() {
  const [currentView, setCurrentView] = useState<'MENU' | 'LOBBY' | 'GAME'>('MENU');

  // Local Player Profile
  const [localPlayer] = useState<VoxelPlayer>(() => {
    let savedId = localStorage.getItem('aetheria_player_id');
    if (!savedId) {
      savedId = 'usr_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('aetheria_player_id', savedId);
    }
    const savedName = localStorage.getItem('aetheria_player_name') || `Traveler_${Math.floor(100 + Math.random() * 900)}`;
    const savedColor = localStorage.getItem('aetheria_player_color') || '#3b82f6';

    return {
      id: savedId,
      name: savedName,
      color: savedColor,
      isHost: false,
      isReady: false,
      x: 0,
      y: 30,
      z: 0,
      yaw: 0,
      pitch: 0,
      health: 20,
      hunger: 20,
      selectedSlot: 0,
      lastPing: Date.now()
    };
  });

  const [activeRoom, setActiveRoom] = useState<VoxelRoomState | null>(null);

  // Auto-join from URL parameter ?realm=XXXXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const realmCode = urlParams.get('realm');
    if (realmCode) {
      handleJoinMultiplayer(realmCode);
    }
  }, []);

  // Room Subscription
  useEffect(() => {
    if (!activeRoom) return;

    const unsubscribe = voxelNet.subscribeToWorld(
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
  const handleStartSingleplayer = async (worldName: string, seed?: number) => {
    voxelAudio.init();
    const soloRoom = await voxelNet.createWorld(
      { ...localPlayer, isHost: true, isReady: true },
      worldName,
      seed
    );
    await voxelNet.startWorld(soloRoom.roomCode);
    setActiveRoom(soloRoom);
    setCurrentView('GAME');
  };

  const handleCreateMultiplayer = async (worldName: string, seed?: number) => {
    voxelAudio.init();
    const room = await voxelNet.createWorld(
      { ...localPlayer, isHost: true, isReady: true },
      worldName,
      seed
    );
    setActiveRoom(room);
    setCurrentView('LOBBY');
  };

  const handleJoinMultiplayer = async (code: string) => {
    voxelAudio.init();
    const res = await voxelNet.joinWorld(code, localPlayer);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      setCurrentView('LOBBY');
    } else {
      alert(res.error || 'Failed to connect to realm.');
    }
  };

  const handleLeaveLobby = () => {
    setActiveRoom(null);
    setCurrentView('MENU');
  };

  return (
    <div className="aetheria-app-root">
      {/* 1. Main Menu */}
      {currentView === 'MENU' && (
        <VoxelMainMenu
          onStartSingleplayer={handleStartSingleplayer}
          onCreateMultiplayer={handleCreateMultiplayer}
          onJoinMultiplayer={handleJoinMultiplayer}
        />
      )}

      {/* 2. Multiplayer World Lobby */}
      {currentView === 'LOBBY' && activeRoom && (
        <VoxelLobby
          room={activeRoom}
          localPlayer={localPlayer}
          onLeaveLobby={handleLeaveLobby}
        />
      )}

      {/* 3. Voxel 3D World Canvas */}
      {currentView === 'GAME' && activeRoom && (
        <VoxelCanvas
          room={activeRoom}
          localPlayer={localPlayer}
          onExitToMenu={handleLeaveLobby}
        />
      )}
    </div>
  );
}

export default App;
