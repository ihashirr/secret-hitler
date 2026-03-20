import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

const ROLE_COUNTS: Record<number, Record<string, number>> = {
  5: { [ROLES.LIBERAL]: 3, [ROLES.FASCIST]: 1, [ROLES.HITLER]: 1 },
  6: { [ROLES.LIBERAL]: 4, [ROLES.FASCIST]: 1, [ROLES.HITLER]: 1 },
  7: { [ROLES.LIBERAL]: 4, [ROLES.FASCIST]: 2, [ROLES.HITLER]: 1 },
  8: { [ROLES.LIBERAL]: 5, [ROLES.FASCIST]: 2, [ROLES.HITLER]: 1 },
  9: { [ROLES.LIBERAL]: 5, [ROLES.FASCIST]: 3, [ROLES.HITLER]: 1 },
  10: { [ROLES.LIBERAL]: 6, [ROLES.FASCIST]: 3, [ROLES.HITLER]: 1 },
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helpers
async function logSystem(db: any, roomId: string, message: string) {
  await db.insert("gameLog", {
    roomId,
    message: `[System] ${message}`,
    timestamp: Date.now(),
  });
}

// Mutations

export const joinRoom = mutation({
  args: { roomId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const playerId = identity?.subject || `anonymous_${Math.random().toString(36).substr(2, 9)}`;

    let room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!room) {
        // Create a new room if it doesn't exist
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
        });
    }

    // Check if player already in room
    const existing = await ctx.db
        .query("players")
        .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
        .filter(q => q.eq(q.field("playerId"), playerId))
        .unique();

    if (!existing) {
        const players = await ctx.db
            .query("players")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .collect();
        
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
        });
        await logSystem(ctx.db, args.roomId, `${args.name} joined the room.`);
    }

    return { success: true, playerId };
  },
});

export const toggleReady = mutation({
    args: { roomId: v.string(), playerId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .filter(q => q.eq(q.field("playerId"), args.playerId))
            .unique();
        if (!player) return { success: false };

        const newReady = !player.isReady;
        await ctx.db.patch(player._id, { isReady: newReady });

        // Check if everyone is ready to start nomination
        const room = await ctx.db
            .query("rooms")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .unique();
        
        if (room && room.phase === PHASES.ROLE_REVEAL) {
            const players = await ctx.db
                .query("players")
                .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
                .collect();
            
            // Re-calculate notReady based on current player's NEW state
            const readyCount = players.filter(p => 
                p.playerId === args.playerId ? newReady : p.isReady
            ).length;

            console.log(`[toggleReady] Room: ${args.roomId}, Ready: ${readyCount}/${players.length}`);
            
            if (readyCount === players.length && newReady) {
                console.log(`[toggleReady] TRANSITIONING to NOMINATION for room: ${args.roomId}`);
                await ctx.db.patch(room._id, { 
                    phase: PHASES.NOMINATION,
                    // Ensure nominated/current chancellor are clear
                    nominatedChancellorId: undefined,
                    currentChancellorId: undefined,
                });
                await logSystem(ctx.db, args.roomId, "All operatives confirmed. Beginning mission.");
            }
        }

        return { success: true };
    }
});

export const leaveRoom = mutation({
    args: { roomId: v.string(), playerId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db
            .query("players")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .filter(q => q.eq(q.field("playerId"), args.playerId))
            .unique();
        if (!player) return { success: false };

        await ctx.db.delete(player._id);
        await logSystem(ctx.db, args.roomId, `${player.name} left the room.`);

        // Reassign host if necessary
        if (player.isHost) {
            const others = await ctx.db
                .query("players")
                .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
                .collect();
            if (others.length > 0) {
                await ctx.db.patch(others[0]._id, { isHost: true });
            }
        }
        return { success: true };
    }
});

