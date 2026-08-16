import React, { useState, useEffect } from 'react';
import { UserProfile, RoomData, Player, OperationTarget } from './types/game';
import { playerStore } from './progression/playerStore';
import { roomManager } from './multiplayer/roomManager';
import { OPERATIONS_LIST } from './data/operationsData';
import { Navbar } from './components/Navbar';
import { LobbyView } from './components/LobbyView';
import { OperationsBoard } from './components/OperationsBoard';
import { ActiveOperationView } from './components/ActiveOperationView';
import { OperationResultsModal } from './components/OperationResultsModal';
import { LoadoutView } from './components/LoadoutView';
import { BlackMarketView } from './components/BlackMarketView';
import { IntelArchiveView } from './components/IntelArchiveView';
import { ProfileView } from './components/ProfileView';
import { SettingsModal } from './components/SettingsModal';
import './styles/global.css';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(playerStore.getProfile());
  const [activeRoom, setActiveRoom] = useState<RoomData | null>(null);
  const [currentView, setCurrentView] = useState<string>('operations');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to persistent player store
  useEffect(() => {
    const unsub = playerStore.subscribe((p) => setProfile(p));
    return unsub;
  }, []);

  // Parse URL search params for instant squad join (?join=XXXXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && !activeRoom) {
      handleJoinRoom(joinCode.toUpperCase());
    }
  }, []);

  // Construct local player representation for multiplayer
  const getLocalPlayer = (): Player => ({
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    title: profile.title,
    level: profile.level,
    rep: profile.rep,
    role: 'operator',
    isReady: false,
    isHost: false,
    lastPing: Date.now(),
    selectedRigId: profile.equippedRig,
    selectedTools: profile.equippedTools
  });

  // Create Room
  const handleCreateRoom = async () => {
    try {
      const localP = getLocalPlayer();
      const newRoom = await roomManager.createRoom(localP, OPERATIONS_LIST[0]);
      setActiveRoom(newRoom);
      setCurrentView('lobby');
      subscribeToActiveRoom(newRoom.roomCode, localP.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      setErrorMessage(msg);
    }
  };

  // Join Room
  const handleJoinRoom = async (code: string) => {
    try {
      const localP = getLocalPlayer();
      const res = await roomManager.joinRoom(code, localP);
      if (!res.success) {
        setErrorMessage(res.error || 'Could not connect to room');
        return;
      }
      setActiveRoom(res.room || null);
      setCurrentView('lobby');
      subscribeToActiveRoom(code, localP.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setErrorMessage(msg);
    }
  };

  // Launch Solo Test
  const handleStartSolo = async (target: OperationTarget) => {
    try {
      const localP = getLocalPlayer();
      localP.isReady = true;
      localP.isHost = true;
      const soloRoom = await roomManager.createRoom(localP, target);
      setActiveRoom(soloRoom);
      subscribeToActiveRoom(soloRoom.roomCode, localP.id);
      await roomManager.launchOperation(soloRoom.roomCode, target);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Solo launch error';
      setErrorMessage(msg);
    }
  };

  // Subscribe to real-time updates of active room
  const subscribeToActiveRoom = (roomCode: string, playerId: string) => {
    return roomManager.subscribeToRoom(
      roomCode,
      playerId,
      (updatedRoom) => {
        setActiveRoom(updatedRoom);
      },
      (err) => {
        setErrorMessage(err);
      }
    );
  };

  // Leave room
  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    await roomManager.leaveRoom(activeRoom.roomCode, profile.id);
    setActiveRoom(null);
    setCurrentView('operations');
  };

  const localPlayer = activeRoom?.players[profile.id] || getLocalPlayer();

  return (
    <div className="app-container">
      {/* CRT Scanline Overlay */}
      {profile.settings.crtEffect && <div className="crt-overlay" />}

      {/* Main Navbar */}
      <Navbar
        profile={profile}
        activeRoom={activeRoom}
        activeView={currentView}
        onNavigate={(v) => {
          setErrorMessage(null);
          setCurrentView(v);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="system-error-banner">
          <span>⚠️ {errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>DISMISS</button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="main-content-viewport">
        {/* If Infiltration is active in the room */}
        {activeRoom && (activeRoom.phase === 'INFILTRATION' || activeRoom.phase === 'RESULTS') ? (
          <>
            <ActiveOperationView room={activeRoom} localPlayer={localPlayer} />
            {activeRoom.phase === 'RESULTS' && (
              <OperationResultsModal room={activeRoom} localPlayer={localPlayer} />
            )}
          </>
        ) : (
          <>
            {currentView === 'operations' && (
              <OperationsBoard
                profile={profile}
                onLaunchOperation={(op) => {
                  if (activeRoom && localPlayer.isHost) {
                    roomManager.setSelectedOperation(activeRoom.roomCode, op);
                    setCurrentView('lobby');
                  } else {
                    handleStartSolo(op);
                  }
                }}
              />
            )}

            {currentView === 'lobby' && (
              <LobbyView
                room={activeRoom}
                localPlayer={localPlayer}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onStartSolo={handleStartSolo}
              />
            )}

            {currentView === 'loadout' && <LoadoutView profile={profile} />}
            {currentView === 'market' && <BlackMarketView profile={profile} />}
            {currentView === 'intel' && <IntelArchiveView profile={profile} />}
            {currentView === 'profile' && <ProfileView profile={profile} />}
          </>
        )}
      </main>

      {/* Settings & Field Manual Modal */}
      {isSettingsOpen && (
        <SettingsModal
          profile={profile}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
