# Architecture

## Runtime layout
- Frontend lives in `app/`
- Convex backend lives in `backend/convex/`
- Shared project config lives in `config/`

## Frontend
- Framework: Next.js 16 with React 19
- Entry point: `src/app/page.jsx`
- Phase router: `src/phases/PhaseRouter.jsx`
- Phase config: `src/phases/config.js`
- Global shell: `src/app/layout.jsx`
- Styling: Tailwind 4 plus a small set of custom utilities in `src/app/globals.css`
- Progressive phase views live under `src/phases/views/`
- UI primitives remain split across `Splash`, `Lobby`, `RoleReveal`, `GameBoard`, `GameOverlay`, `GameOver`, and `GlobalControls`

## Backend
- `backend/convex/game.ts` contains room lifecycle, voting, policy flow, executions, and the sanitized game-state query
- `backend/convex/schema.ts` defines `rooms`, `players`, and `gameLog`
- The client reads state through Convex queries and mutates state through room-scoped mutations

## State model
- Convex is the source of truth for game state
- The browser stores `eclipse_roomId` and `eclipse_playerId` in `sessionStorage`
- `getGameState` only exposes sensitive role data to the correct caller

## Current cleanup constraints
- The frontend still uses plain `<img>` tags for local game assets because these elements are animated and heavily styled
- Several room/player fields in the Convex schema are legacy fields and should only be removed together with a fresh Convex codegen pass
