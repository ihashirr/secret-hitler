import { EXECUTIVE_POWERS, PHASES } from '../lib/constants';
import { PHASE_LABELS } from '../phases/config';
import { getInstructions } from './instructionEngine';

const IN_GAME_TIMELINE_STEPS = [
  { key: PHASES.NOMINATION, label: 'Nominate' },
  { key: PHASES.VOTING, label: 'Vote' },
  { key: PHASES.LEGISLATIVE_PRESIDENT, label: 'President' },
  { key: PHASES.LEGISLATIVE_CHANCELLOR, label: 'Chancellor' },
  { key: PHASES.EXECUTIVE_ACTION, label: 'Executive' },
  { key: PHASES.GAME_OVER, label: 'End' },
];

const CONNECT_STAGE = {
  label: 'Connect',
  title: 'Join Or Start A Room',
  description: 'Enter a codename, connect to a room, and keep each player on their own phone.',
  instructions: [
    {
      title: 'Create Or Join',
      description: 'Use a room code to join your table. Every player should stay on a separate device for private information.',
      urgency: 'medium',
      visibility: 'public',
      actions: [{ label: 'Connect to room', action: 'connect-room' }],
    },
  ],
};

const LOADING_STAGE = {
  label: 'Loading',
  title: 'Rejoining The Room',
  description: 'The client is syncing with the live match state before rendering the correct phase.',
  instructions: [
    {
      title: 'Sync In Progress',
      description: 'Wait while the room state, role-safe information, and current instructions are loaded.',
      urgency: 'medium',
      visibility: 'public',
    },
  ],
};

const EMPTY_TIMELINE_STATE = {
  timeline: [],
  timelineVisible: false,
};

const getPlayerName = (gameState, playerId, fallback = 'Unknown') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const isTimelinePhase = (phase) =>
  IN_GAME_TIMELINE_STEPS.some((step) => step.key === phase);

const createStandaloneDirectorState = ({ roomId, stageKey, stage }) => ({
  stageLabel: stage.label,
  stageTitle: stage.title,
  stageDescription: stage.description,
  instructions: stage.instructions,
  publicInstructions: stage.instructions,
  privateInstructions: [],
  primaryInstruction: stage.instructions[0],
  facts: [{ label: 'Room', value: roomId || (stageKey === 'LOADING' ? 'Rejoining' : 'Not connected') }],
  intel: [],
  currentAction: null,
  ...EMPTY_TIMELINE_STATE,
});

const getCurrentAction = (player, gameState) => {
  if (!player || !gameState) return null;
  if (!player.isAlive && gameState.phase !== PHASES.GAME_OVER) return null;

  if (gameState.phase === PHASES.NOMINATION && gameState.amIPresident) return 'NOMINATE';
  if (gameState.phase === PHASES.VOTING && !player.hasVoted) return 'VOTE';
  if (gameState.phase === PHASES.LEGISLATIVE_PRESIDENT && gameState.amIPresident && gameState.drawnCards?.length) {
    return 'DISCARD_POLICY';
  }

  if (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && gameState.amIChancellor && gameState.drawnCards?.length) {
    return gameState.vetoRequested ? 'WAIT_VETO' : 'ENACT_POLICY';
  }

  if (gameState.phase === PHASES.LEGISLATIVE_CHANCELLOR && gameState.amIPresident && gameState.vetoRequested) {
    return 'RESPOND_VETO';
  }

  if (gameState.phase === PHASES.EXECUTIVE_ACTION && gameState.amIPresident) {
    if (gameState.executivePower === EXECUTIVE_POWERS.PEEK) return 'PEEK_POLICIES';
    if (gameState.executivePower === EXECUTIVE_POWERS.INVESTIGATE) return 'INVESTIGATE';
    if (gameState.executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION) return 'SPECIAL_ELECTION';
    if (gameState.executivePower === EXECUTIVE_POWERS.EXECUTION) return 'EXECUTION';
  }

  return null;
};

const getStandaloneDirectorState = (viewKey, roomId) => {
  if (viewKey === 'LOADING') {
    return createStandaloneDirectorState({ roomId, stageKey: 'LOADING', stage: LOADING_STAGE });
  }

  return createStandaloneDirectorState({ roomId, stageKey: 'CONNECT', stage: CONNECT_STAGE });
};

const buildTimeline = (currentKey) => {
  if (!currentKey) {
    return {
      ...EMPTY_TIMELINE_STATE,
      timelinePositionLabel: null,
    };
  }

  const activeIndex = Math.max(
    0,
    IN_GAME_TIMELINE_STEPS.findIndex((step) => step.key === currentKey),
  );

  return {
    timeline: IN_GAME_TIMELINE_STEPS.map((step, index) => ({
      ...step,
      index,
      status: index < activeIndex ? 'complete' : index === activeIndex ? 'current' : 'upcoming',
    })),
    timelineVisible: true,
    timelinePositionLabel: `${activeIndex + 1}/${IN_GAME_TIMELINE_STEPS.length}`,
  };
};

