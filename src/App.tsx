import { useState, useEffect } from 'react';
import { BackroomsRoomState, BackroomsPlayer, HazmatColor } from './types/horrorGame';
import { backroomsNet } from './multiplayer/backroomsNet';
import { MainMenu } from './components/MainMenu';
import { LobbyView } from './components/LobbyView';
import { BackroomsGameCanvas } from './components/BackroomsGameCanvas';
import { CodexView } from './components/CodexView';
import { SettingsModal } from './components/SettingsModal';
import { spatialAudio } from './game/engine/SpatialAudio';
import './styles/horror.css';

export function App() {
  const [currentView, setCurrentView] = useState<'MENU' | 'LOBBY' | 'GAME'>('MENU');
  const [showCodex, setShowCodex] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Local Operative Profile
  const [localPlayer] = useState<BackroomsPlayer>(() => {
    const savedName = localStorage.getItem('complex_player_name') || `OPERATIVE_${Math.floor(1000 + Math.random() * 9000)}`;
    const savedColor = (localStorage.getItem('complex_player_color') as HazmatColor) || '#eab308';
    return {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: savedName,
      color: savedColor,
      isHost: false,
      isReady: false,
      isAlive: true,
      x: 0,
      y: 1.5,
      z: 0,
      yaw: 0,
      pitch: 0,
      flashlightOn: true,
      currentLevel: 0,
      health: 100,
      sanity: 100,
      battery: 100,
      activeItem: 'flashlight',
      lastPing: Date.now()
    };
  });

  const [activeRoom, setActiveRoom] = useState<BackroomsRoomState | null>(null);

  // Auto-join from URL parameter ?room=XXXXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
      handleJoinLobby(roomCode);
    }
  }, []);

  // Room synchronization subscription
  useEffect(() => {
    if (!activeRoom) return;

    const unsubscribe = backroomsNet.subscribeToRoom(
      activeRoom.roomCode,
      localPlayer.id,
      (updatedRoom) => {
        setActiveRoom(updatedRoom);
        if (updatedRoom.phase === 'EXPLORATION' && currentView === 'LOBBY') {
          setCurrentView('GAME');
        } else if (updatedRoom.phase === 'LOBBY' && currentView === 'GAME') {
          setCurrentView('LOBBY');
        }
      },
      (err) => {
        console.warn('Room sync notice:', err);
      }
    );

    return () => unsubscribe();
  }, [activeRoom?.roomCode, currentView, localPlayer.id]);

  // Actions
  const handleStartSolo = async () => {
    spatialAudio.init();
    const soloRoom = await backroomsNet.createLobby({ ...localPlayer, isHost: true, isReady: true });
    await backroomsNet.startExpedition(soloRoom.roomCode);
    setActiveRoom(soloRoom);
    setCurrentView('GAME');
  };

  const handleCreateLobby = async () => {
    spatialAudio.init();
    const room = await backroomsNet.createLobby({ ...localPlayer, isHost: true, isReady: true });
    setActiveRoom(room);
    setCurrentView('LOBBY');
  };

  const handleJoinLobby = async (code: string) => {
    spatialAudio.init();
    const res = await backroomsNet.joinLobby(code, localPlayer);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      setCurrentView('LOBBY');
    } else {
      alert(res.error || 'Failed to join expedition party.');
    }
  };

  const handleLeaveLobby = () => {
    setActiveRoom(null);
    setCurrentView('MENU');
  };

  return (
    <div className="complex-app-root">
      {/* 1. Main Menu */}
      {currentView === 'MENU' && (
        <MainMenu
          onStartSolo={handleStartSolo}
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleJoinLobby}
          onOpenCodex={() => setShowCodex(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* 2. Squad Lobby */}
      {currentView === 'LOBBY' && activeRoom && (
        <LobbyView
          room={activeRoom}
          localPlayer={localPlayer}
          onLeaveLobby={handleLeaveLobby}
        />
      )}

      {/* 3. 3D Game Canvas */}
      {currentView === 'GAME' && activeRoom && (
        <BackroomsGameCanvas
          room={activeRoom}
          localPlayer={localPlayer}
          onExitToMenu={handleLeaveLobby}
        />
      )}

      {/* Modals */}
      {showCodex && <CodexView onClose={() => setShowCodex(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