export const resetRoom = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();
    if (!room) return { success: false };

    const players = await ctx.db
        .query("players")
        .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
        .collect();

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
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!room || room.phase !== PHASES.LOBBY) return { success: false, error: "Game already started or room not found" };

    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (players.length < 5 || players.length > 10) return { success: false, error: "Need 5-10 players" };

    // 1. Assign Roles
    const counts = ROLE_COUNTS[players.length];
    let roles = [
      ...Array(counts[ROLES.LIBERAL]).fill({ role: ROLES.LIBERAL, party: FACTIONS.LIBERAL }),
      ...Array(counts[ROLES.FASCIST]).fill({ role: ROLES.FASCIST, party: FACTIONS.FASCIST }),
      { role: ROLES.HITLER, party: FACTIONS.FASCIST }
    ];
    roles = shuffle(roles);
    
    // Shuffle players around table
    const shuffledPlayers = shuffle(players);
    for (let i = 0; i < shuffledPlayers.length; i++) {
        await ctx.db.patch(shuffledPlayers[i]._id, {
            role: roles[i].role,
            party: roles[i].party,
            isAlive: true,
            isReady: false,
            position: i,
        });
    }

    // 2. Initialize Deck
    const drawPile = shuffle([
      ...Array(6).fill(CARD_TYPES.LIBERAL),
      ...Array(11).fill(CARD_TYPES.FASCIST)
    ]);

    // Choose random starting president
    const presidentIndex = Math.floor(Math.random() * shuffledPlayers.length);
    const presidentId = shuffledPlayers[presidentIndex].playerId;

    await ctx.db.patch(room._id, {
        phase: PHASES.ROLE_REVEAL,
        drawPile,
        discardPile: [],
        drawnCards: [],
        liberalPolicies: 0,
        fascistPolicies: 0,
        electionTracker: 0,
        currentPresidentId: presidentId,
        status: "ACTIVE"
    });

    await logSystem(ctx.db, args.roomId, "The game has begun.");
    return { success: true };
  },
});

export const nominateChancellor = mutation({
  args: { roomId: v.string(), presidentId: v.string(), chancellorId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!room || room.phase !== PHASES.NOMINATION) return { success: false };
    if (room.currentPresidentId !== args.presidentId) return { success: false, error: "Not your turn" };
    
    // Check term limits
    if (args.chancellorId === room.previousChancellorId) return { success: false, error: "Term limit" };
    
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const aliveCount = players.filter(p => p.isAlive).length;
    // Only check previous president if > 5 players alive
    if (aliveCount > 5 && args.chancellorId === room.previousPresidentId) {
        return { success: false, error: "Term limit" };
    }

    await ctx.db.patch(room._id, {
        nominatedChancellorId: args.chancellorId,
        phase: PHASES.VOTING
    });

    // Clear previous votes
    for (const p of players) {
        await ctx.db.patch(p._id, { vote: undefined });
    }

    await logSystem(ctx.db, args.roomId, `President nominated someone as Chancellor.`);
    return { success: true };
  },
});

export const castVote = mutation({
  args: { roomId: v.string(), playerId: v.string(), vote: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .filter(q => q.eq(q.field("playerId"), args.playerId))
      .unique();

    if (!player || !player.isAlive) return { success: false };

    await ctx.db.patch(player._id, { vote: args.vote });

    // Check if everyone voted
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const alivePlayers = players.filter(p => p.isAlive);
    const votesReceived = alivePlayers.filter(p => p.vote !== undefined);

    if (votesReceived.length === alivePlayers.length) {
        // Automatically tally
        const room = await ctx.db
            .query("rooms")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .unique();
        if (!room) return { success: true };

        let yes = 0;
        let no = 0;
        for (const p of alivePlayers) {
            // Need to account for the current vote which might not be in the 'players' fetch yet
            const finalVote = p.playerId === args.playerId ? args.vote : p.vote;
            if (finalVote === "YA") yes++; else no++;
        }

        console.log(`[castVote] Tallying: ${yes} YA, ${no} NEIN`);

        if (yes > no) {
            // ELECTION PASSES
            await ctx.db.patch(room._id, {
                phase: PHASES.LEGISLATIVE_PRESIDENT, // This should be set after drawing cards
                currentChancellorId: room.nominatedChancellorId,
                electionTracker: 0,
            });

            // Handle Hitler Win and Legislative start (copy-paste from tallyVotes)
            const chancellor = players.find(p => p.playerId === room.nominatedChancellorId);
            if (room.fascistPolicies >= 3 && chancellor?.role === ROLES.HITLER) {
                await ctx.db.patch(room._id, {
                    phase: PHASES.GAME_OVER,
                    winner: FACTIONS.FASCIST,
                    winReason: "Hitler was elected Chancellor after 3 Fascist policies."
                });
                return { success: true };
            }

            // Start Legislative Session
            let drawPile = [...room.drawPile];
            let discardPile = [...room.discardPile];
            if (drawPile.length < 3) {
                drawPile = shuffle([...drawPile, ...discardPile]);
                discardPile = [];
            }
            const drawn = [drawPile.pop()!, drawPile.pop()!, drawPile.pop()!];

            await ctx.db.patch(room._id, {
                phase: PHASES.LEGISLATIVE_PRESIDENT,
                drawPile,
                discardPile,
                drawnCards: drawn
            });
            await logSystem(ctx.db, args.roomId, `Election passed (${yes}-${no}). Legislative session starting.`);
        } else {
            // ELECTION FAILS
            const newTracker = room.electionTracker + 1;
            await logSystem(ctx.db, args.roomId, `Election failed (${yes}-${no}). Tracker: ${newTracker}/3`);
            
            if (newTracker >= 3) {
                // Chaos... (simplified for now, using the helper)
                await startNextNomination(ctx, room, players); // Reset tracker happens inside if needed
                await ctx.db.patch(room._id, { electionTracker: 0 });
            } else {
                await ctx.db.patch(room._id, { electionTracker: newTracker });
                await startNextNomination(ctx, room, players);
            }
        }
    }

    return { success: true };
  },
});

