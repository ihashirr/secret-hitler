import { EXECUTIVE_POWERS, FACTIONS, PHASES, ROLES } from '../lib/constants';

const createInstruction = (title, description, urgency, visibility, actions = []) => ({
  title,
  description,
  urgency,
  visibility,
  ...(actions.length ? { actions } : {}),
});

const getPlayerName = (gameState, playerId, fallback = 'Unknown') =>
  gameState?.players?.find((player) => player.id === playerId)?.name || fallback;

const getKnownAllies = (player, gameState) =>
  gameState.players.filter(
    (candidate) =>
      candidate.id !== player?.id &&
      (candidate.role === ROLES.FASCIST || candidate.role === ROLES.HITLER),
  );

export function getInstructions(player, gameState) {
  if (!player || !gameState) return [];

  const instructions = [];
  const isAlive = player.isAlive !== false;
  const isPresident = Boolean(gameState.amIPresident);
  const isChancellor = Boolean(gameState.amIChancellor);
  const currentPresidentName = getPlayerName(gameState, gameState.currentPresident, 'The President');
  const currentChancellorName = getPlayerName(
    gameState,
    gameState.currentChancellor || gameState.nominatedChancellor,
    'the nominee',
  );
  const eligibleNames = (gameState.eligibleChancellorIds || []).map((id) => getPlayerName(gameState, id));
  const knownAllies = getKnownAllies(player, gameState);

  if (gameState.chaosTriggered && gameState.chaosPolicy) {
    instructions.push(
      createInstruction(
        'Chaos Triggered',
        `Three failed governments forced the top policy to auto-enact as ${gameState.chaosPolicy.toLowerCase()}. Term limits are now cleared.`,
        'high',
        'public',
      ),
    );
  }

  if (!isAlive && gameState.phase !== PHASES.GAME_OVER) {
    instructions.push(
      createInstruction(
        'Observer Status',
        'You have been eliminated. Stay with the table, but you no longer vote, hold office, or use private actions.',
        'medium',
        'private',
      ),
    );
  }

  switch (gameState.phase) {
    case PHASES.LOBBY:
      if (player.isHost) {
        instructions.push(
          createInstruction(
            'Assemble The Table',
            gameState.players.length >= 5
              ? 'You can start once the room is ready. Add bots only if you need to fill open seats.'
              : `You need ${Math.max(0, 5 - gameState.players.length)} more players before the match can begin.`,
            'medium',
            'private',
            [
              { label: 'Share room code', action: 'share-room' },
              { label: 'Start when ready', action: 'start-match' },
            ],
          ),
        );
      } else {
        instructions.push(
          createInstruction(
            'Wait For Start',
            'Stay ready. The host will start once the table is full enough.',
            'low',
            'public',
          ),
        );
      }
      break;

    case PHASES.ROLE_REVEAL:
      if (player.role === ROLES.LIBERAL) {
        instructions.push(
          createInstruction(
            'You Are A Liberal',
            'Find the fascists, build trust carefully, and protect the government until five liberal policies are secured or Hitler is killed.',
            'high',
            'private',
            [{ label: 'Shield screen first', action: 'shield-screen' }],
          ),
        );
      } else if (player.role === ROLES.FASCIST) {
        instructions.push(
          createInstruction(
            'You Are A Fascist',
            knownAllies.length
              ? `Coordinate silently with ${knownAllies.map((ally) => ally.name).join(', ')} and keep Hitler safe.`
              : 'Coordinate silently and protect Hitler while staying believable.',
            'high',
            'private',
          ),
        );
      } else if (player.role === ROLES.HITLER) {
        instructions.push(
          createInstruction(
            'You Are Hitler',
            knownAllies.length
              ? `Stay deniable while your fascist ally ${knownAllies.map((ally) => ally.name).join(', ')} nudges the table.`
              : 'Stay hidden, gain trust, and avoid looking like the fascist focal point.',
            'high',
            'private',
          ),
        );
      }

      instructions.push(
        createInstruction(
          'Private Briefing',
          'Read your role, shield your screen, and confirm only after you are done.',
          'medium',
          'public',
        ),
      );
      break;

    case PHASES.NOMINATION:
      if (isPresident) {
        instructions.push(
          createInstruction(
            'You Are Nominating',
            eligibleNames.length
              ? `Choose from eligible players: ${eligibleNames.join(', ')}. Avoid term-limited players and set up a government you can defend.`
              : 'Select an eligible chancellor from the operative dock.',
            'high',
            'private',
            [{ label: 'Nominate candidate', action: 'nominate-chancellor' }],
          ),
        );
      } else {
        instructions.push(
          createInstruction(
            `${currentPresidentName} Is Nominating`,
            `${currentPresidentName} is choosing the next chancellor right now. Watch the pick, then decide whether the table can trust the government.`,
            'medium',
            'public',
          ),
        );
      }
      break;

    case PHASES.VOTING:
      if (!isAlive) {
        instructions.push(
          createInstruction(
            `${currentPresidentName} Nominated ${currentChancellorName}`,
            `The living players are now voting on this government. You are observing only.`,
            'low',
            'public',
          ),
        );
      } else if (!player.hasVoted) {
        instructions.push(
          createInstruction(
            'Vote JA Or NEIN',
            `Approve or reject the government led by ${currentPresidentName} and ${currentChancellorName}. Cast your vote now.`,
            'high',
            'private',
            [
              { label: 'Vote JA', action: 'vote-yes' },
              { label: 'Vote NEIN', action: 'vote-no' },
            ],
          ),
        );
      } else {
        instructions.push(
          createInstruction(
            'Vote Locked',
            'Your vote is in. Wait while the rest of the table finishes.',
            'medium',
            'private',
          ),
        );
      }

      if (gameState.electionTracker === 2) {
        instructions.push(
          createInstruction(
            'Chaos Warning',
            'One more failed government will trigger chaos and auto-enact the top policy.',
            'high',
            'public',
          ),
        );
      }

      if (gameState.fascistPolicies >= 3) {
        instructions.push(
          createInstruction(
            'Hitler Election Risk',
            'Once three fascist policies are on the board, electing Hitler as Chancellor ends the game immediately.',
            'high',
            'public',
          ),
        );
      }
      break;

    case PHASES.LEGISLATIVE_PRESIDENT:
      if (isPresident) {
        instructions.push(
          createInstruction(
            'You Drew Three Policies',
            'Discard one of the three policies and pass the remaining two to the Chancellor. Do not leak the full hand publicly.',
            'high',
            'private',
            [{ label: 'Discard one policy', action: 'president-discard' }],
          ),
        );
      } else {
        instructions.push(
          createInstruction(
            `${currentPresidentName} Is Reviewing Policies`,
            `${currentPresidentName} drew three policies and is selecting which two to pass to ${currentChancellorName}.`,
            'medium',
            'public',
          ),
        );
      }
      break;

    case PHASES.LEGISLATIVE_CHANCELLOR:
      if (isChancellor) {
        instructions.push(
          createInstruction(
            'Enact One Policy',
            gameState.vetoRequested
              ? 'You requested a veto. Wait for the President to accept or reject it.'
              : gameState.vetoRejected
                ? 'The President rejected the veto. You must now enact one of the remaining policies.'
              : 'Choose the one policy that will take effect this round. Do not reveal hidden information directly.',
            'high',
            'private',
            gameState.vetoRequested
              ? []
              : [
                  { label: 'Enact a policy', action: 'chancellor-enact' },
                  ...(gameState.vetoAvailable && !gameState.vetoRejected ? [{ label: 'Request veto', action: 'request-veto' }] : []),
                ],
          ),
        );
      } else if (isPresident && gameState.vetoRequested) {
        instructions.push(
          createInstruction(
            'Respond To Veto Request',
            'The Chancellor wants to veto the agenda. Accept to discard both cards and advance the election tracker, or reject and force enactment.',
            'high',
            'private',
            [
              { label: 'Accept veto', action: 'accept-veto' },
              { label: 'Reject veto', action: 'reject-veto' },
            ],
          ),
        );
      } else {
        instructions.push(
          createInstruction(
            `${currentChancellorName} Is Deciding The Policy`,
            `${currentChancellorName} now holds the final decision. Listen for contradictions after the enactment.`,
            'medium',
            'public',
          ),
        );
      }
      break;

    case PHASES.EXECUTIVE_ACTION:
      if (!isPresident) {
        instructions.push(
          createInstruction(
            `${currentPresidentName} Is Resolving Executive Power`,
            `${currentPresidentName} is carrying out the power unlocked by the fascist track.`,
            'medium',
            'public',
          ),
        );
        break;
      }

      if (gameState.executivePower === EXECUTIVE_POWERS.INVESTIGATE) {
        instructions.push(
          createInstruction(
            'Investigate Party Loyalty',
            'Select one living player who has not already been investigated. You will learn party loyalty, not exact role.',
            'high',
            'private',
            [{ label: 'Choose a player', action: 'investigate-loyalty' }],
          ),
        );
      } else if (gameState.executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION) {
        instructions.push(
          createInstruction(
            'Call A Special Election',
            'Choose the next President for one round. After that special round, the presidency returns to the normal order after you.',
            'high',
            'private',
            [{ label: 'Choose next President', action: 'call-special-election' }],
          ),
        );
      } else if (gameState.executivePower === EXECUTIVE_POWERS.PEEK) {
        instructions.push(
          createInstruction(
            'Review The Top Three Policies',
            'Look at the next three policies in order, then continue to the next nomination without changing them.',
            'high',
            'private',
            [{ label: 'Acknowledge peek', action: 'complete-policy-peek' }],
          ),
        );
      } else if (gameState.executivePower === EXECUTIVE_POWERS.EXECUTION) {
        instructions.push(
          createInstruction(
            'Execute A Player',
            'Choose one living player to eliminate. If Hitler is killed, the liberals win immediately.',
            'high',
            'private',
            [{ label: 'Select target', action: 'execute-player' }],
          ),
        );
      }
      break;

    case PHASES.GAME_OVER:
      instructions.push(
        createInstruction(
          gameState.winner === FACTIONS.LIBERAL ? 'Liberal Victory' : 'Fascist Victory',
          gameState.winReason || 'The match has ended.',
          'high',
          'public',
        ),
      );
      break;

    default:
      break;
  }

  return instructions;
}
