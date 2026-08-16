import { useState, useEffect } from 'react';
import { ClashRoomState, Faction, MapType } from './types/pvpClash';
import { clashNet } from './multiplayer/clashNet';
import { clashAudio } from './game/clash/ClashAudio';
import { ClashMenu } from './components/ClashMenu';
import { ClashLobby } from './components/ClashLobby';
import { RoleRollModal } from './components/RoleRollModal';
import { DeckSelectModal } from './components/DeckSelectModal';
import { ClashGameBoard } from './components/ClashGameBoard';
import { MatchSummaryModal } from './components/MatchSummaryModal';
import './styles/clash.css';

export function App() {
  const [currentView, setCurrentView] = useState<'MENU' | 'LOBBY' | 'ROLE_REVEAL' | 'DECK_SELECT' | 'MATCH' | 'SUMMARY'>('MENU');

  // Player Profile
  const [myId] = useState<string>(() => {
    let saved = localStorage.getItem('bio_clash_player_id');
    if (!saved) {
      saved = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('bio_clash_player_id', saved);
    }
    return saved;
  });

  const [myName] = useState<string>(() => {
    return localStorage.getItem('bio_clash_player_name') || `Commander_${Math.floor(100 + Math.random() * 900)}`;
  });

  const [myColor] = useState<string>('#3b82f6');
  const [activeRoom, setActiveRoom] = useState<ClashRoomState | null>(null);

  // Match State
  const [matchWinner, setMatchWinner] = useState<Faction | null>(null);

  // Auto-join from URL parameter ?duel=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duelCode = params.get('duel');
    if (duelCode) {
      handleJoinMatch(duelCode);
    }
  }, []);

  // Room Subscription
  useEffect(() => {
    if (!activeRoom) return;

    const unsubscribe = clashNet.subscribeToRoom(
      activeRoom.roomCode,
      (updatedRoom) => {
        setActiveRoom(updatedRoom);

        // Only sync forward phases from server to avoid cyclic bounce
        if (updatedRoom.phase === 'ROLE_REVEAL' && currentView === 'LOBBY') {
          setCurrentView('ROLE_REVEAL');
        } else if (updatedRoom.phase === 'DECK_SELECT' && currentView === 'ROLE_REVEAL') {
          setCurrentView('DECK_SELECT');
        } else if (updatedRoom.phase === 'MATCH' && currentView !== 'MATCH' && currentView !== 'SUMMARY') {
          setCurrentView('MATCH');
        }
      },
      (err) => {
        console.warn('Room sync notice:', err);
      }
    );

    return () => unsubscribe();
  }, [activeRoom?.roomCode, currentView]);

  // Actions: Create Match
  const handleCreateMatch = async (map: MapType) => {
    clashAudio.init();
    const room = await clashNet.createRoom(myId, myName, myColor, 'BIO-CLASH ARENA', map);
    setActiveRoom(room);
    setCurrentView('LOBBY');
  };

  // Actions: Join Match
  const handleJoinMatch = async (code: string) => {
    clashAudio.init();
    const res = await clashNet.joinRoom(code, myId, myName, myColor);
    if (res.success && res.room) {
      setActiveRoom(res.room);
      setCurrentView('LOBBY');
    } else {
      alert(res.error || 'Failed to connect to duel room.');
    }
  };

  // Actions: Practice vs AI
  const handlePracticeAI = async (map: MapType) => {
    clashAudio.init();
    const room = await clashNet.createRoom(myId, myName, myColor, 'SOLO AI PRACTICE', map);
    // Assign random role directly
    const isPlants = Math.random() < 0.5;
    room.roles = {
      [myId]: isPlants ? 'PLANTS' : 'ZOMBIES',
      ai_opponent: isPlants ? 'ZOMBIES' : 'PLANTS'
    };
    room.playerNames['ai_opponent'] = 'A.I. Adaptive Bot';
    room.playerColors['ai_opponent'] = '#f43f5e';
    room.guestId = 'ai_opponent';
    room.phase = 'ROLE_REVEAL';

    setActiveRoom(room);
    setCurrentView('ROLE_REVEAL');
  };

  const handleRoleRevealFinished = async () => {
    if (activeRoom) {
      await clashNet.setPhase(activeRoom.roomCode, 'DECK_SELECT');
    }
    setCurrentView('DECK_SELECT');
  };

  const handleDeckConfirmed = async (selectedCards: string[]) => {
    if (!activeRoom) return;
    const myRole = activeRoom.roles[myId] || 'PLANTS';

    if (myRole === 'PLANTS') {
      await clashNet.submitDecksAndStart(activeRoom.roomCode, selectedCards, activeRoom.zombieDeck);
    } else {
      await clashNet.submitDecksAndStart(activeRoom.roomCode, activeRoom.plantDeck, selectedCards);
    }
    setCurrentView('MATCH');
  };

  const handleMatchFinished = (winner: Faction) => {
    setMatchWinner(winner);
    setCurrentView('SUMMARY');
  };

  const handleRematch = async () => {
    if (!activeRoom) return;
    await clashNet.requestRematch(activeRoom.roomCode);
    setCurrentView('ROLE_REVEAL');
  };

  const handleExitToMenu = () => {
    setActiveRoom(null);
    setMatchWinner(null);
    setCurrentView('MENU');
  };

  const myFaction: Faction = activeRoom?.roles[myId] || 'PLANTS';
  const opponentId = activeRoom?.guestId && activeRoom.guestId !== myId ? activeRoom.guestId : activeRoom?.hostId;
  const opponentName = (opponentId && activeRoom?.playerNames[opponentId]) || 'Challenger';

  return (
    <div className="bio-clash-app-root">
      {/* 1. Main Menu */}
      {currentView === 'MENU' && (
        <ClashMenu
          onCreateMatch={handleCreateMatch}
          onJoinMatch={handleJoinMatch}
          onPracticeAI={handlePracticeAI}
        />
      )}

      {/* 2. 1v1 Staging Lobby */}
      {currentView === 'LOBBY' && activeRoom && (
        <ClashLobby
          room={activeRoom}
          myId={myId}
          onLeave={handleExitToMenu}
        />
      )}

      {/* 3. Random Role Determination Roulette */}
      {currentView === 'ROLE_REVEAL' && activeRoom && (
        <RoleRollModal
          myFaction={myFaction}
          opponentName={opponentName}
          onFinished={handleRoleRevealFinished}
        />
      )}

      {/* 4. Deck Selection Draft (8 Cards) */}
      {currentView === 'DECK_SELECT' && (
        <DeckSelectModal
          faction={myFaction}
          onDeckConfirmed={handleDeckConfirmed}
        />
      )}

      {/* 5. 5-Lane Battlefield Match */}
      {currentView === 'MATCH' && activeRoom && (
        <ClashGameBoard
          room={activeRoom}
          myId={myId}
          myFaction={myFaction}
          onMatchFinished={handleMatchFinished}
        />
      )}

      {/* 6. Post-Match Summary & Rematch */}
      {currentView === 'SUMMARY' && matchWinner && (
        <MatchSummaryModal
          winner={matchWinner}
          myFaction={myFaction}
          matchDuration={activeRoom?.matchState.matchTime || 120}
          onRematch={handleRematch}
          onExitToMenu={handleExitToMenu}
        />
      )}
    </div>
  );
}

export default App;
