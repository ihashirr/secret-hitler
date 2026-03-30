// Force Sync - Restructured Project
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { getBotThinkDelayRange } from "../../src/features/game-board/liveTempoProfile";

// Constants (Redefined for Convex environment compatibility)
const PHASES = {
  LOBBY: 'LOBBY',
  ROLE_REVEAL: 'ROLE_REVEAL',
  NOMINATION: 'NOMINATION', 
  VOTING: 'VOTING',
  LEGISLATIVE_PRESIDENT: 'LEGISLATIVE_PRESIDENT', 
  LEGISLATIVE_CHANCELLOR: 'LEGISLATIVE_CHANCELLOR',
  EXECUTIVE_ACTION: 'EXECUTIVE_ACTION',
  GAME_OVER: 'GAME_OVER'
};

const ROLES = { LIBERAL: 'LIBERAL', FASCIST: 'FASCIST', HITLER: 'HITLER' };
const FACTIONS = { LIBERAL: 'LIBERAL', FASCIST: 'FASCIST' };
const CARD_TYPES = { LIBERAL: 'LIBERAL', FASCIST: 'FASCIST' };
const EXECUTIVE_POWERS = {
  INVESTIGATE: 'INVESTIGATE',
  SPECIAL_ELECTION: 'SPECIAL_ELECTION',
  PEEK: 'PEEK',
  EXECUTION: 'EXECUTION',
};
const VOTES = { YA: 'YA', NEIN: 'NEIN' };

