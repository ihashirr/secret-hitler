import { FACTIONS, ROLES } from '../lib/constants';

const MAX_EVENT_ITEMS = 4;
const MAX_ANALYSIS_ITEMS = 3;
const MAX_LOG_ITEMS = 6;

const stripSystemPrefix = (message = '') => message.replace(/^\[System\]\s*/, '').trim();

const countVotes = (lastVotes) => {
  if (!lastVotes) return null;

  let ja = 0;
  let nein = 0;

  Object.values(lastVotes).forEach((vote) => {
    if (vote === 'YA') ja += 1;
    else nein += 1;
  });

  return { ja, nein, passed: ja > nein };
};

const getPlayerName = (gameState, playerId, fallback = 'unknown') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const getChronologicalLogs = (rawLogs = []) =>
  [...rawLogs]
    .reverse()
    .map((entry) => stripSystemPrefix(entry.message))
    .filter(Boolean);

const getRelevantLogLines = (logs) =>
  logs.filter(
    (message) =>
      message.includes('Chaos triggered') ||
      message.includes('Government veto accepted') ||
      message.includes('President rejected the veto request') ||
      message.includes('Chancellor requested a veto') ||
      message.includes('called a special election') ||
      message.includes('investigated') ||
      message.includes('has been executed') ||
      message.includes('Election passed') ||
      message.includes('Election failed'),
  );

const pushUnique = (items, value) => {
  if (!value || items.includes(value)) return;
  items.push(value);
};

export function getDebriefTagMeta(player, gameState, logs = []) {
  const isLiberalWin = gameState.winner === FACTIONS.LIBERAL;
  const isFinalPresident = player.id === gameState.lastGovernment?.presidentId;
  const isFinalChancellor = player.id === gameState.lastGovernment?.chancellorId;
  const winReason = gameState.winReason?.toLowerCase() || '';
  const wasExecuted = logs.some((message) => message.includes(`${player.name} has been executed.`));
  const hitlerElectionWin =
    gameState.winner === FACTIONS.FASCIST && winReason.includes('hitler was elected chancellor');

  if (player.role === ROLES.HITLER) {
    if (winReason.includes('executed') && wasExecuted) {
      return {
        label: 'Executed Target',
        className: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100',
      };
    }

    if (hitlerElectionWin && isFinalChancellor) {
      return {
        label: 'Triggered Final Vote',
        className: 'border-red-400/25 bg-red-500/10 text-red-100',
      };
    }

    return {
      label: isLiberalWin ? 'Endgame Target' : 'Deceived Everyone',
      className: isLiberalWin ? 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100' : 'border-red-400/25 bg-red-500/10 text-red-100',
    };
  }

  if (player.role === ROLES.FASCIST) {
    if (isFinalPresident || isFinalChancellor) {
      return {
        label: isLiberalWin ? 'Final Suspect' : 'Key Manipulator',
        className: isLiberalWin ? 'border-white/15 bg-white/5 text-white/70' : 'border-red-400/25 bg-red-500/10 text-red-100',
      };
    }

    return {
      label: isLiberalWin ? 'Exposed Cell' : 'Shadow Operator',
      className: isLiberalWin ? 'border-white/15 bg-white/5 text-white/70' : 'border-red-400/25 bg-red-500/10 text-red-100',
    };
  }

  if (!player.isAlive || wasExecuted) {
    return {
      label: 'Fell Under Fire',
      className: 'border-white/15 bg-white/5 text-white/60',
    };
  }

  return {
    label: isLiberalWin ? 'Held The Line' : 'Misread The Table',
    className: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  };
}

export function buildGameDebrief(gameState, rawLogs = []) {
  const chronologicalLogs = getChronologicalLogs(rawLogs);
  const relevantLogLines = getRelevantLogLines(chronologicalLogs);
  const voteSummary = countVotes(gameState?.lastVotes);
  const recentEvents = [];
  const systemAnalysis = [];
  const winReason = gameState?.winReason?.toLowerCase() || '';

  const presidentName = gameState?.lastGovernment?.presidentId
    ? getPlayerName(gameState, gameState.lastGovernment.presidentId)
    : null;
  const chancellorName = gameState?.lastGovernment?.chancellorId
    ? getPlayerName(gameState, gameState.lastGovernment.chancellorId)
    : null;

  if (presidentName || chancellorName) {
    pushUnique(
      recentEvents,
      `President ${presidentName || 'unknown'} backed Chancellor ${chancellorName || 'unknown'} in the final government.`,
    );
  }

  if (voteSummary) {
    pushUnique(recentEvents, `Final vote landed ${voteSummary.ja} Ja to ${voteSummary.nein} Nein.`);
  }

  relevantLogLines.slice(-2).forEach((message) => {
    pushUnique(recentEvents, message);
  });

  pushUnique(recentEvents, gameState?.winReason);

  if (gameState?.winner === FACTIONS.LIBERAL) {
    pushUnique(
      systemAnalysis,
      winReason.includes('executed')
        ? 'Liberals identified Hitler in time and ended the match through execution.'
        : 'Liberals absorbed the late pressure and closed the match before fascists could convert the board.',
    );
  } else {
    pushUnique(
      systemAnalysis,
      winReason.includes('hitler was elected')
        ? 'Hitler stayed credible long enough to take office at the exact danger threshold.'
        : 'Fascists converted board pressure into a finish before the table could recover.',
    );
  }

  if (chronologicalLogs.some((message) => message.includes('Chaos triggered'))) {
    pushUnique(systemAnalysis, 'Chaos took control of one late turn, which means table consensus had already collapsed.');
  }

  if (chronologicalLogs.some((message) => message.includes('Government veto accepted') || message.includes('President rejected the veto request'))) {
    pushUnique(systemAnalysis, 'Veto pressure entered the late game, forcing a public read on whether the government could be trusted.');
  }

  if (chronologicalLogs.some((message) => message.includes('called a special election'))) {
    pushUnique(systemAnalysis, 'A special election broke the normal presidency order and changed the endgame tempo.');
  } else if (chronologicalLogs.some((message) => message.includes('investigated'))) {
    pushUnique(systemAnalysis, 'Executive intel entered the table talk, but the room still had to decide who to trust.');
  } else if (voteSummary?.passed) {
    pushUnique(systemAnalysis, `The deciding government passed ${voteSummary.ja}-${voteSummary.nein}, leaving no recovery window.`);
  }

  if (
    systemAnalysis.length < MAX_ANALYSIS_ITEMS &&
    (gameState?.fascistPolicies >= 4 || gameState?.liberalPolicies >= 4)
  ) {
    pushUnique(systemAnalysis, 'Late-board pressure forced sharper reads and riskier nominations than the early game.');
  }

  return {
    voteSummary,
    recentEvents: recentEvents.slice(0, MAX_EVENT_ITEMS),
    systemAnalysis: systemAnalysis.slice(0, MAX_ANALYSIS_ITEMS),
    chronologicalLogs: chronologicalLogs.slice(-MAX_LOG_ITEMS),
  };
}
