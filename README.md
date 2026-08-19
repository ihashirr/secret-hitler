# Eclipse — Real-Time Social Deduction Game

A browser-based multiplayer adaptation of **Secret Hitler** built around a server-authoritative game state, real-time Convex synchronization, phase-driven UI, and automated bot players.

The engineering focus is the game engine: elections, hidden roles, policy decks, legislative sessions, executive powers, win conditions, reconnectable room state, and client transitions all have to remain consistent across multiple players.

> **Stack:** Next.js 16 · React 19 · Convex · Tailwind CSS 4 · Framer Motion

## What is actually implemented

- **5–10 player rooms** with automatically assigned host ownership
- Anonymous room joining with generated player identities when no authenticated identity exists
- Role distribution for Liberal, Fascist, and Hitler based on player count
- Server-side policy deck creation, draw/discard piles, and reshuffling
- Complete government cycle: President → Chancellor nomination → voting → legislative session
- Term-limit checks for Chancellor eligibility
- Election tracker and chaos-policy handling
- Liberal and Fascist policy tracks
- Veto flow once the Fascist track permits it
- Executive powers that vary by player count and policy progress:
  - loyalty investigation
  - special election
  - policy peek
  - execution
- Hitler-specific victory/loss conditions
- Player elimination and living-player rotation
- Persistent game log per room
- Room reset and host reassignment when the host leaves
- Automated bot players with delayed server-scheduled turns
- Bot decision logic for voting, nominations, legislative choices, vetoes, investigations, special elections, and executions

## State machine

The backend models the match as explicit phases rather than letting individual clients infer what happens next.

```text
LOBBY
  ↓
ROLE_REVEAL
  ↓
NOMINATION
  ↓
VOTING
  ├─ government rejected → election tracker → next nomination / chaos
  └─ government elected
         ↓
LEGISLATIVE_PRESIDENT
         ↓
LEGISLATIVE_CHANCELLOR
         ├─ enact policy
         └─ optional veto flow
                ↓
EXECUTIVE_ACTION   (when unlocked)
         ↓
next NOMINATION
         ↓
GAME_OVER
```

Convex is the source of truth for this state. The room record stores the current phase, office holders, election tracker, policy piles, enacted policies, votes, executive power, investigations, special-election state, chaos state, winner, and bot scheduling metadata.

## Backend architecture

The core backend is deliberately centralized in `backend/convex/game.ts` because game transitions need to be atomic and authoritative.

### Data model

`backend/convex/schema.ts` defines three indexed tables:

```text
rooms
  ├─ phase / status
  ├─ drawPile / discardPile / drawnCards
  ├─ liberalPolicies / fascistPolicies
  ├─ president / chancellor / previous government
  ├─ electionTracker / lastVotes
  ├─ executivePower / veto state
  ├─ investigation / peek / special-election state
  ├─ chaos state
  └─ winner / winReason / botThinkAt

players
  ├─ roomId / playerId / name / avatar
  ├─ role / party
  ├─ alive / ready / host
  ├─ president / chancellor flags
  ├─ seat position / vote
  └─ bot flag

gameLog
  └─ roomId / message / timestamp
```

### Server-authoritative actions

The Convex mutation layer validates who is allowed to act and whether the room is in the correct phase before changing state. Examples include:

- `joinRoom`
- `addBot`
- `toggleReady`
- `startGame`
- `nominateChancellor`
- `castVote`
- `presidentDrawPolicies`
- `chancellorEnactPolicy`
- `requestVeto` / `respondVeto`
- `investigateLoyalty`
- `callSpecialElection`
- `killPlayer`
- `completePolicyPeek`
- `leaveRoom`
- `resetRoom`

Clients submit intent; the backend decides whether that intent is legal and advances the game.

## Bot engine

Bots are not simple random button presses.

The backend detects when a bot owns the next decision, calculates a human-like delay from the current live-game tempo profile, and schedules the action through Convex. Bot logic considers game state when choosing:

- government votes
- Chancellor nominations
- President policy discards
- Chancellor policy enactment
- veto requests and responses
- loyalty investigations
- special-election targets
- execution targets

This lets a room reach the minimum player count without requiring every seat to be occupied by a human.

## Frontend architecture

The UI is split by game phase rather than implemented as one large conditional screen.

```text
src/
├─ app/                     Next.js application shell
├─ phases/
│  ├─ PhaseRouter.jsx       maps backend phase → view
│  └─ views/                connect, lobby, role reveal, live game, game over
├─ features/game-board/
│  ├─ PolicyTrack.jsx
│  ├─ TrackDetailSheet.jsx
│  ├─ boardConfig.js
│  ├─ liveTempoProfile.js
│  ├─ useLiveStateHealth.js
│  ├─ useLiveTransitionGate.js
│  └─ useVoteRevealState.js
├─ components/              shared UI
├─ engine/                  client-side game presentation helpers
└─ lib/                     shared utilities
```

The live-game layer includes explicit transition gating, vote-reveal state, policy-track presentation, and state-health logic so that real-time backend updates do not become jarring client-side UI jumps.

## Why this project is technically interesting

A multiplayer board-game implementation has a deceptively large consistency problem. Every connected browser can see a different subset of information, but all players must agree on the same election, policy deck, office holders, legal actions, and winner.

This project addresses that by keeping the authoritative rules in Convex and using the React client mainly as a projection of server state. That is substantially safer than allowing each browser to advance its own copy of the game.

## Running locally

```bash
npm install
npx convex dev --config convex.json
npm run dev
```

Then open `http://localhost:3000`.

### Other scripts

```bash
npm run build
npm run start
npm run lint
```

## Repository map

```text
backend/convex/game.ts       authoritative game engine and mutations
backend/convex/schema.ts     room, player and game-log persistence
src/phases/                  phase routing and top-level views
src/features/game-board/     live board behavior and transition state
src/components/              reusable UI
config/                      lint/tooling configuration
public/                      visual assets
```

## Deployment

The project has been configured for Next.js/Vercel deployment and Convex as the realtime backend.

**Project deployment:** https://secret-hitler-jet.vercel.app

---

This repository is an independent educational web implementation of the board game mechanics. Secret Hitler and its original artwork/brand are owned by their respective rights holders.