const ROLE_COUNTS: Record<number, Record<string, number>> = {
  5: { [ROLES.LIBERAL]: 3, [ROLES.FASCIST]: 1, [ROLES.HITLER]: 1 },
  6: { [ROLES.LIBERAL]: 4, [ROLES.FASCIST]: 1, [ROLES.HITLER]: 1 },
  7: { [ROLES.LIBERAL]: 4, [ROLES.FASCIST]: 2, [ROLES.HITLER]: 1 },
  8: { [ROLES.LIBERAL]: 5, [ROLES.FASCIST]: 2, [ROLES.HITLER]: 1 },
  9: { [ROLES.LIBERAL]: 5, [ROLES.FASCIST]: 3, [ROLES.HITLER]: 1 },
  10: { [ROLES.LIBERAL]: 6, [ROLES.FASCIST]: 3, [ROLES.HITLER]: 1 },
};
function pickBotThinkDelayMs(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getBotThinkDelayMs(room: any, players: any[]) {
  const delayRange = getBotThinkDelayRange({ phase: room.phase, players });
  return pickBotThinkDelayMs(delayRange.min, delayRange.max);
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createAnonymousPlayerId() {
  return `anonymous_${Math.random().toString(36).slice(2, 11)}`;
}

function getAlivePlayers(players: any[]) {
  return players
    .filter((player) => player.isAlive)
    .sort((left, right) => left.position - right.position);
}

function getPlayerById(players: any[], playerId?: string) {
  if (!playerId) return null;
  return players.find((player) => player.playerId === playerId) || null;
}

function getFactionForRole(role: string | undefined) {
  return role === ROLES.LIBERAL ? FACTIONS.LIBERAL : FACTIONS.FASCIST;
}

function normalizeVote(vote: string) {
  return vote === VOTES.YA ? VOTES.YA : VOTES.NEIN;
}

function getExecutivePower(playerCount: number, fascistPolicies: number) {
  if (playerCount <= 6) {
    if (fascistPolicies === 3) return EXECUTIVE_POWERS.PEEK;
    if (fascistPolicies === 4 || fascistPolicies === 5) return EXECUTIVE_POWERS.EXECUTION;
    return undefined;
  }

  if (playerCount <= 8) {
    if (fascistPolicies === 2) return EXECUTIVE_POWERS.INVESTIGATE;
    if (fascistPolicies === 3) return EXECUTIVE_POWERS.SPECIAL_ELECTION;
    if (fascistPolicies === 4 || fascistPolicies === 5) return EXECUTIVE_POWERS.EXECUTION;
    return undefined;
  }

  if (fascistPolicies === 1 || fascistPolicies === 2) return EXECUTIVE_POWERS.INVESTIGATE;
  if (fascistPolicies === 3) return EXECUTIVE_POWERS.SPECIAL_ELECTION;
  if (fascistPolicies === 4 || fascistPolicies === 5) return EXECUTIVE_POWERS.EXECUTION;
  return undefined;
}

function getEligibleChancellorIds(room: any, players: any[], presidentId?: string) {
  const activePresidentId = presidentId || room.currentPresidentId;
  const alivePlayers = getAlivePlayers(players);

  return alivePlayers
    .filter((player) => player.playerId !== activePresidentId)
    .filter((player) => player.playerId !== room.previousChancellorId)
    .filter((player) => alivePlayers.length <= 5 || player.playerId !== room.previousPresidentId)
    .map((player) => player.playerId);
}

function getNextPresident(players: any[], originPresidentId?: string) {
  const alivePlayers = getAlivePlayers(players);
  if (alivePlayers.length === 0) return null;

  const originPlayer = getPlayerById(players, originPresidentId) || alivePlayers[0];
  return alivePlayers.find((player) => player.position > originPlayer.position) || alivePlayers[0];
}

function prepareDeck(drawPile: string[], discardPile: string[], neededCards: number) {
  let nextDrawPile = [...drawPile];
  let nextDiscardPile = [...discardPile];

  if (nextDrawPile.length < neededCards) {
    nextDrawPile = shuffle([...nextDrawPile, ...nextDiscardPile]);
    nextDiscardPile = [];
  }

  return { drawPile: nextDrawPile, discardPile: nextDiscardPile };
}

function drawCards(drawPile: string[], discardPile: string[], count: number) {
  const preparedDeck = prepareDeck(drawPile, discardPile, count);
  const nextDrawPile = [...preparedDeck.drawPile];
  const drawnCards: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const card = nextDrawPile.pop();
    if (!card) break;
    drawnCards.push(card);
  }

  return {
    drawPile: nextDrawPile,
    discardPile: preparedDeck.discardPile,
    drawnCards,
  };
}

function peekCards(drawPile: string[], discardPile: string[], count: number) {
  const preparedDeck = prepareDeck(drawPile, discardPile, count);
  return {
    drawPile: preparedDeck.drawPile,
    discardPile: preparedDeck.discardPile,
    peekedCards: preparedDeck.drawPile.slice(-count).reverse(),
  };
}

// Helpers
async function logSystem(db: any, roomId: string, message: string) {
  await db.insert("gameLog", {
    roomId,
    message: `[System] ${message}`,
    timestamp: Date.now(),
  });
}

async function getRoomByRoomId(ctx: any, roomId: string) {
  return ctx.db
    .query("rooms")
    .withIndex("by_roomId", (q: any) => q.eq("roomId", roomId))
    .unique();
}

async function getPlayersByRoomId(ctx: any, roomId: string) {
  return ctx.db
    .query("players")
    .withIndex("by_roomId", (q: any) => q.eq("roomId", roomId))
    .collect();
}

async function getPlayerInRoom(ctx: any, roomId: string, playerId: string) {
  return ctx.db
    .query("players")
    .withIndex("by_roomId", (q: any) => q.eq("roomId", roomId))
    .filter((q: any) => q.eq(q.field("playerId"), playerId))
    .unique();
}

async function clearVotes(ctx: any, players: any[]) {
  for (const player of players) {
    if (player.vote !== undefined) {
      await ctx.db.patch(player._id, { vote: undefined });
    }
  }
}

async function syncOfficeFlags(ctx: any, players: any[], roomPatch: any) {
  for (const player of players) {
    const isPresident = player.playerId === roomPatch.currentPresidentId;
    const isChancellor = player.playerId === roomPatch.currentChancellorId;
    if (player.isPresident !== isPresident || player.isChancellor !== isChancellor) {
      await ctx.db.patch(player._id, { isPresident, isChancellor });
    }
  }
}

async function setRoomState(ctx: any, room: any, players: any[], patch: any) {
  const nextRoom = { ...room, ...patch };
  await ctx.db.patch(room._id, patch);
  await syncOfficeFlags(ctx, players, nextRoom);
  return nextRoom;
}

async function startVotingSession(ctx: any, room: any, players: any[], chancellorId: string) {
  await clearVotes(ctx, players);
  const votingRoom = await setRoomState(ctx, room, players, {
    nominatedChancellorId: chancellorId,
    currentChancellorId: undefined,
    phase: PHASES.VOTING,
    lastVotes: undefined,
    chaosTriggered: false,
    chaosPolicy: undefined,
    botThinkAt: undefined,
  });

  await logSystem(ctx.db, room.roomId, "President nominated someone as Chancellor.");
  return votingRoom;
}

async function passPoliciesToChancellor(ctx: any, room: any, players: any[], discardedIndex: number) {
  if (discardedIndex < 0 || discardedIndex >= room.drawnCards.length) return null;

  const drawn = [...room.drawnCards];
  const discarded = drawn.splice(discardedIndex, 1)[0];

  return setRoomState(ctx, room, players, {
    drawnCards: drawn,
    discardPile: [...room.discardPile, discarded],
    phase: PHASES.LEGISLATIVE_CHANCELLOR,
    vetoRequested: undefined,
    vetoRejected: undefined,
    botThinkAt: undefined,
  });
}

async function openVetoRequest(ctx: any, room: any, players: any[]) {
  const vetoRoom = await setRoomState(ctx, room, players, {
    vetoRequested: true,
    vetoRejected: undefined,
    botThinkAt: undefined,
  });
  await logSystem(ctx.db, room.roomId, "Chancellor requested a veto.");
  return vetoRoom;
}

async function resolveVetoDecision(ctx: any, room: any, players: any[], accept: boolean) {
  if (!accept) {
    const rejectedRoom = await setRoomState(ctx, room, players, {
      vetoRequested: undefined,
      vetoRejected: true,
      botThinkAt: undefined,
    });
    await logSystem(ctx.db, room.roomId, "President rejected the veto request.");
    return rejectedRoom;
  }

  const vetoRoom = await setRoomState(ctx, room, players, {
    discardPile: [...room.discardPile, ...room.drawnCards],
    drawnCards: [],
    previousPresidentId: room.currentPresidentId,
    previousChancellorId: room.currentChancellorId,
    vetoRequested: undefined,
    vetoRejected: undefined,
    botThinkAt: undefined,
  });

  await logSystem(ctx.db, room.roomId, "Government veto accepted.");
  await advanceElectionTracker(ctx, vetoRoom, players, "Government was inactive after veto.");
  return vetoRoom;
}

async function resolveExecution(ctx: any, room: any, players: any[], targetPlayerId: string) {
  const target = getPlayerById(players, targetPlayerId);
  if (!target || !target.isAlive || target.playerId === room.currentPresidentId) return false;

  await ctx.db.patch(target._id, { isAlive: false });
  await logSystem(ctx.db, room.roomId, `${target.name} has been executed.`);

  const refreshedPlayers = await getPlayersByRoomId(ctx, room.roomId);

  if (target.role === ROLES.HITLER) {
    await finishGame(ctx, room, refreshedPlayers, FACTIONS.LIBERAL, "Hitler was executed!");
    return true;
  }

  const refreshedRoom = await getRoomByRoomId(ctx, room.roomId);
  if (refreshedRoom) {
    await startNextNomination(ctx, refreshedRoom, refreshedPlayers);
  }

  return true;
}

async function resolveInvestigation(ctx: any, room: any, players: any[], presidentId: string, targetPlayerId: string) {
  const target = getPlayerById(players, targetPlayerId);
  const investigatedPlayerIds = room.investigatedPlayerIds || [];

  if (!target || !target.isAlive || target.playerId === presidentId) return false;
  if (investigatedPlayerIds.includes(target.playerId)) return false;

  const investigationRoom = await setRoomState(ctx, room, players, {
    investigatedPlayerIds: [...investigatedPlayerIds, target.playerId],
    lastInvestigatedPlayerId: target.playerId,
    lastInvestigationParty: getFactionForRole(target.role),
    lastInvestigatedById: presidentId,
    executivePower: undefined,
    botThinkAt: undefined,
  });

  await logSystem(ctx.db, room.roomId, `President investigated ${target.name}'s party loyalty.`);
  await startNextNomination(ctx, investigationRoom, players);
  return true;
}

async function beginSpecialElection(ctx: any, room: any, players: any[], presidentId: string, targetPlayerId: string) {
  const target = getPlayerById(players, targetPlayerId);
  if (!target || !target.isAlive || target.playerId === presidentId) return false;

  await clearVotes(ctx, players);
  await setRoomState(ctx, room, players, {
    phase: PHASES.NOMINATION,
    currentPresidentId: target.playerId,
    currentChancellorId: undefined,
    nominatedChancellorId: undefined,
    executivePower: undefined,
    specialElectionCallerId: presidentId,
    chaosTriggered: false,
    chaosPolicy: undefined,
    botThinkAt: undefined,
  });

  await logSystem(ctx.db, room.roomId, `President called a special election for ${target.name}.`);
  return true;
}

function getBotVote(bot: any, room: any, currentPresident: any, nominatedChancellor: any) {
  const hitlerWouldWin =
    room.fascistPolicies >= 3 &&
    nominatedChancellor?.role === ROLES.HITLER;

  if (hitlerWouldWin && (bot.role === ROLES.FASCIST || bot.role === ROLES.HITLER)) {
    return VOTES.YA;
  }

  const protectsHitlerWin = hitlerWouldWin && bot.role !== ROLES.FASCIST && bot.role !== ROLES.HITLER;
  if (protectsHitlerWin) {
    return VOTES.NEIN;
  }

  let approvalScore = 0;

  if (isFascistSidePlayer(bot)) {
    approvalScore += isFascistSidePlayer(currentPresident) ? 0.95 : -0.15;
    approvalScore += isFascistSidePlayer(nominatedChancellor) ? 1.35 : -0.8;
    if (room.electionTracker === 2) approvalScore += 0.25;
    if (room.fascistPolicies >= 4 && isFascistSidePlayer(nominatedChancellor)) approvalScore += 0.45;
  } else {
    approvalScore += currentPresident?.role === ROLES.LIBERAL ? 1.0 : -0.95;
    approvalScore += nominatedChancellor?.role === ROLES.LIBERAL ? 1.15 : -1.2;
    if (room.electionTracker === 2) approvalScore += 0.9;
    if (room.fascistPolicies >= 4 && isFascistSidePlayer(nominatedChancellor)) approvalScore -= 0.8;
    if (
      room.liberalPolicies >= 4 &&
      currentPresident?.role === ROLES.LIBERAL &&
      nominatedChancellor?.role === ROLES.LIBERAL
    ) {
      approvalScore += 0.6;
    }
  }

  approvalScore += Math.random() * 1.1 - 0.55;
  return approvalScore >= 0 ? VOTES.YA : VOTES.NEIN;
}

function roomNeedsBotStep(room: any, players: any[]) {
  if (!room || room.status !== "ACTIVE") return false;
  if (room.phase === PHASES.LOBBY || room.phase === PHASES.GAME_OVER) return false;

  const alivePlayers = getAlivePlayers(players);
  const aliveBots = alivePlayers.filter((player) => player.isBot);
  if (!aliveBots.length) return false;

  if (room.phase === PHASES.ROLE_REVEAL) {
    return aliveBots.some((bot) => !bot.isReady);
  }

  if (room.phase === PHASES.NOMINATION) {
    return Boolean(getPlayerById(players, room.currentPresidentId)?.isBot);
  }

  if (room.phase === PHASES.VOTING) {
    return aliveBots.some((bot) => bot.vote === undefined);
  }

  if (room.phase === PHASES.LEGISLATIVE_PRESIDENT) {
    return Boolean(getPlayerById(players, room.currentPresidentId)?.isBot && room.drawnCards.length);
  }

  if (room.phase === PHASES.LEGISLATIVE_CHANCELLOR) {
    if (room.vetoRequested) {
      return Boolean(getPlayerById(players, room.currentPresidentId)?.isBot);
    }

    return Boolean(getPlayerById(players, room.currentChancellorId)?.isBot && room.drawnCards.length);
  }

  if (room.phase === PHASES.EXECUTIVE_ACTION) {
    return Boolean(getPlayerById(players, room.currentPresidentId)?.isBot && room.executivePower);
  }

  return false;
}

async function resolveSingleBotStep(ctx: any, room: any, players: any[]) {
  const bots = getAlivePlayers(players).filter((player) => player.isBot);
  if (bots.length === 0) return false;

  if (room.phase === PHASES.ROLE_REVEAL) {
    const nextBot = bots.find((bot) => !bot.isReady);
    if (!nextBot) return false;

    await ctx.db.patch(nextBot._id, { isReady: true });

    const playersNow = await getPlayersByRoomId(ctx, room.roomId);
    if (playersNow.every((player) => player.isReady)) {
      await setRoomState(ctx, room, playersNow, {
        phase: PHASES.NOMINATION,
        nominatedChancellorId: undefined,
        currentChancellorId: undefined,
        botThinkAt: undefined,
      });
      await logSystem(ctx.db, room.roomId, "All operatives confirmed. Beginning mission.");
    }
    return true;
  }

  if (room.phase === PHASES.NOMINATION) {
    const president = getPlayerById(players, room.currentPresidentId);
    if (!president?.isBot) return false;

    const pick = getBotNominationTarget(room, players);
    if (!pick) return false;

    await startVotingSession(ctx, room, players, pick.playerId);
    return true;
  }

  if (room.phase === PHASES.VOTING) {
    const nextBotVoter = bots.find((bot) => bot.vote === undefined);
    if (!nextBotVoter) return false;

    const currentPresident = getPlayerById(players, room.currentPresidentId);
    const nominatedChancellor = getPlayerById(players, room.nominatedChancellorId);
    const vote = getBotVote(nextBotVoter, room, currentPresident, nominatedChancellor);
    await ctx.db.patch(nextBotVoter._id, { vote });

    const refreshedPlayers = await getPlayersByRoomId(ctx, room.roomId);
    const alivePlayers = getAlivePlayers(refreshedPlayers);
    const allVotesIn = alivePlayers.every((player) => player.vote === VOTES.YA || player.vote === VOTES.NEIN);

    if (allVotesIn) {
      const finalVotes = alivePlayers.reduce<Record<string, string>>((accumulator, player) => {
        accumulator[player.playerId] = normalizeVote(player.vote || VOTES.NEIN);
        return accumulator;
      }, {});

      const refreshedRoom = await getRoomByRoomId(ctx, room.roomId);
      if (refreshedRoom) {
        await tallyVotes(ctx, refreshedRoom, refreshedPlayers, finalVotes);
      }
    }

    return true;
  }

  if (room.phase === PHASES.LEGISLATIVE_PRESIDENT) {
    const president = getPlayerById(players, room.currentPresidentId);
    if (!president?.isBot || room.drawnCards.length === 0) return false;

    await passPoliciesToChancellor(
      ctx,
      room,
      players,
      chooseBotPresidentDiscardIndex(president, room),
    );
    return true;
  }

  if (room.phase === PHASES.LEGISLATIVE_CHANCELLOR) {
    const president = getPlayerById(players, room.currentPresidentId);
    const chancellor = getPlayerById(players, room.currentChancellorId);

    if (room.vetoRequested && president?.isBot) {
      await resolveVetoDecision(ctx, room, players, shouldBotAcceptVeto(president, room));
      return true;
    }

    if (!chancellor?.isBot || room.vetoRequested) return false;

    if (!room.vetoRejected && shouldBotRequestVeto(chancellor, room)) {
      await openVetoRequest(ctx, room, players);
      return true;
    }

    if (!room.drawnCards.length) return false;

    const drawn = [...room.drawnCards];
    const enacted = drawn.splice(chooseBotEnactIndex(chancellor, room), 1)[0];
    await applyEnactedPolicy(ctx, room, players, enacted, {
      source: "LEGISLATIVE",
      discardCards: drawn,
    });
    return true;
  }

  if (room.phase !== PHASES.EXECUTIVE_ACTION) return false;

  const president = getPlayerById(players, room.currentPresidentId);
  if (!president?.isBot) return false;

  if (room.executivePower === EXECUTIVE_POWERS.PEEK) {
    await startNextNomination(ctx, room, players, { executivePower: undefined });
    return true;
  }

  if (room.executivePower === EXECUTIVE_POWERS.INVESTIGATE) {
    const target =
      getBotInvestigationTarget(president, room, players) ||
      getRandomLivingTarget(players, president.playerId);

    if (!target) return false;

    return resolveInvestigation(ctx, room, players, president.playerId, target.playerId);
  }

  if (room.executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION) {
    const target =
      getBotSpecialElectionTarget(president, room, players) ||
      getRandomLivingTarget(players, president.playerId);
    if (!target) return false;

    return beginSpecialElection(ctx, room, players, president.playerId, target.playerId);
  }

  if (room.executivePower === EXECUTIVE_POWERS.EXECUTION) {
    const target =
      getBotExecutionTarget(president, room, players) ||
      getRandomLivingTarget(players, president.playerId);
    if (!target) return false;

    return resolveExecution(ctx, room, players, target.playerId);
  }

  return false;
}

async function resolveBotsIfNeeded(ctx: any, roomId: string) {
  const room = await getRoomByRoomId(ctx, roomId);
  if (!room) return;

  const players = await getPlayersByRoomId(ctx, roomId);
  const needsBotStep = roomNeedsBotStep(room, players);

  if (!needsBotStep) {
    if (room.botThinkAt !== undefined) {
      await ctx.db.patch(room._id, { botThinkAt: undefined });
    }
    return;
  }

  if (room.botThinkAt !== undefined) {
    return;
  }

  const delayMs = getBotThinkDelayMs(room, players);
  const scheduledAt = Date.now() + delayMs + Math.floor(Math.random() * 17);

  await ctx.db.patch(room._id, { botThinkAt: scheduledAt });
  await ctx.scheduler.runAfter(delayMs, internal.game.runScheduledBotStep, {
    roomId,
    scheduledAt,
  });
}

// Mutations

export const addBot = mutation({
  args: { roomId: v.string(), playerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const BOT_NAMES = [
      "GIGACHAD", "DOGE", "SKIBIDI", "CHEEMS", "STONKS", 
      "WOJACK", "RIZZLER", "SIGMA", "CAPYBARA", "POGCHAMP", 
      "SANIC", "CHONKER", "KEKW", "KAREN", "NPC", "BEANS"
    ];
    const name = `${BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]}_${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`;
    const botPlayerId = `bot_${Math.random().toString(36).slice(2, 11)}`;
    const avatarId = Math.floor(Math.random() * 10) + 1;
    const identity = await ctx.auth.getUserIdentity();
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room || room.phase !== PHASES.LOBBY) {
      return { success: false, error: "Bots can only be added in the lobby" };
    }

    const players = await getPlayersByRoomId(ctx, args.roomId);
    const callerId = identity?.subject || args.playerId;
    const caller = callerId ? getPlayerById(players, callerId) : null;

    if (!caller?.isHost) {
      return { success: false, error: "Only the host can add bots" };
    }

    if (players.length >= 10) return { success: false, error: "Room full" };

    await ctx.db.insert("players", {
        roomId: args.roomId,
        playerId: botPlayerId,
        name: name,
        isAlive: true,
        isPresident: false,
        isChancellor: false,
        isReady: true,
        isHost: false,
        position: players.length,
        avatarId: avatarId,
        isBot: true,
    });

    await logSystem(ctx.db, args.roomId, `${name} (MEME_OPERATIVE) has entered the chat. No cap.`);
    return { success: true };
  },
});