export function buildDirectorState({ roomId, playerId, gameState, viewKey }) {
  if (!gameState) {
    return getStandaloneDirectorState(viewKey, roomId);
  }

  const actualPlayerId = gameState.myPlayerId || playerId;
  const player = gameState.players.find((candidate) => candidate.id === actualPlayerId) || null;
  const stageKey = viewKey === 'LIVE_GAME' ? gameState.phase : viewKey;
  const timelineCurrentKey = isTimelinePhase(stageKey) ? stageKey : null;
  const stageLabel = PHASE_LABELS[gameState.phase] || PHASE_LABELS[stageKey] || stageKey;
  const currentPresidentName = getPlayerName(gameState, gameState.currentPresident, 'Unassigned');
  const currentChancellorName = gameState.currentChancellor
    ? getPlayerName(gameState, gameState.currentChancellor)
    : gameState.nominatedChancellor
      ? getPlayerName(gameState, gameState.nominatedChancellor)
      : 'Open';
  const instructions = player ? getInstructions(player, gameState) : [];
  const publicInstructions = instructions.filter((instruction) => instruction.visibility === 'public');
  const privateInstructions = instructions.filter((instruction) => instruction.visibility === 'private');
  const primaryInstruction =
    privateInstructions.find((instruction) => instruction.urgency === 'high') ||
    publicInstructions.find((instruction) => instruction.urgency === 'high') ||
    privateInstructions[0] ||
    publicInstructions[0] ||
    null;
  const currentAction = getCurrentAction(player, gameState);
  const timelineState = buildTimeline(timelineCurrentKey);
  const intel = [];

  if (player?.role) {
    intel.push({ label: 'Role', value: player.role });
  }

  const knownAllies = gameState.players.filter(
    (candidate) =>
      candidate.id !== player?.id &&
      (candidate.role === 'FASCIST' || candidate.role === 'HITLER'),
  );

  if (knownAllies.length) {
    intel.push({
      label: 'Known allies',
      value: knownAllies.map((candidate) => `${candidate.name} (${candidate.role})`).join(', '),
    });
  }

  if (gameState.peekedPolicies?.length) {
    intel.push({
      label: 'Peeked deck',
      value: gameState.peekedPolicies.join(', '),
    });
  }

  if (gameState.investigationResult) {
    intel.push({
      label: 'Latest investigation',
      value: `${getPlayerName(gameState, gameState.investigationResult.playerId)} is ${gameState.investigationResult.party}`,
    });
  }

  if (gameState.lastGovernment?.presidentId || gameState.lastGovernment?.chancellorId) {
    intel.push({
      label: 'Last government',
      value: `${getPlayerName(gameState, gameState.lastGovernment.presidentId, 'Unknown')} / ${getPlayerName(
        gameState,
        gameState.lastGovernment.chancellorId,
        'Unknown',
      )}`,
    });
  }

  const facts = [
    { label: 'Room', value: gameState.roomId || roomId || 'Unknown' },
    {
      label: timelineState.timelineVisible ? 'Progress' : 'Stage',
      value: timelineState.timelineVisible ? `${timelineState.timelinePositionLabel} ${stageLabel}` : stageLabel,
    },
    { label: 'Liberal track', value: `${gameState.liberalPolicies}/5` },
    { label: 'Fascist track', value: `${gameState.fascistPolicies}/6` },
    { label: 'Election tracker', value: `${gameState.electionTracker}/3` },
    { label: 'Deck', value: `${gameState.drawPileCount}` },
    { label: 'Discard', value: `${gameState.discardPileCount}` },
    { label: 'President', value: currentPresidentName },
    { label: 'Chancellor', value: currentChancellorName },
  ];

  if (gameState.executivePower) {
    facts.push({ label: 'Executive power', value: gameState.executivePower });
  }

  if (gameState.termLimitedPlayerIds?.length) {
    facts.push({
      label: 'Term limits',
      value: gameState.termLimitedPlayerIds
        .map((candidateId) => getPlayerName(gameState, candidateId))
        .join(', '),
    });
  }

  return {
    stageLabel,
    stageTitle: primaryInstruction?.title || stageLabel,
    stageDescription: primaryInstruction?.description || `Current stage: ${stageLabel}.`,
    player,
    instructions,
    publicInstructions,
    privateInstructions,
    primaryInstruction,
    facts,
    intel,
    currentAction,
    ...timelineState,
  };
}
