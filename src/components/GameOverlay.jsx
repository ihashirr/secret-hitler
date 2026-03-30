import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EXECUTIVE_POWERS, PHASES } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';
import StoryBeatCard from './StoryBeatCard';
import { getAvatarId, POLICY_CARD_ASSETS } from '../features/game-board/boardConfig';

const getPlayerById = (gameState, playerId) =>
  gameState.players.find((player) => player.id === playerId) || null;

const getVoteAsset = (vote) => (vote === 'YA' ? '/assets/vote-yes.png' : '/assets/vote-no.png');

function PortraitCard({ player, label, accent = 'neutral', highlight = false }) {
  const accentClassName =
    accent === 'gold'
      ? 'border-[#d4af37]/40 bg-[#fff2c2]'
      : accent === 'blue'
        ? 'border-cyan-300/28 bg-[linear-gradient(180deg,rgba(9,22,30,0.96)_0%,rgba(6,14,22,0.94)_100%)]'
        : accent === 'red'
          ? 'border-red-300/24 bg-[linear-gradient(180deg,rgba(30,13,14,0.96)_0%,rgba(22,10,11,0.94)_100%)]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(15,15,18,0.96)_0%,rgba(11,11,14,0.94)_100%)]';
  const textClassName =
    accent === 'gold'
      ? 'text-[#2c2410]'
      : highlight
        ? 'text-white'
        : 'text-white/88';

  return (
    <div className={`relative w-[112px] shrink-0 overflow-hidden rounded-[24px] border px-3 pb-3 pt-2 shadow-[0_20px_42px_rgba(0,0,0,0.24)] ${accentClassName}`}>
      <div className="absolute inset-0 paper-grain opacity-[0.08] pointer-events-none" />
      <div className={`text-[8px] font-mono font-black uppercase tracking-[0.22em] ${accent === 'gold' ? 'text-[#2c2410]/70' : 'text-white/48'}`}>
        {label}
      </div>
      <div className={`relative mt-2 flex h-[92px] items-end justify-center overflow-hidden rounded-[18px] border ${accent === 'gold' ? 'border-[#2c2410]/10 bg-[#f6e7b3]' : 'border-white/10 bg-white/[0.06]'}`}>
        {player ? (
          <img
            src={`/assets/avatars/avatar_${getAvatarId(player)}.png`}
            alt={player.name}
            loading="eager"
            decoding="async"
            className={`h-full w-full object-cover ${accent === 'gold' ? 'opacity-90' : 'opacity-78 grayscale-[0.08]'}`}
          />
        ) : (
          <div className={`h-full w-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_58%,transparent_100%)] ${accent === 'gold' ? 'opacity-60' : 'opacity-40'}`} />
        )}
      </div>
      <div className={`mt-2 truncate text-center text-[10px] font-black uppercase tracking-[0.08em] ${textClassName}`}>
        {player?.name || 'Unknown'}
      </div>
    </div>
  );
}

function PolicyStackVisual({ count = 3 }) {
  return (
    <div className="relative h-[150px] w-[136px]">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="absolute left-1/2 top-1/2 h-[110px] w-[82px] rounded-[18px] border border-[#e8d6a4]/18 bg-[linear-gradient(180deg,#d9bc80_0%,#caa66a_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
          style={{
            transform: `translate(-50%, -50%) translate(${(index - 1) * 14}px, ${index * 8}px) rotate(${(index - 1) * 6}deg)`,
            zIndex: index + 1,
          }}
        >
          <div className="absolute inset-[10px] rounded-[12px] border border-[#7b613c]/14 bg-[linear-gradient(180deg,#f7ecd2_0%,#efe0bc_100%)]" />
          <div className="absolute inset-x-[18px] top-[24px] h-[10px] rounded-full bg-[#5e4a2f]/14" />
          <div className="absolute inset-x-[18px] top-[46px] h-[7px] rounded-full bg-[#5e4a2f]/10" />
          <div className="absolute inset-x-[18px] top-[60px] h-[7px] rounded-full bg-[#5e4a2f]/10" />
        </div>
      ))}
    </div>
  );
}