export const joinRoom = mutation({
  args: { roomId: v.string(), name: v.string(), avatarId: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const playerId = identity?.subject || createAnonymousPlayerId();

    let room = await getRoomByRoomId(ctx, args.roomId);

    if (!room) {
      await ctx.db.insert("rooms", {
        roomId: args.roomId,
        phase: PHASES.LOBBY,
        status: "ACTIVE",
        electionTracker: 0,
        drawPile: [],
        discardPile: [],
        drawnCards: [],
        liberalPolicies: 0,
        fascistPolicies: 0,
        investigatedPlayerIds: [],
        chaosTriggered: false,
      });
      room = await getRoomByRoomId(ctx, args.roomId);
    }

    const existing = await getPlayerInRoom(ctx, args.roomId, playerId);

    if (!existing) {
        const players = await getPlayersByRoomId(ctx, args.roomId);
        
        await ctx.db.insert("players", {
            roomId: args.roomId,
            playerId: playerId,
            name: args.name,
            isAlive: true,
            isPresident: false,
            isChancellor: false,
            isReady: false,
            isHost: players.length === 0,
            position: players.length,
            avatarId: args.avatarId,
        });
        await logSystem(ctx.db, args.roomId, `${args.name} joined the room.`);
    }

    return { success: true, playerId };
  },
});