export const presidentDrawPolicies = mutation({
  args: { roomId: v.string(), discardedIndex: v.number() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();
    if (!room || room.phase !== PHASES.LEGISLATIVE_PRESIDENT) return { success: false };

    const drawn = [...room.drawnCards];
    const discarded = drawn.splice(args.discardedIndex, 1)[0];
    
    await ctx.db.patch(room._id, {
        drawnCards: drawn,
        discardPile: [...room.discardPile, discarded],
        phase: PHASES.LEGISLATIVE_CHANCELLOR
    });

    return { success: true };
  },
});

export const chancellorEnactPolicy = mutation({
  args: { roomId: v.string(), enactedIndex: v.number() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .unique();
    if (!room || room.phase !== PHASES.LEGISLATIVE_CHANCELLOR) return { success: false };

    const drawn = [...room.drawnCards];
    const enacted = drawn.splice(args.enactedIndex, 1)[0];
    const discarded = drawn[0];

    const libCount = enacted === CARD_TYPES.LIBERAL ? room.liberalPolicies + 1 : room.liberalPolicies;
    const fasCount = enacted === CARD_TYPES.FASCIST ? room.fascistPolicies + 1 : room.fascistPolicies;

    await ctx.db.patch(room._id, {
        liberalPolicies: libCount,
        fascistPolicies: fasCount,
        discardPile: [...room.discardPile, discarded],
        drawnCards: [],
        previousPresidentId: room.currentPresidentId,
        previousChancellorId: room.currentChancellorId,
    });

    await logSystem(ctx.db, args.roomId, `Enacted a ${enacted} policy.`);

    // Check Win Condition
    if (libCount >= 5) {
        await ctx.db.patch(room._id, { phase: PHASES.GAME_OVER, winner: FACTIONS.LIBERAL, winReason: "5 Liberal policies enacted." });
    } else if (fasCount >= 6) {
        await ctx.db.patch(room._id, { phase: PHASES.GAME_OVER, winner: FACTIONS.FASCIST, winReason: "6 Fascist policies enacted." });
    } else {
        const players = await ctx.db
          .query("players")
          .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
          .collect();

        // Determine if an executive action is triggered by this fascist policy
        // Standard Secret Hitler rules: executive actions trigger at certain fascist policy thresholds
        // (for 5-6 players: 3=peek, 4=execution, 5=execution)
        // (for 7-8: 2=investigate, 3=elect, 4=execution, 5=execution)
        // (for 9-10: 1=investigate, 2=investigate, 3=elect, 4=execution, 5=execution)
        // For simplicity, we trigger EXECUTIVE_ACTION at 3, 4, 5 fascist policies (execution)
        const triggerExecAction = enacted === CARD_TYPES.FASCIST && (fasCount === 3 || fasCount === 4 || fasCount === 5);

        if (triggerExecAction) {
            await ctx.db.patch(room._id, { phase: PHASES.EXECUTIVE_ACTION });
            await logSystem(ctx.db, args.roomId, `President must now execute a player.`);
        } else {
            await startNextNomination(ctx, room, players);
        }
    }

    return { success: true };
  },
});