function VoteChoiceButton({ vote, isSelected, disabled, onClick }) {
  const isYes = vote === 'YA';

  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      className={`group relative flex min-h-[168px] flex-col items-center justify-center rounded-[28px] border px-4 py-5 transition-colors ${
        isSelected
          ? isYes
            ? 'border-cyan-300 bg-cyan-300/10'
            : 'border-red-400 bg-red-500/10'
          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
      } ${disabled ? 'opacity-55 cursor-wait' : ''}`}
    >
      <div className="absolute inset-0 paper-grain opacity-[0.08] pointer-events-none" />
      <img
        src={getVoteAsset(vote)}
        alt={vote === 'YA' ? 'Ja' : 'Nein'}
        loading="eager"
        decoding="async"
        className={`w-full max-w-[132px] transition-transform duration-200 ${isSelected ? 'scale-[1.03]' : 'group-hover:scale-[1.02]'}`}
      />
      <span className={`mt-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] ${isSelected ? (isYes ? 'text-cyan-100' : 'text-red-100') : 'text-white/46'}`}>
        {isYes ? 'Approve' : 'Reject'}
      </span>
    </motion.button>
  );
}

function PolicyChoiceButton({ card, label, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group flex flex-col items-center"
    >
      <img
        src={POLICY_CARD_ASSETS[card]}
        alt={card}
        loading="eager"
        decoding="async"
        className="w-[90px] rounded-[22px] border border-black/10 shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 group-hover:scale-[1.02] sm:w-[102px]"
      />
      <span className="mt-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/46">
        {label}
      </span>
    </motion.button>
  );
}

function PolicyPreviewCard({ card, label }) {
  return (
    <div className="flex flex-col items-center">
      <img
        src={POLICY_CARD_ASSETS[card]}
        alt={card}
        loading="eager"
        decoding="async"
        className="w-[90px] rounded-[22px] border border-black/10 shadow-[0_14px_30px_rgba(0,0,0,0.18)] sm:w-[102px]"
      />
      <span className="mt-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/46">
        {label}
      </span>
    </div>
  );
}

function StoryActionButton({ children, tone = 'neutral', onClick, disabled = false }) {
  const toneClassName =
    tone === 'red'
      ? 'border-[#c4513f] bg-[#d4572c] text-white hover:bg-[#c74922]'
      : tone === 'blue'
        ? 'border-cyan-300/24 bg-[#2b5c8f] text-white hover:bg-[#224d77]'
        : 'border-[#d4c098]/24 bg-[#b79b8a] text-white hover:bg-[#a88d7e]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[18px] border px-5 py-3 text-[11px] font-mono font-black uppercase tracking-[0.2em] transition-colors active:scale-[0.98] ${toneClassName} ${disabled ? 'cursor-wait opacity-60' : ''}`}
    >
      {children}
    </button>
  );
}