export const toggleReady = mutation({
    args: { roomId: v.string(), playerId: v.string() },
    handler: async (ctx, args) => {
        const player = await getPlayerInRoom(ctx, args.roomId, args.playerId);
        if (!player) return { success: false };

        const newReady = !player.isReady;
        await ctx.db.patch(player._id, { isReady: newReady });

        const room = await getRoomByRoomId(ctx, args.roomId);
        
        if (room && room.phase === PHASES.ROLE_REVEAL) {
            const players = await getPlayersByRoomId(ctx, args.roomId);
            
            const readyCount = players.filter(p => 
                p.playerId === args.playerId ? newReady : p.isReady
            ).length;

            if (readyCount === players.length && newReady) {
                await setRoomState(ctx, room, players, { 
                    phase: PHASES.NOMINATION,
                    nominatedChancellorId: undefined,
                    currentChancellorId: undefined,
                    botThinkAt: undefined,
                });
                await logSystem(ctx.db, args.roomId, "All operatives confirmed. Beginning mission.");
            }
        }

        await resolveBotsIfNeeded(ctx, args.roomId);

        return { success: true };
    }
});

export const leaveRoom = mutation({
    args: { roomId: v.string(), playerId: v.string() },
    handler: async (ctx, args) => {
        const player = await getPlayerInRoom(ctx, args.roomId, args.playerId);
        if (!player) return { success: false };

        await ctx.db.delete(player._id);
        await logSystem(ctx.db, args.roomId, `${player.name} left the room.`);

        if (player.isHost) {
            const others = await getPlayersByRoomId(ctx, args.roomId);
            if (others.length > 0) {
                const nextHost = others.find((candidate) => !candidate.isBot);
                if (nextHost) {
                    await ctx.db.patch(nextHost._id, { isHost: true });
                }
            }
        }

        await resolveBotsIfNeeded(ctx, args.roomId);
        return { success: true };
    }
});

export const resetRoom = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room) return { success: false };

    const players = await getPlayersByRoomId(ctx, args.roomId);

    const logs = await ctx.db
        .query("gameLog")
        .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
        .collect();

    for (const p of players) await ctx.db.delete(p._id);
    for (const l of logs) await ctx.db.delete(l._id);
    await ctx.db.delete(room._id);

    return { success: true };
  }
});

export const startGame = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);

    if (!room || room.phase !== PHASES.LOBBY) return { success: false, error: "Game already started or room not found" };

    const players = await getPlayersByRoomId(ctx, args.roomId);

    if (players.length < 5 || players.length > 10) return { success: false, error: "Need 5-10 players" };

    const counts = ROLE_COUNTS[players.length];
    let roles = [
      ...Array(counts[ROLES.LIBERAL]).fill({ role: ROLES.LIBERAL, party: FACTIONS.LIBERAL }),
      ...Array(counts[ROLES.FASCIST]).fill({ role: ROLES.FASCIST, party: FACTIONS.FASCIST }),
      { role: ROLES.HITLER, party: FACTIONS.FASCIST }
    ];
    roles = shuffle(roles);
    
    const shuffledPlayers = shuffle(players);
    for (let i = 0; i < shuffledPlayers.length; i++) {
        await ctx.db.patch(shuffledPlayers[i]._id, {
            role: roles[i].role,
            party: roles[i].party,
            isAlive: true,
            isReady: false,
            isPresident: false,
            isChancellor: false,
            vote: undefined,
            position: i,
        });
    }

    const drawPile = shuffle([
      ...Array(6).fill(CARD_TYPES.LIBERAL),
      ...Array(11).fill(CARD_TYPES.FASCIST)
    ]);

    const presidentIndex = Math.floor(Math.random() * shuffledPlayers.length);
    const presidentId = shuffledPlayers[presidentIndex].playerId;

    await setRoomState(ctx, room, shuffledPlayers, {
        phase: PHASES.ROLE_REVEAL,
        status: "ACTIVE",
        drawPile,
        discardPile: [],
        drawnCards: [],
        liberalPolicies: 0,
        fascistPolicies: 0,
        electionTracker: 0,
        currentPresidentId: presidentId,
        currentChancellorId: undefined,
        nominatedChancellorId: undefined,
        previousPresidentId: undefined,
        previousChancellorId: undefined,
        winner: undefined,
        winReason: undefined,
        lastVotes: undefined,
        executivePower: undefined,
        vetoRequested: undefined,
        vetoRejected: undefined,
        investigatedPlayerIds: [],
        lastInvestigatedPlayerId: undefined,
        lastInvestigationParty: undefined,
        lastInvestigatedById: undefined,
        lastPeekedPolicies: undefined,
        lastPeekedById: undefined,
        specialElectionCallerId: undefined,
        chaosTriggered: false,
        chaosPolicy: undefined,
        botThinkAt: undefined,
    });

    await logSystem(ctx.db, args.roomId, "The game has begun.");
    await resolveBotsIfNeeded(ctx, args.roomId);
    return { success: true };
  },
});

export const nominateChancellor = mutation({
  args: { roomId: v.string(), presidentId: v.string(), chancellorId: v.string() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);

    if (!room || room.phase !== PHASES.NOMINATION) return { success: false };
    if (room.currentPresidentId !== args.presidentId) return { success: false, error: "Not your turn" };

    const players = await getPlayersByRoomId(ctx, args.roomId);
    const eligibleIds = getEligibleChancellorIds(room, players, args.presidentId);
    if (!eligibleIds.includes(args.chancellorId)) {
      return { success: false, error: "Term limit" };
    }

    await startVotingSession(ctx, room, players, args.chancellorId);
    await resolveBotsIfNeeded(ctx, args.roomId);
    return { success: true };
  },
});