export const killPlayer = mutation({
    args: { roomId: v.string(), targetPlayerId: v.string() },
    handler: async (ctx, args) => {
        const player = await ctx.db
          .query("players")
          .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
          .filter(q => q.eq(q.field("playerId"), args.targetPlayerId))
          .unique();
        
        if (!player) return { success: false };

        await ctx.db.patch(player._id, { isAlive: false });
        await logSystem(ctx.db, args.roomId, `${player.name} has been executed.`);

        const room = await ctx.db
          .query("rooms")
          .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
          .unique();
        if (!room) return { success: true };

        // Check if Hitler was killed -> Liberals win
        if (player.role === ROLES.HITLER) {
            await ctx.db.patch(room._id, {
                phase: PHASES.GAME_OVER,
                winner: FACTIONS.LIBERAL,
                winReason: "Hitler was executed!"
            });
        } else {
            // Advance to the next nomination after the execution
            const players = await ctx.db
              .query("players")
              .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
              .collect();
            await startNextNomination(ctx, room, players);
        }

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

        console.log(`[wipeAllData] Wiped ${rooms.length} rooms, ${players.length} players, ${logs.length} logs.`);
        return { success: true, wiped: { rooms: rooms.length, players: players.length, logs: logs.length } };
    }
});
export const getGameState = query({
    args: { roomId: v.string(), playerId: v.union(v.string(), v.null()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const room = await ctx.db
            .query("rooms")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .unique();
        if (!room) return null;

        const players = await ctx.db
            .query("players")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .collect();

        // Identify calling player (use Auth if available, fallback to provided playerId)
        const callerId = identity?.subject || args.playerId;
        const me = players.find(p => p.playerId === callerId);
        
        const isGameOver = room.phase === PHASES.GAME_OVER;
        const isFascist = me?.role === ROLES.FASCIST;
        const isHitler = me?.role === ROLES.HITLER;
        // 5-6 players: Hitler doesn't know; 7+ players: Hitler knows.
        const hitlerKnowsFascists = players.length >= 7;

        return {
            ...room,
            currentPresident: room.currentPresidentId,
            currentChancellor: room.currentChancellorId,
            nominatedChancellor: room.nominatedChancellorId,
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
                    // In 7+ player games, Hitler knows fellow fascists
                    visibleRole = p.role;
                    visibleParty = p.party;
                }

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
            // Drawn cards only visible to acting President/Chancellor
            drawnCards: (room.phase === PHASES.LEGISLATIVE_PRESIDENT && room.currentPresidentId === callerId) ||
                        (room.phase === PHASES.LEGISLATIVE_CHANCELLOR && room.currentChancellorId === callerId)
                        ? room.drawnCards : [],
            // Server-side role flags — authoritative, avoids client ID mismatch
            amIPresident: room.currentPresidentId === callerId,
            amIChancellor: room.currentChancellorId === callerId,
            myPlayerId: callerId,
        };
    },
});

// Internal non-exported logic helpers (In Convex, these are just TS functions called by mutations)

async function startNextNomination(ctx: any, room: any, players: any[]) {
    // Logic to rotate president
    const alivePlayers = players.filter(p => p.isAlive).sort((a,b) => a.position - b.position);
    
    const currentPresident = players.find(p => p.playerId === room.currentPresidentId);
    const currentPosition = currentPresident?.position ?? -1;
    
    // Find the next alive player after the current position
    let nextPresident = alivePlayers.find(p => p.position > currentPosition);
    if (!nextPresident) {
        nextPresident = alivePlayers[0]; // Wrap around
    }

    await ctx.db.patch(room._id, {
        phase: PHASES.NOMINATION,
        currentPresidentId: nextPresident.playerId,
        currentChancellorId: undefined,
        nominatedChancellorId: undefined,
    });

    await logSystem(ctx.db, room.roomId, `New Presidential candidate is ${nextPresident.name}.`);
}
