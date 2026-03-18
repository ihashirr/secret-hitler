# Backend Migration: Node.js/Express/Socket.IO to Convex

This document logs the architectural migration of the Eclipse Secret Hitler backend to Convex.

## Status: COMPLETED

## Completed Steps

### 1. Convex Project Initialization
- Installed `convex` npm package.
- Created `convex.json` configuration file.
- Initialized Convex directory structure.

### 2. Database Schema Refinement
- Defined `rooms`, `players`, and `gameLog` tables.
- Implemented indexes for efficient room lookups.
- Added state tracking for policies, deck piles, and term limits.

### 3. Game Logic Migration (Convex Mutations)
- Re-implemented all core `GameEngine.js` logic as Convex mutations in `convex/game.ts`.
- **`castVote` (Auto-Tally)**: Integrated automatic tallying and phase transition after the last vote.
- **`getGameState` (Reactive Query)**: Implemented specialized logic to provide role-specific sanitized state views for players.
- **Emergency Protocols**:
    - `resetRoom`: For host-led session resets.
    - `wipeAllData`: For total database cleanup via terminal.

### 4. Frontend Migration
- **Convex Provider**: Wrapped `RootLayout` with `ConvexClientProvider`.
- **Component Refactor**: Refactored `App.jsx`, `Lobby.jsx`, `RoleReveal.jsx`, and `GameBoard.jsx` to use `useQuery` and `useMutation`.
- **State Handling**: Implemented explicit loading states and fixed anonymous player identification.
- **Privacy Enforcement**: Resolved role and party leaks, adhering strictly to official Secret Hitler rules.
- **UX Improvements**: Added `autoFocus` for name entry and global emergency reset buttons.

### 5. Cleanup
- Removed `socket.io-client` dependency.
- Deleted legacy `server/` directory and components.
- Updated `TECH_README.md` to reflect the new architecture.