export const castVote = mutation({
  args: { roomId: v.string(), playerId: v.string(), vote: v.string() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room || room.phase !== PHASES.VOTING) return { success: false };

    const player = await getPlayerInRoom(ctx, args.roomId, args.playerId);

    if (!player || !player.isAlive) return { success: false };

    const vote = normalizeVote(args.vote);
    await ctx.db.patch(player._id, { vote });

    const players = await getPlayersByRoomId(ctx, args.roomId);
    const alivePlayers = getAlivePlayers(players);
    const allVoted = alivePlayers.every((currentPlayer) =>
      currentPlayer.playerId === args.playerId
        ? true
        : currentPlayer.vote === VOTES.YA || currentPlayer.vote === VOTES.NEIN,
    );

    if (!allVoted) return { success: true };

    const finalVotes = alivePlayers.reduce<Record<string, string>>((accumulator, currentPlayer) => {
      accumulator[currentPlayer.playerId] =
        currentPlayer.playerId === args.playerId
          ? vote
          : normalizeVote(currentPlayer.vote || VOTES.NEIN);
      return accumulator;
    }, {});

    await tallyVotes(ctx, room, players, finalVotes);
    await resolveBotsIfNeeded(ctx, args.roomId);

    return { success: true };
  },
});

export const presidentDrawPolicies = mutation({
  args: { roomId: v.string(), presidentId: v.string(), discardedIndex: v.number() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room || room.phase !== PHASES.LEGISLATIVE_PRESIDENT) return { success: false };
    if (room.currentPresidentId !== args.presidentId) {
      return { success: false, error: "Not your turn" };
    }
    if (args.discardedIndex < 0 || args.discardedIndex >= room.drawnCards.length) {
      return { success: false, error: "Invalid discard" };
    }

    const players = await getPlayersByRoomId(ctx, args.roomId);
    await passPoliciesToChancellor(ctx, room, players, args.discardedIndex);
    await resolveBotsIfNeeded(ctx, args.roomId);

    return { success: true };
  },
});

export const requestVeto = mutation({
  args: { roomId: v.string(), chancellorId: v.string() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room || room.phase !== PHASES.LEGISLATIVE_CHANCELLOR) return { success: false };
    if (room.currentChancellorId !== args.chancellorId) {
      return { success: false, error: "Not your turn" };
    }
    if (room.fascistPolicies < 5) {
      return { success: false, error: "Veto unavailable" };
    }
    if (room.vetoRequested) return { success: true };
    if (room.vetoRejected) {
      return { success: false, error: "Veto already rejected" };
    }

    const players = await getPlayersByRoomId(ctx, args.roomId);
    await openVetoRequest(ctx, room, players);
    await resolveBotsIfNeeded(ctx, args.roomId);
    return { success: true };
  },
});

export const respondVeto = mutation({
  args: { roomId: v.string(), presidentId: v.string(), accept: v.boolean() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room || room.phase !== PHASES.LEGISLATIVE_CHANCELLOR || !room.vetoRequested) {
      return { success: false };
    }
    if (room.currentPresidentId !== args.presidentId) {
      return { success: false, error: "Not your turn" };
    }

    const players = await getPlayersByRoomId(ctx, args.roomId);
    await resolveVetoDecision(ctx, room, players, args.accept);
    await resolveBotsIfNeeded(ctx, args.roomId);
    return { success: true };
  },
});

export const chancellorEnactPolicy = mutation({
  args: { roomId: v.string(), chancellorId: v.string(), enactedIndex: v.number() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room || room.phase !== PHASES.LEGISLATIVE_CHANCELLOR) return { success: false };
    if (room.currentChancellorId !== args.chancellorId) {
      return { success: false, error: "Not your turn" };
    }
    if (room.vetoRequested) {
      return { success: false, error: "Veto pending" };
    }
    if (args.enactedIndex < 0 || args.enactedIndex >= room.drawnCards.length) {
      return { success: false, error: "Invalid policy" };
    }

    const players = await getPlayersByRoomId(ctx, args.roomId);
    const drawn = [...room.drawnCards];
    const enacted = drawn.splice(args.enactedIndex, 1)[0];

    await applyEnactedPolicy(ctx, room, players, enacted, {
      source: "LEGISLATIVE",
      discardCards: drawn,
    });
    await resolveBotsIfNeeded(ctx, args.roomId);

    return { success: true };
  },
});

export const killPlayer = mutation({
    args: { roomId: v.string(), presidentId: v.string(), targetPlayerId: v.string() },
    handler: async (ctx, args) => {
        const room = await getRoomByRoomId(ctx, args.roomId);
        if (!room || room.phase !== PHASES.EXECUTIVE_ACTION) return { success: false };
        if (room.currentPresidentId !== args.presidentId || room.executivePower !== EXECUTIVE_POWERS.EXECUTION) {
            return { success: false, error: "Invalid executive action" };
        }
        const players = await getPlayersByRoomId(ctx, args.roomId);
        const resolved = await resolveExecution(ctx, room, players, args.targetPlayerId);
        if (!resolved) return { success: false };
        await resolveBotsIfNeeded(ctx, args.roomId);

        return { success: true };
    }
});

export const investigateLoyalty = mutation({
    args: { roomId: v.string(), presidentId: v.string(), targetPlayerId: v.string() },
    handler: async (ctx, args) => {
        const room = await getRoomByRoomId(ctx, args.roomId);
        if (!room || room.phase !== PHASES.EXECUTIVE_ACTION) return { success: false };
        if (room.currentPresidentId !== args.presidentId || room.executivePower !== EXECUTIVE_POWERS.INVESTIGATE) {
            return { success: false, error: "Invalid executive action" };
        }

        const players = await getPlayersByRoomId(ctx, args.roomId);
        const target = getPlayerById(players, args.targetPlayerId);
        if (!target || !target.isAlive || target.playerId === args.presidentId) {
            return { success: false, error: "Invalid target" };
        }

        const resolved = await resolveInvestigation(ctx, room, players, args.presidentId, args.targetPlayerId);
        if (!resolved) {
            return { success: false, error: "Already investigated" };
        }

        await resolveBotsIfNeeded(ctx, args.roomId);
        return { success: true };
    }
});

export const callSpecialElection = mutation({
    args: { roomId: v.string(), presidentId: v.string(), targetPlayerId: v.string() },
    handler: async (ctx, args) => {
        const room = await getRoomByRoomId(ctx, args.roomId);
        if (!room || room.phase !== PHASES.EXECUTIVE_ACTION) return { success: false };
        if (room.currentPresidentId !== args.presidentId || room.executivePower !== EXECUTIVE_POWERS.SPECIAL_ELECTION) {
            return { success: false, error: "Invalid executive action" };
        }

        const players = await getPlayersByRoomId(ctx, args.roomId);
        const target = getPlayerById(players, args.targetPlayerId);
        if (!target || !target.isAlive || target.playerId === args.presidentId) {
            return { success: false, error: "Invalid target" };
        }

        await beginSpecialElection(ctx, room, players, args.presidentId, args.targetPlayerId);
        await resolveBotsIfNeeded(ctx, args.roomId);
        return { success: true };
    }
});

export const completePolicyPeek = mutation({
    args: { roomId: v.string(), presidentId: v.string() },
    handler: async (ctx, args) => {
        const room = await getRoomByRoomId(ctx, args.roomId);
        if (!room || room.phase !== PHASES.EXECUTIVE_ACTION) return { success: false };
        if (room.currentPresidentId !== args.presidentId || room.executivePower !== EXECUTIVE_POWERS.PEEK) {
            return { success: false, error: "Invalid executive action" };
        }

        const players = await getPlayersByRoomId(ctx, args.roomId);
        await startNextNomination(ctx, room, players, { executivePower: undefined });
        await resolveBotsIfNeeded(ctx, args.roomId);
        return { success: true };
    }
});