export default function GameOverlay({
  gameState,
  playerId,
  pendingSelection,
  majorPublicBeat = null,
  voteRevealState = null,
  canShowPrivateDrawer = true,
  onConfirm,
  onCancel,
  onVote,
  onDiscard,
  onRequestVeto,
  onRespondVeto,
  onEnact,
  onAcknowledgePeek,
}) {
  const myActualId = gameState?.myPlayerId || playerId;
  const isPresident = gameState.amIPresident || myActualId === gameState.currentPresident;
  const isChancellor = gameState.amIChancellor || myActualId === gameState.currentChancellor;
  const me = getPlayerById(gameState, myActualId);
  const currentPresident = getPlayerById(gameState, gameState.currentPresident);
  const currentChancellor = getPlayerById(
    gameState,
    gameState.currentChancellor || gameState.nominatedChancellor,
  );
  const displayPhase = gameState.phase;
  const currentBallotKey = `${gameState.phase}:${gameState.currentPresident || 'none'}:${gameState.nominatedChancellor || gameState.currentChancellor || 'none'}`;
  const [selectedVote, setSelectedVote] = useState(null);
  const [pendingVote, setPendingVote] = useState(null);

  useEffect(() => {
    ['/assets/vote-yes.png', '/assets/vote-no.png', POLICY_CARD_ASSETS.LIBERAL, POLICY_CARD_ASSETS.FASCIST]
      .forEach((src) => {
        const image = new window.Image();
        image.src = src;
      });
  }, []);

  const activeSelectedVote =
    displayPhase === PHASES.VOTING &&
    selectedVote?.ballotKey === currentBallotKey &&
    !me?.hasVoted
      ? selectedVote.vote
      : null;
  const lockedVote =
    displayPhase === PHASES.VOTING && pendingVote?.ballotKey === currentBallotKey
      ? pendingVote.vote
      : null;
  const voteSubmitting = Boolean(lockedVote) && !me?.hasVoted;
  const voteLocked = Boolean(me?.hasVoted) || voteSubmitting;
  const currentVoteVisual = lockedVote || activeSelectedVote || null;

  const handleVoteSelection = (vote) => {
    if (voteSubmitting || me?.hasVoted) return;
    triggerHaptic('selection');
    setSelectedVote({ ballotKey: currentBallotKey, vote });
  };

  const handleVoteSubmit = async () => {
    if (!activeSelectedVote || voteSubmitting || me?.hasVoted) return;

    triggerHaptic('confirm');
    setPendingVote({ ballotKey: currentBallotKey, vote: activeSelectedVote });
    setSelectedVote(null);

    try {
      await onVote(activeSelectedVote === 'YA');
    } catch {
      setPendingVote(null);
      setSelectedVote({ ballotKey: currentBallotKey, vote: activeSelectedVote });
    }
  };

  const runWithHaptic = (action, kind = 'selection') => () => {
    triggerHaptic(kind);
    return action();
  };

  const buildBeatVisual = (beat) => {
    switch (beat.kind) {
      case 'nomination-locked':
        return (
          <div className="flex items-center justify-center gap-4">
            <PortraitCard player={getPlayerById(gameState, beat.actorId)} label="President" accent="gold" />
            <div className="text-3xl font-black uppercase tracking-[0.18em] text-white/38">→</div>
            <PortraitCard player={getPlayerById(gameState, beat.subjectId)} label="Chancellor" accent="blue" highlight />
          </div>
        );
      case 'policy-president':
        return (
          <div className="flex items-center justify-center gap-4">
            <PortraitCard player={getPlayerById(gameState, beat.actorId)} label="President" accent="gold" />
            <PolicyStackVisual count={3} />
          </div>
        );
      case 'policy-chancellor':
        return (
          <div className="flex items-center justify-center gap-4">
            <PortraitCard player={getPlayerById(gameState, beat.actorId)} label="Chancellor" accent="blue" highlight />
            <PolicyStackVisual count={2} />
          </div>
        );
      case 'policy-enacted':
        return (
          <img
            src={POLICY_CARD_ASSETS[beat.policyType]}
            alt={beat.policyType}
            loading="eager"
            decoding="async"
            className="w-[164px] rounded-[26px] border border-black/10 shadow-[0_20px_44px_rgba(0,0,0,0.24)]"
          />
        );
      case 'veto-request':
        return (
          <div className="flex items-center justify-center gap-4">
            <PortraitCard player={getPlayerById(gameState, beat.actorId)} label="Chancellor" accent="red" />
            <div className="text-2xl font-black uppercase tracking-[0.16em] text-white/34">VETO</div>
            <PortraitCard player={getPlayerById(gameState, beat.subjectId)} label="President" accent="gold" />
          </div>
        );
      case 'execution':
        return (
          <div className="flex items-center justify-center gap-4">
            <PortraitCard player={getPlayerById(gameState, beat.actorId)} label="President" accent="gold" />
            <div className="rounded-[22px] border border-red-300/18 bg-red-500/10 px-6 py-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="text-[10px] font-mono font-black uppercase tracking-[0.22em] text-red-100/82">
                Execution Order
              </div>
              <div className="mt-3 text-4xl font-black uppercase tracking-[0.16em] text-red-100">
                1 Target
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  let storyCard = null;

  if (majorPublicBeat) {
    storyCard = (
      <StoryBeatCard
        cardKey={majorPublicBeat.key}
        stageLabel={majorPublicBeat.stageLabel}
        title={majorPublicBeat.title}
        description={majorPublicBeat.description}
        tone={majorPublicBeat.tone}
        chips={['Table']}
        visual={buildBeatVisual(majorPublicBeat)}
      />
    );
  } else if (voteRevealState?.revealStage === 0 && voteRevealState?.revealState) {
    const revealState = voteRevealState.revealState;
    const isApproved = revealState.result === 'APPROVED';
    storyCard = (
      <StoryBeatCard
        cardKey={`vote-result-intro:${voteRevealState.revealId}`}
        stageLabel="Vote Result"
        title={isApproved ? 'Government Elected' : 'Vote Failed'}
        description={
          isApproved
            ? `${currentPresident?.name || 'The President'} and ${currentChancellor?.name || 'the nominee'} have enough support.`
            : 'The government was rejected. The table now resolves each ballot in order.'
        }
        tone={isApproved ? 'blue' : 'red'}
        chips={[`${revealState.ya} Ja`, `${revealState.nein} Nein`]}
        visual={(
          <div className="grid w-full max-w-[18rem] grid-cols-2 gap-4">
            <div className="rounded-[24px] border border-cyan-300/18 bg-cyan-300/8 p-3 text-center">
              <img src="/assets/vote-yes.png" alt="Ja" loading="eager" decoding="async" className="mx-auto w-full max-w-[110px]" />
              <div className="mt-2 text-xl font-black uppercase tracking-[0.12em] text-cyan-100">{revealState.ya}</div>
            </div>
            <div className="rounded-[24px] border border-red-300/18 bg-red-500/8 p-3 text-center">
              <img src="/assets/vote-no.png" alt="Nein" loading="eager" decoding="async" className="mx-auto w-full max-w-[110px]" />
              <div className="mt-2 text-xl font-black uppercase tracking-[0.12em] text-red-100">{revealState.nein}</div>
            </div>
          </div>
        )}
        footer="The ring reveals each ballot next."
      />
    );
  } else if (pendingSelection) {
    storyCard = (
      <StoryBeatCard
        cardKey={`selection:${pendingSelection.type}:${pendingSelection.id}`}
        stageLabel="Confirm Action"
        title={
          pendingSelection.type === 'NOMINATE'
            ? 'Confirm Nomination'
            : pendingSelection.type === 'KILL'
              ? 'Confirm Elimination'
              : pendingSelection.type === 'INVESTIGATE'
                ? 'Confirm Investigation'
                : 'Confirm Special Election'
        }
        description={
          pendingSelection.type === 'NOMINATE'
            ? `${pendingSelection.name} will become the proposed chancellor.`
            : pendingSelection.type === 'KILL'
              ? `${pendingSelection.name} will be removed from the table.`
              : pendingSelection.type === 'INVESTIGATE'
                ? `You will privately learn ${pendingSelection.name}'s party membership.`
                : `${pendingSelection.name} will take the next presidency for one round.`
        }
        tone={pendingSelection.type === 'KILL' ? 'red' : 'neutral'}
        chips={['Private']}
        visual={<PortraitCard player={pendingSelection} label="Target" accent={pendingSelection.type === 'KILL' ? 'red' : 'neutral'} highlight />}
        actions={(
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StoryActionButton tone={pendingSelection.type === 'KILL' ? 'red' : 'blue'} onClick={runWithHaptic(onConfirm, 'confirm')}>
              Confirm
            </StoryActionButton>
            <StoryActionButton onClick={runWithHaptic(onCancel, 'soft')}>
              Cancel
            </StoryActionButton>
          </div>
        )}
      />
    );
  } else if (displayPhase === PHASES.VOTING && me?.isAlive && canShowPrivateDrawer) {
    storyCard = (
      <StoryBeatCard
        cardKey={`vote-card:${currentBallotKey}:${voteLocked ? 'locked' : 'open'}`}
        stageLabel="Voting"
        title={voteLocked ? 'Ballot Locked' : 'Cast Your Vote'}
        description={
          voteLocked
            ? `Your ballot is locked for ${currentPresident?.name || 'the President'} and ${currentChancellor?.name || 'the nominee'}.`
            : `${currentPresident?.name || 'The President'} nominated ${currentChancellor?.name || 'a Chancellor'}. Choose whether this government should proceed.`
        }
        tone={voteLocked ? (lockedVote === 'NEIN' ? 'red' : 'blue') : 'neutral'}
        chips={['Your Ballot']}
        visual={<PortraitCard player={currentChancellor} label="Nominee" accent="blue" highlight />}
        actions={voteLocked ? (
          <div className="flex flex-col items-center gap-4">
            {currentVoteVisual ? (
              <img
                src={getVoteAsset(currentVoteVisual)}
                alt={currentVoteVisual === 'YA' ? 'Ja' : 'Nein'}
                loading="eager"
                decoding="async"
                className="w-full max-w-[180px]"
              />
            ) : null}
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.18em] text-white/46">
              {voteSubmitting ? 'Submitting ballot…' : 'Waiting for the rest of the table'}
            </div>
          </div>
        ) : (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="grid w-full grid-cols-2 gap-4">
              <VoteChoiceButton
                vote="YA"
                isSelected={activeSelectedVote === 'YA'}
                disabled={voteSubmitting}
                onClick={() => handleVoteSelection('YA')}
              />
              <VoteChoiceButton
                vote="NEIN"
                isSelected={activeSelectedVote === 'NEIN'}
                disabled={voteSubmitting}
                onClick={() => handleVoteSelection('NEIN')}
              />
            </div>
            <StoryActionButton
              tone={activeSelectedVote === 'NEIN' ? 'red' : 'blue'}
              onClick={handleVoteSubmit}
              disabled={!activeSelectedVote || voteSubmitting}
            >
              {voteSubmitting ? 'Submitting…' : 'Confirm Vote'}
            </StoryActionButton>
          </div>
        )}
        footer={voteLocked ? 'Watch the table resolve the remaining ballots.' : 'Choose a card, then confirm the ballot.'}
      />
    );
  } else if (displayPhase === PHASES.LEGISLATIVE_PRESIDENT && isPresident && gameState.drawnCards?.length && canShowPrivateDrawer) {
    storyCard = (
      <StoryBeatCard
        cardKey={`president-hand:${(gameState.drawnCards || []).join('-')}:${gameState.drawPileCount}`}
        stageLabel="President Review"
        title="Discard One Policy"
        description="Choose one policy to discard. The remaining two will be passed to the Chancellor."
        tone="neutral"
        chips={['President Only']}
        visual={<PortraitCard player={currentPresident} label="President" accent="gold" />}
        actions={(
          <div className="flex flex-wrap items-center justify-center gap-3">
            {gameState.drawnCards.map((card, index) => (
              <PolicyChoiceButton
                key={`${card}-${index}`}
                card={card}
                label="Discard"
                onClick={runWithHaptic(() => onDiscard(index))}
              />
            ))}
          </div>
        )}
      />
    );
  } else if (displayPhase === PHASES.LEGISLATIVE_CHANCELLOR && isPresident && gameState.vetoRequested && canShowPrivateDrawer) {
    storyCard = (
      <StoryBeatCard
        cardKey={`veto-response:${gameState.currentPresident || 'none'}:${gameState.currentChancellor || gameState.nominatedChancellor || 'none'}`}
        stageLabel="Veto Decision"
        title="Respond To Veto"
        description={`${currentChancellor?.name || 'The Chancellor'} asked to discard both policies. Accept or reject the veto.`}
        tone="red"
        chips={['President Only']}
        visual={(
          <div className="flex items-center justify-center gap-4">
            <PortraitCard player={currentPresident} label="President" accent="gold" />
            <div className="text-2xl font-black uppercase tracking-[0.16em] text-white/34">VETO</div>
            <PortraitCard player={currentChancellor} label="Chancellor" accent="red" />
          </div>
        )}
        actions={(
          <div className="flex flex-wrap items-center justify-center gap-3">
            <StoryActionButton tone="blue" onClick={runWithHaptic(() => onRespondVeto(true), 'confirm')}>
              Accept Veto
            </StoryActionButton>
            <StoryActionButton tone="red" onClick={runWithHaptic(() => onRespondVeto(false), 'warning')}>
              Reject
            </StoryActionButton>
          </div>
        )}
      />
    );
  } else if (displayPhase === PHASES.LEGISLATIVE_CHANCELLOR && isChancellor && gameState.drawnCards?.length && !gameState.vetoRequested && canShowPrivateDrawer) {
    storyCard = (
      <StoryBeatCard
        cardKey={`chancellor-hand:${(gameState.drawnCards || []).join('-')}:${gameState.vetoRequested ? 'veto' : 'live'}`}
        stageLabel="Chancellor Decision"
        title={gameState.vetoRejected ? 'Veto Rejected' : 'Enact One Policy'}
        description={
          gameState.vetoRejected
            ? 'The President rejected the veto. You must enact one of the remaining policies.'
            : 'Choose the final policy that will be enacted.'
        }
        tone="neutral"
        chips={['Chancellor Only']}
        visual={<PortraitCard player={currentChancellor} label="Chancellor" accent="blue" highlight />}
        actions={(
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {gameState.drawnCards.map((card, index) => (
                <PolicyChoiceButton
                  key={`${card}-${index}`}
                  card={card}
                  label="Enact"
                  onClick={runWithHaptic(() => onEnact(index), 'confirm')}
                />
              ))}
            </div>
            {gameState.vetoAvailable && !gameState.vetoRejected && (
              <StoryActionButton tone="red" onClick={runWithHaptic(onRequestVeto, 'warning')}>
                Request Veto
              </StoryActionButton>
            )}
          </div>
        )}
      />
    );
  } else if (
    displayPhase === PHASES.EXECUTIVE_ACTION &&
    isPresident &&
    gameState.executivePower === EXECUTIVE_POWERS.PEEK &&
    gameState.peekedPolicies?.length &&
    canShowPrivateDrawer
  ) {
    storyCard = (
      <StoryBeatCard
        cardKey={`peek:${(gameState.peekedPolicies || []).join('-')}:${gameState.drawPileCount}`}
        stageLabel="Policy Peek"
        title="Review Top Policies"
        description="These are the next three policies in order. They remain in the deck."
        tone="neutral"
        chips={['President Only']}
        visual={<PortraitCard player={currentPresident} label="President" accent="gold" />}
        actions={(
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {gameState.peekedPolicies.map((card, index) => (
                <PolicyPreviewCard
                  key={`${card}-${index}`}
                  card={card}
                  label={`Top ${index + 1}`}
                />
              ))}
            </div>
            <StoryActionButton tone="blue" onClick={runWithHaptic(onAcknowledgePeek, 'selection')}>
              Continue
            </StoryActionButton>
          </div>
        )}
      />
    );
  }

  if (!storyCard) return null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {storyCard}
    </AnimatePresence>
  );
}
