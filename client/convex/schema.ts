import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    roomId: v.string(), // A unique slug or ID used in URLs
    phase: v.string(), // "LOBBY", "ROLE_REVEAL", "NOMINATION", "VOTING", etc.
    status: v.string(), // "ACTIVE", "FINISHED"
    electionTracker: v.number(),
    drawPile: v.array(v.string()), // Array of "LIBERAL" | "FASCIST"
    discardPile: v.array(v.string()),
    drawnCards: v.array(v.string()), // Cards currently being considered by President/Chancellor
    liberalPolicies: v.number(),
    fascistPolicies: v.number(),
    currentPresidentId: v.optional(v.string()), // playerId
    currentChancellorId: v.optional(v.string()), 
    nominatedChancellorId: v.optional(v.string()),
    previousPresidentId: v.optional(v.string()),
    previousChancellorId: v.optional(v.string()),
    winner: v.optional(v.string()), // "LIBERAL" | "FASCIST"
    winReason: v.optional(v.string()),
  }).index("by_roomId", ["roomId"]),

  players: defineTable({
    roomId: v.string(),
    playerId: v.string(), // Permanent identifier (socket ID or unique name)
    name: v.string(),
    role: v.optional(v.string()), // "LIBERAL" | "FASCIST" | "HITLER"
    party: v.optional(v.string()), // "LIBERAL" | "FASCIST"
    isAlive: v.boolean(),
    isPresident: v.boolean(),
    isChancellor: v.boolean(),
    isReady: v.boolean(),
    isHost: v.boolean(),
    position: v.number(), // Shuffled order around the table
    vote: v.optional(v.string()), // "YA" | "NEIN"
  }).index("by_roomId", ["roomId"]).index("by_playerId", ["playerId"]),

  gameLog: defineTable({
    roomId: v.string(),
    message: v.string(),
    timestamp: v.number(),
  }).index("by_roomId", ["roomId"]),
});