export const wipeAllData = mutation({
    args: {},
    handler: async (ctx) => {
        const rooms = await ctx.db.query("rooms").collect();
        const players = await ctx.db.query("players").collect();
        const logs = await ctx.db.query("gameLog").collect();

        for (const room of rooms) await ctx.db.delete(room._id);
        for (const player of players) await ctx.db.delete(player._id);
        for (const log of logs) await ctx.db.delete(log._id);
        return { success: true, wiped: { rooms: rooms.length, players: players.length, logs: logs.length } };
    }
});

function isFascistSidePlayer(player: any) {
  return player?.role === ROLES.FASCIST || player?.role === ROLES.HITLER;
}

function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function pickWeightedPlayer(players: any[], getWeight: (player: any) => number) {
  const weightedPlayers = players
    .map((player) => ({
      player,
      weight: Math.max(0.05, getWeight(player)),
    }))
    .filter((entry) => entry.weight > 0);

  if (!weightedPlayers.length) return pickRandomItem(players);

  const totalWeight = weightedPlayers.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of weightedPlayers) {
    roll -= entry.weight;
    if (roll <= 0) return entry.player;
  }

  return weightedPlayers[weightedPlayers.length - 1]?.player || pickRandomItem(players);
}

function getPolicyBuckets(cards: string[]) {
  const liberalIndices: number[] = [];
  const fascistIndices: number[] = [];

  cards.forEach((card, index) => {
    if (card === CARD_TYPES.LIBERAL) {
      liberalIndices.push(index);
    } else {
      fascistIndices.push(index);
    }
  });

  return { liberalIndices, fascistIndices };
}

function getBotNominationTarget(room: any, players: any[]) {
  const president = getPlayerById(players, room.currentPresidentId);
  const eligibleIds = getEligibleChancellorIds(room, players, room.currentPresidentId);
  const eligiblePlayers = players.filter((player) => eligibleIds.includes(player.playerId));
  if (eligiblePlayers.length === 0) return null;

  return pickWeightedPlayer(eligiblePlayers, (candidate) => {
    let score = 1;

    if (isFascistSidePlayer(president)) {
      if (room.fascistPolicies >= 3 && candidate.role === ROLES.HITLER) {
        score += 14;
      } else if (isFascistSidePlayer(candidate)) {
        score += 8;
      } else {
        score += 2.5;
      }

      if (room.electionTracker === 2 && !isFascistSidePlayer(candidate)) {
        score += 0.75;
      }
    } else {
      if (candidate.role === ROLES.LIBERAL) {
        score += 8;
      } else if (candidate.role === ROLES.FASCIST) {
        score += 1.7;
      } else {
        score += room.fascistPolicies >= 3 ? 0.3 : 1.2;
      }

      if (room.electionTracker === 2 && candidate.role === ROLES.LIBERAL) {
        score += 1.5;
      }
    }

    score *= candidate.isBot ? 0.92 : 1.08;
    return score + Math.random() * 0.75;
  });
}

function getRandomLivingTarget(players: any[], excludePlayerId?: string) {
  const eligiblePlayers = players.filter(
    (player) => player.isAlive && player.playerId !== excludePlayerId,
  );
  return pickRandomItem(eligiblePlayers);
}

function chooseBotPresidentDiscardIndex(president: any, room: any) {
  const { liberalIndices, fascistIndices } = getPolicyBuckets(room.drawnCards || []);

  if (president?.role === ROLES.LIBERAL) {
    return fascistIndices[0] ?? liberalIndices[0] ?? 0;
  }

  if (!liberalIndices.length) return fascistIndices[0] ?? 0;
  if (!fascistIndices.length) return liberalIndices[0] ?? 0;
  if (room.fascistPolicies >= 5 || room.liberalPolicies >= 4) return liberalIndices[0];

  if (fascistIndices.length >= 2) {
    return Math.random() > 0.12 ? liberalIndices[0] : fascistIndices[0];
  }

  return Math.random() > 0.22 ? liberalIndices[0] : fascistIndices[0];
}

function chooseBotEnactIndex(chancellor: any, room: any) {
  const { liberalIndices, fascistIndices } = getPolicyBuckets(room.drawnCards || []);

  if (chancellor?.role === ROLES.LIBERAL) {
    return liberalIndices[0] ?? fascistIndices[0] ?? 0;
  }

  if (!fascistIndices.length) return liberalIndices[0] ?? 0;
  if (!liberalIndices.length) return fascistIndices[0] ?? 0;
  if (room.fascistPolicies >= 5 || room.liberalPolicies >= 4) return fascistIndices[0];

  return Math.random() > 0.18 ? fascistIndices[0] : liberalIndices[0];
}

function shouldBotRequestVeto(chancellor: any, room: any) {
  if (room.fascistPolicies < 5 || (room.drawnCards || []).length < 2) return false;

  const { liberalIndices, fascistIndices } = getPolicyBuckets(room.drawnCards);

  if (chancellor?.role === ROLES.LIBERAL) {
    return fascistIndices.length === room.drawnCards.length;
  }

  if (liberalIndices.length === room.drawnCards.length) {
    return Math.random() > 0.25;
  }

  return false;
}

function shouldBotAcceptVeto(president: any, room: any) {
  if ((room.drawnCards || []).length < 2) return false;

  const { liberalIndices, fascistIndices } = getPolicyBuckets(room.drawnCards);

  if (president?.role === ROLES.LIBERAL) {
    return fascistIndices.length === room.drawnCards.length;
  }

  return liberalIndices.length === room.drawnCards.length;
}

function getBotInvestigationTarget(president: any, room: any, players: any[]) {
  const investigatedPlayerIds = room.investigatedPlayerIds || [];
  const eligibleTargets = players.filter(
    (player) =>
      player.isAlive &&
      player.playerId !== president.playerId &&
      !investigatedPlayerIds.includes(player.playerId),
  );

  return pickWeightedPlayer(eligibleTargets, (candidate) => {
    let score = 1;

    if (isFascistSidePlayer(president)) {
      score += candidate.role === ROLES.LIBERAL ? 3.5 : 1.2;
    } else {
      score += isFascistSidePlayer(candidate) ? 4.2 : 1.4;
    }

    if (!candidate.isBot) score += 1;
    return score + Math.random() * 0.4;
  });
}

function getBotSpecialElectionTarget(president: any, room: any, players: any[]) {
  const eligibleTargets = players.filter(
    (player) => player.isAlive && player.playerId !== president.playerId,
  );

  return pickWeightedPlayer(eligibleTargets, (candidate) => {
    let score = 1;

    if (isFascistSidePlayer(president)) {
      if (room.fascistPolicies >= 3 && candidate.role === ROLES.HITLER) {
        score += 10;
      } else if (isFascistSidePlayer(candidate)) {
        score += 5;
      } else {
        score += 1.5;
      }
    } else {
      score += candidate.role === ROLES.LIBERAL ? 5 : 1.2;
    }

    if (!candidate.isBot) score += 0.6;
    return score + Math.random() * 0.4;
  });
}

function getBotExecutionTarget(president: any, room: any, players: any[]) {
  const eligibleTargets = players.filter(
    (player) => player.isAlive && player.playerId !== president.playerId,
  );

  return pickWeightedPlayer(eligibleTargets, (candidate) => {
    let score = 1;

    if (isFascistSidePlayer(president)) {
      score += candidate.role === ROLES.LIBERAL ? 6 : 1;
    } else if (candidate.role === ROLES.HITLER) {
      score += room.fascistPolicies >= 4 ? 9 : 6;
    } else if (candidate.role === ROLES.FASCIST) {
      score += 6;
    } else {
      score += 1;
    }

    if (!candidate.isBot) score += 0.5;
    return score + Math.random() * 0.5;
  });
}

