"use client";

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../backend/convex/_generated/api";
import GlobalControls from '../components/GlobalControls';
import MobileModeGate from '../components/MobileModeGate';
import StageInfoButton from '../components/StageInfoButton';
import StageInfoOverlay from '../components/StageInfoOverlay';
import { buildDirectorState } from '../engine/gameEngine';
import useMobileAccessState from '../lib/useMobileAccessState';
import useViewportShell from '../lib/useViewportShell';
import PhaseRouter from '../phases/PhaseRouter';
import { getPhaseViewKey } from '../phases/config';

const STORAGE_KEYS = {
  roomId: 'eclipse_roomId',
  playerId: 'eclipse_playerId',
};

export default function App() {
  useViewportShell();

  const [mounted, setMounted] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [showStageInfo, setShowStageInfo] = useState(false);
  const mobileAccess = useMobileAccessState();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room')?.toUpperCase().slice(0, 4) || '';
      const urlPlayer = params.get('player') || null;
      const savedRoom =
        sessionStorage.getItem(STORAGE_KEYS.roomId) ||
        localStorage.getItem(STORAGE_KEYS.roomId) ||
        urlRoom ||
        '';
      const savedPlayer =
        sessionStorage.getItem(STORAGE_KEYS.playerId) ||
        localStorage.getItem(STORAGE_KEYS.playerId) ||
        urlPlayer;

      if (savedRoom) {
        sessionStorage.setItem(STORAGE_KEYS.roomId, savedRoom);
        localStorage.setItem(STORAGE_KEYS.roomId, savedRoom);
      }

      if (savedPlayer) {
        sessionStorage.setItem(STORAGE_KEYS.playerId, savedPlayer);
        localStorage.setItem(STORAGE_KEYS.playerId, savedPlayer);
      }

      if (urlPlayer) {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('player');
        cleanParams.delete('resume');
        const nextSearch = cleanParams.toString();
        window.history.replaceState(null, '', nextSearch ? `/?${nextSearch}` : '/');
      }

      setMounted(true);
      setRoomId(savedRoom);
      setPlayerId(savedPlayer);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const gameState = useQuery(api.game.getGameState, roomId ? { roomId, playerId } : "skip");

  const joinRoom = useMutation(api.game.joinRoom);
  const startGame = useMutation(api.game.startGame);
  const toggleReady = useMutation(api.game.toggleReady);
  const nominateChancellor = useMutation(api.game.nominateChancellor);
  const submitVote = useMutation(api.game.castVote);
  const presidentDiscard = useMutation(api.game.presidentDrawPolicies);
  const requestVeto = useMutation(api.game.requestVeto);
  const respondVeto = useMutation(api.game.respondVeto);
  const chancellorEnact = useMutation(api.game.chancellorEnactPolicy);
  const leaveRoom = useMutation(api.game.leaveRoom);
  const resetRoom = useMutation(api.game.resetRoom);
  const wipeAllData = useMutation(api.game.wipeAllData);
  const investigateLoyalty = useMutation(api.game.investigateLoyalty);
  const callSpecialElection = useMutation(api.game.callSpecialElection);
  const completePolicyPeek = useMutation(api.game.completePolicyPeek);
  const killPlayer = useMutation(api.game.killPlayer);
  const addBot = useMutation(api.game.addBot);

  // Prevent hydration mismatch: render nothing until client-side state is ready
  if (!mounted) return null;

  const handleConnect = async (name, rId, avatarId) => {
    const result = await joinRoom({ roomId: rId, name, avatarId });

    if (result.success) {
      setRoomId(rId);
      setPlayerId(result.playerId);
      sessionStorage.setItem(STORAGE_KEYS.roomId, rId);
      sessionStorage.setItem(STORAGE_KEYS.playerId, result.playerId);
      localStorage.setItem(STORAGE_KEYS.roomId, rId);
      localStorage.setItem(STORAGE_KEYS.playerId, result.playerId);
      return;
    }

    throw new Error(result.error);
  };

  const handleExit = async () => {
    if (roomId && playerId) {
      await leaveRoom({ roomId, playerId });
    }
    setShowStageInfo(false);
    sessionStorage.removeItem(STORAGE_KEYS.roomId);
    sessionStorage.removeItem(STORAGE_KEYS.playerId);
    localStorage.removeItem(STORAGE_KEYS.roomId);
    localStorage.removeItem(STORAGE_KEYS.playerId);
    setRoomId('');
    setPlayerId(null);
    if (window.location.search) {
      window.history.replaceState(null, '', '/');
    }
  };

  const viewKey = getPhaseViewKey({ roomId, gameState, playerId });
  const directorState = buildDirectorState({ roomId, playerId, gameState, viewKey });
  const showGlobalControls = viewKey !== 'CONNECT' && viewKey !== 'LOADING';
  const mobileGateActive = viewKey !== 'LOADING';
  const installResumeUrl =
    typeof window !== 'undefined' && roomId && playerId
      ? `${window.location.origin}/?room=${encodeURIComponent(roomId)}&player=${encodeURIComponent(playerId)}&resume=1`
      : null;
  const shouldRenderOnlyGate =
    mobileAccess.isReady &&
    mobileGateActive &&
    mobileAccess.isMobile &&
    !mobileAccess.gateSatisfied;

  if (!mobileAccess.isReady) {
    return <div className="h-[var(--app-vh)] bg-obsidian-950" />;
  }

  if (shouldRenderOnlyGate) {
    return (
      <div className="relative flex h-[var(--app-vh)] min-h-0 flex-col overflow-hidden bg-obsidian-950 text-white">
        <MobileModeGate
          active
          viewKey={viewKey}
          onExitToConnect={handleExit}
          accessState={mobileAccess}
          installResumeUrl={installResumeUrl}
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-[var(--app-vh)] min-h-0 flex-col overflow-hidden bg-obsidian-950 text-white">
      {showGlobalControls && (
        <GlobalControls 
          gameState={gameState} 
          playerId={playerId} 
          directorState={directorState}
          infoOpen={showStageInfo}
          onOpenInfo={() => setShowStageInfo(true)}
          onReset={async () => {
            await resetRoom({ roomId });
            handleExit();
          }}
          onWipe={async () => {
            await wipeAllData();
            sessionStorage.clear();
            localStorage.removeItem(STORAGE_KEYS.roomId);
            localStorage.removeItem(STORAGE_KEYS.playerId);
            window.location.href = '/';
          }}
          onExit={handleExit}
        />
      )}

      {!showGlobalControls && (
        <StageInfoButton
          floating
          active={showStageInfo}
          label={viewKey === 'CONNECT' ? 'How To Play' : 'Guide'}
          onClick={() => setShowStageInfo(true)}
        />
      )}

      <StageInfoOverlay
        open={showStageInfo}
        onClose={() => setShowStageInfo(false)}
        directorState={directorState}
      />

      <div className="relative min-h-0 flex-1">
        <PhaseRouter
          viewKey={viewKey}
          gameState={gameState}
          playerId={playerId}
          directorState={directorState}
          actions={{
            onConnect: handleConnect,
            onStart: () => startGame({ roomId }),
            onAddBot: () => addBot({ roomId, playerId }),
            onReplay: handleExit,
            onReady: () => toggleReady({ roomId, playerId }),
            onNominate: (id) => nominateChancellor({ roomId, presidentId: playerId, chancellorId: id }),
            onVote: (approve) => submitVote({ roomId, playerId, vote: approve ? "YA" : "NEIN" }),
            onDiscard: (index) => presidentDiscard({ roomId, presidentId: playerId, discardedIndex: index }),
            onRequestVeto: () => requestVeto({ roomId, chancellorId: playerId }),
            onRespondVeto: (accept) => respondVeto({ roomId, presidentId: playerId, accept }),
            onEnact: (index) => chancellorEnact({ roomId, chancellorId: playerId, enactedIndex: index }),
            onInvestigate: (targetPlayerId) => investigateLoyalty({ roomId, presidentId: playerId, targetPlayerId }),
            onSpecialElection: (targetPlayerId) => callSpecialElection({ roomId, presidentId: playerId, targetPlayerId }),
            onAcknowledgePeek: () => completePolicyPeek({ roomId, presidentId: playerId }),
            onKill: (targetPlayerId) => killPlayer({ roomId, presidentId: playerId, targetPlayerId }),
          }}
        />
      </div>
    </div>
  );
}