export const runScheduledBotStep = internalMutation({
  args: { roomId: v.string(), scheduledAt: v.number() },
  handler: async (ctx, args) => {
    const room = await getRoomByRoomId(ctx, args.roomId);
    if (!room) return { success: false, reason: "ROOM_MISSING" };

    if (room.botThinkAt !== args.scheduledAt) {
      return { success: false, reason: "STALE_SCHEDULE" };
    }

    const players = await getPlayersByRoomId(ctx, args.roomId);
    if (!roomNeedsBotStep(room, players)) {
      await ctx.db.patch(room._id, { botThinkAt: undefined });
      return { success: false, reason: "NO_BOT_STEP" };
    }

    await ctx.db.patch(room._id, { botThinkAt: undefined });

    const acted = await resolveSingleBotStep(ctx, room, players);
    if (!acted) {
      return { success: false, reason: "BOT_IDLE" };
    }

    await resolveBotsIfNeeded(ctx, args.roomId);
    return { success: true };
  },
});

export const processBots = mutation({
  args: { roomId: v.string(), playerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const players = await getPlayersByRoomId(ctx, args.roomId);
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject || args.playerId;
    const caller = callerId ? getPlayerById(players, callerId) : null;

    if (!caller?.isHost) {
      return { success: false, error: "Only the host can manually trigger bots" };
    }

    await resolveBotsIfNeeded(ctx, args.roomId);
    return { success: true };
  },
});

export const getGameState = query({
    args: { roomId: v.string(), playerId: v.union(v.string(), v.null()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const room = await getRoomByRoomId(ctx, args.roomId);
        if (!room) return null;

        const players = await getPlayersByRoomId(ctx, args.roomId);

        const callerId = identity?.subject || args.playerId;
        const me = players.find(p => p.playerId === callerId);
        
        const isGameOver = room.phase === PHASES.GAME_OVER;
        const isFascist = me?.role === ROLES.FASCIST;
        const isHitler = me?.role === ROLES.HITLER;
        const hitlerKnowsFascists = players.length <= 6;
        const alivePlayers = getAlivePlayers(players);
        const termLimitedPlayerIds = [
          room.previousChancellorId,
          alivePlayers.length > 5 ? room.previousPresidentId : undefined,
        ].filter(Boolean);

        const peekedPolicies =
          room.executivePower === EXECUTIVE_POWERS.PEEK && room.lastPeekedById === callerId
            ? room.lastPeekedPolicies || []
            : [];

        const investigationResult =
          room.lastInvestigatedById === callerId && room.lastInvestigatedPlayerId && room.lastInvestigationParty
            ? {
                playerId: room.lastInvestigatedPlayerId,
                party: room.lastInvestigationParty,
              }
            : null;

        return {
            ...room,
            currentPresident: room.currentPresidentId,
            currentChancellor: room.currentChancellorId,
            nominatedChancellor: room.nominatedChancellorId,
            botThinkAt: undefined,
            lastPeekedPolicies: undefined,
            lastPeekedById: undefined,
            lastInvestigatedPlayerId: undefined,
            lastInvestigationParty: undefined,
            lastInvestigatedById: undefined,
            players: players.map(p => {
                const isSelf = p.playerId === me?.playerId;
                let visibleRole = undefined;
                let visibleParty = undefined; 

                const isTargetFascistOrHitler = p.role === ROLES.FASCIST || p.role === ROLES.HITLER;

                if (isGameOver || isSelf) {
                    visibleRole = p.role;
                    visibleParty = p.party;
                } else if (isFascist && isTargetFascistOrHitler) {
                    // Fascists know fellow fascists and Hitler
                    visibleRole = p.role;
                    visibleParty = p.party;
                } else if (isHitler && hitlerKnowsFascists && p.role === ROLES.FASCIST) {
                    // In 5-6 player games, Hitler knows the fascist teammate.
                    visibleRole = p.role;
                    visibleParty = p.party;
                }

                return {
                    ...p,
                    id: p.playerId, // Backward compatibility
                    hasVoted: p.vote !== undefined, // Backward compatibility
                    lastVote: room.phase !== PHASES.VOTING ? p.vote : undefined,
                    role: visibleRole,
                    party: visibleParty,
                };
            }),
            // Hide deck details from everyone
            drawPile: undefined,
            drawPileCount: room.drawPile.length,
            discardPile: undefined,
            discardPileCount: room.discardPile.length,
            drawnCards: (room.phase === PHASES.LEGISLATIVE_PRESIDENT && room.currentPresidentId === callerId) ||
                        (room.phase === PHASES.LEGISLATIVE_CHANCELLOR && room.currentChancellorId === callerId)
                        ? room.drawnCards : [],
            amIPresident: room.currentPresidentId === callerId,
            amIChancellor: room.currentChancellorId === callerId,
            myPlayerId: callerId,
            executivePower: room.executivePower || null,
            vetoAvailable: room.phase === PHASES.LEGISLATIVE_CHANCELLOR && room.fascistPolicies >= 5,
            vetoRequested: Boolean(room.vetoRequested),
            vetoRejected: Boolean(room.vetoRejected),
            chaosTriggered: Boolean(room.chaosTriggered),
            chaosPolicy: room.chaosPolicy || null,
            peekedPolicies,
            investigationResult,
            lastGovernment:
              room.previousPresidentId || room.previousChancellorId
                ? {
                    presidentId: room.previousPresidentId || null,
                    chancellorId: room.previousChancellorId || null,
                  }
                : null,
            eligibleChancellorIds:
              room.phase === PHASES.NOMINATION && room.currentPresidentId === callerId
                ? getEligibleChancellorIds(room, players, callerId)
                : [],
            termLimitedPlayerIds,
        };
    },
});


export const getGameLog = query({
    args: { roomId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("gameLog")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .order("desc")
            .take(12);
    },
});

// Internal non-exported logic helpers (In Convex, these are just TS functions called by mutations)

async function startNextNomination(ctx: any, room: any, players: any[], extraPatch: any = {}) {
  const originPresidentId = room.specialElectionCallerId || room.currentPresidentId;
  const nextPresident = getNextPresident(players, originPresidentId);
  if (!nextPresident) return room;

  await clearVotes(ctx, players);
  const nextRoom = await setRoomState(ctx, room, players, {
    phase: PHASES.NOMINATION,
    currentPresidentId: nextPresident.playerId,
    currentChancellorId: undefined,
    nominatedChancellorId: undefined,
    drawnCards: [],
    executivePower: undefined,
    vetoRequested: undefined,
    vetoRejected: undefined,
    chaosTriggered: false,
    chaosPolicy: undefined,
    specialElectionCallerId: undefined,
    botThinkAt: undefined,
    ...extraPatch,
  });

  await logSystem(ctx.db, room.roomId, `New Presidential candidate is ${nextPresident.name}.`);
  return nextRoom;
}

async function finishGame(ctx: any, room: any, players: any[], winner: string, winReason: string) {
  return setRoomState(ctx, room, players, {
    phase: PHASES.GAME_OVER,
    status: "FINISHED",
    winner,
    winReason,
    executivePower: undefined,
    vetoRequested: undefined,
    vetoRejected: undefined,
    chaosTriggered: false,
    chaosPolicy: undefined,
    botThinkAt: undefined,
  });
}

async function beginLegislativeSession(
  ctx: any,
  room: any,
  players: any[],
  lastVotes: Record<string, string>,
) {
  const nominatedChancellor = getPlayerById(players, room.nominatedChancellorId);
  const yesVotes = Object.values(lastVotes).filter((vote) => vote === VOTES.YA).length;
  const noVotes = Object.values(lastVotes).length - yesVotes;

  if (room.fascistPolicies >= 3 && nominatedChancellor?.role === ROLES.HITLER) {
    await finishGame(
      ctx,
      room,
      players,
      FACTIONS.FASCIST,
      "Hitler was elected Chancellor after 3 Fascist policies.",
    );
    return { success: true, result: "HITLER_ELECTED" };
  }

  const deckState = drawCards(room.drawPile, room.discardPile, 3);
  await setRoomState(ctx, room, players, {
    phase: PHASES.LEGISLATIVE_PRESIDENT,
    currentChancellorId: room.nominatedChancellorId,
    electionTracker: 0,
    lastVotes,
    drawPile: deckState.drawPile,
    discardPile: deckState.discardPile,
    drawnCards: deckState.drawnCards,
    executivePower: undefined,
    vetoRequested: undefined,
    vetoRejected: undefined,
    chaosTriggered: false,
    chaosPolicy: undefined,
    botThinkAt: undefined,
  });

  await logSystem(ctx.db, room.roomId, `Election passed (${yesVotes}-${noVotes}). Legislative session starting.`);
  return { success: true, result: "LEGISLATIVE" };
}

async function resolveChaos(ctx: any, room: any, players: any[]) {
  const deckState = drawCards(room.drawPile, room.discardPile, 1);
  const chaosPolicy = deckState.drawnCards[0];

  if (!chaosPolicy) {
    return startNextNomination(ctx, room, players, {
      electionTracker: 0,
      previousPresidentId: undefined,
      previousChancellorId: undefined,
      currentChancellorId: undefined,
      nominatedChancellorId: undefined,
    });
  }

  const liberalPolicies =
    chaosPolicy === CARD_TYPES.LIBERAL ? room.liberalPolicies + 1 : room.liberalPolicies;
  const fascistPolicies =
    chaosPolicy === CARD_TYPES.FASCIST ? room.fascistPolicies + 1 : room.fascistPolicies;

  const chaosRoom = await setRoomState(ctx, room, players, {
    drawPile: deckState.drawPile,
    discardPile: deckState.discardPile,
    liberalPolicies,
    fascistPolicies,
    electionTracker: 0,
    drawnCards: [],
    currentChancellorId: undefined,
    nominatedChancellorId: undefined,
    previousPresidentId: undefined,
    previousChancellorId: undefined,
    executivePower: undefined,
    vetoRequested: undefined,
    vetoRejected: undefined,
    chaosTriggered: true,
    chaosPolicy,
  });

  await logSystem(ctx.db, room.roomId, `Chaos triggered. The top policy was auto-enacted as ${chaosPolicy}.`);

  if (liberalPolicies >= 5) {
    await finishGame(ctx, chaosRoom, players, FACTIONS.LIBERAL, "5 Liberal policies enacted.");
    return chaosRoom;
  }

  if (fascistPolicies >= 6) {
    await finishGame(ctx, chaosRoom, players, FACTIONS.FASCIST, "6 Fascist policies enacted.");
    return chaosRoom;
  }

  return startNextNomination(ctx, chaosRoom, players, {
    previousPresidentId: undefined,
    previousChancellorId: undefined,
    chaosTriggered: true,
    chaosPolicy,
  });
}

async function advanceElectionTracker(
  ctx: any,
  room: any,
  players: any[],
  reason: string,
  extraPatch: any = {},
) {
  const nextTracker = room.electionTracker + 1;
  await logSystem(ctx.db, room.roomId, `${reason} Tracker: ${nextTracker}/3.`);

  if (nextTracker >= 3) {
    const chaosRoom = await setRoomState(ctx, room, players, {
      electionTracker: 0,
      ...extraPatch,
    });
    return resolveChaos(ctx, chaosRoom, players);
  }

  const updatedRoom = await setRoomState(ctx, room, players, {
    electionTracker: nextTracker,
    ...extraPatch,
  });

  return startNextNomination(ctx, updatedRoom, players);
}

async function applyEnactedPolicy(
  ctx: any,
  room: any,
  players: any[],
  enactedPolicy: string,
  options: {
    source: "LEGISLATIVE" | "CHAOS";
    discardCards?: string[];
    ignorePower?: boolean;
  },
) {
  const liberalPolicies =
    enactedPolicy === CARD_TYPES.LIBERAL ? room.liberalPolicies + 1 : room.liberalPolicies;
  const fascistPolicies =
    enactedPolicy === CARD_TYPES.FASCIST ? room.fascistPolicies + 1 : room.fascistPolicies;
  const discardCards = options.discardCards || [];

  const patch: any = {
    liberalPolicies,
    fascistPolicies,
    discardPile: [...room.discardPile, ...discardCards],
    drawnCards: [],
    vetoRequested: undefined,
    vetoRejected: undefined,
    botThinkAt: undefined,
  };

  if (options.source === "LEGISLATIVE") {
    patch.previousPresidentId = room.currentPresidentId;
    patch.previousChancellorId = room.currentChancellorId;
  }

  const enactedRoom = await setRoomState(ctx, room, players, patch);
  await logSystem(ctx.db, room.roomId, `Enacted a ${enactedPolicy} policy.`);

  if (liberalPolicies >= 5) {
    await finishGame(ctx, enactedRoom, players, FACTIONS.LIBERAL, "5 Liberal policies enacted.");
    return enactedRoom;
  }

  if (fascistPolicies >= 6) {
    await finishGame(ctx, enactedRoom, players, FACTIONS.FASCIST, "6 Fascist policies enacted.");
    return enactedRoom;
  }

  if (options.source === "CHAOS" || options.ignorePower || enactedPolicy !== CARD_TYPES.FASCIST) {
    return startNextNomination(ctx, enactedRoom, players);
  }

  const executivePower = getExecutivePower(players.length, fascistPolicies);
  if (!executivePower) {
    return startNextNomination(ctx, enactedRoom, players);
  }

  if (executivePower === EXECUTIVE_POWERS.PEEK) {
    const peekState = peekCards(enactedRoom.drawPile, enactedRoom.discardPile, 3);
    const peekRoom = await setRoomState(ctx, enactedRoom, players, {
      phase: PHASES.EXECUTIVE_ACTION,
      executivePower,
      drawPile: peekState.drawPile,
      discardPile: peekState.discardPile,
      lastPeekedPolicies: peekState.peekedCards,
      lastPeekedById: enactedRoom.currentPresidentId,
      chaosTriggered: false,
      chaosPolicy: undefined,
    });
    await logSystem(ctx.db, room.roomId, "President is reviewing the top three policies.");
    return peekRoom;
  }

  const actionRoom = await setRoomState(ctx, enactedRoom, players, {
    phase: PHASES.EXECUTIVE_ACTION,
    executivePower,
    chaosTriggered: false,
    chaosPolicy: undefined,
  });

  await logSystem(
    ctx.db,
    room.roomId,
    executivePower === EXECUTIVE_POWERS.INVESTIGATE
      ? "President must investigate party loyalty."
      : executivePower === EXECUTIVE_POWERS.SPECIAL_ELECTION
        ? "President must call a special election."
        : "President must execute a player.",
  );

  return actionRoom;
}

async function tallyVotes(ctx: any, room: any, players: any[], finalVotes: Record<string, string>) {
  const alivePlayers = getAlivePlayers(players);
  const yesVotes = alivePlayers.filter((player) => finalVotes[player.playerId] === VOTES.YA).length;
  const noVotes = alivePlayers.length - yesVotes;

  if (yesVotes > noVotes) {
    return beginLegislativeSession(ctx, room, players, finalVotes);
  }

  const updatedRoom = await setRoomState(ctx, room, players, {
    lastVotes: finalVotes,
    currentChancellorId: undefined,
  });

  await logSystem(ctx.db, room.roomId, `Election failed (${yesVotes}-${noVotes}).`);
  await advanceElectionTracker(ctx, updatedRoom, players, "Government failed.");
  return { success: true, result: "FAILED" };
}
