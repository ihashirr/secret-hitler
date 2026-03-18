# Eclipse - Technical Documentation

This document outlines the technical architecture, stack, and specific design implementations of the Eclipse Secret Hitler multiplayer game, following the **Convex Migration**.

## Tech Stack
- **Frontend**: React 18, Next.js 15, Tailwind CSS, Framer Motion
- **Backend (Serverless)**: Convex (Cloud Functions & Real-time Database)
- **State Management**: Convex Reactive Queries & Mutations
- **Communication**: Persistent WebSocket subscriptions via Convex Client

## Architecture: Reactive Cloud-Authoritative State
The application has migrated from a legacy Socket.IO architecture to a modern **Convex-powered** backend.

- **Convex Backend (`convex/game.ts`)**: All game logic is enforced in server-side mutations. This ensures data integrity and prevents client-side manipulation.
  - **Mutations**: Handle atomic state changes (joining, starting, voting, enacting policies).
  - **Queries**: Provide a real-time, reactive view of the game state.
- **Dynamic State Sanitization**: The `getGameState` query dynamically sanitizes the room data based on the caller's `playerId`. Role-sensitive information (like who is a Fascist) is only revealed to authenticated operatives based on official Secret Hitler rules.
- **Persistent Sessions**:
  - The frontend uses `sessionStorage` for `eclipse_roomId` and `localStorage` for a persistent `eclipse_playerId`.
  - This allows operatives to refresh their dashboard during high-stakes sessions without losing their retinal identification.
- **Emergency Protocols**:
  - **Security Clear**: A manual override mechanism was implemented in `Splash.jsx` and `GameBoard.jsx` to allow players to wipe stuck or corrupted sectors from the cloud database.
  - **Wipe All Data**: A terminal-level mission command (`npx convex run game:wipeAllData`) is available for total sector reset during development.

## Aesthetic Theme: Tactical Intelligence Dashboard
The interface simulates a high-security intelligence terminal with a Cyberpunk/Neon aesthetic.

### System Styling (CSS Architecture)
- **Primary Tokens**: `obsidian-900` (`#0a0a0c`), `cyan-neon` (`#00f0ff`), and `crimson-neon` (`#ff003c`).
- **Typography**: `JetBrains Mono` for tactical data readouts, utilizing heavy tracking (`tracking-[0.2em]`) to emulate terminal buffers.
- **Glassmorphism 2.0**: Shifted from generic blurs to sharp, high-contrast panels with 4px corner viewfinder accents and glowing border pulses.

### Component Breakdown
- `Splash.jsx`: An authentication gateway. Includes the **FORCE_SECURITY_CLEAR** override and name/sector inputs with modern autofocus support.
- `Lobby.jsx`: Real-time operative roster showing "Ready" status and sector synchronization.
- `RoleReveal.jsx`: Secure identification screen where operatives acknowledge their classified directives.
- `GameBoard.jsx`: The central command table. Features radial player positioning, holographic policy tracks, and dedicated **Legislative Overlays** for President/Chancellor decision-making.
- `GameOver.jsx`: Mission debriefing showing the final casualty list and the reason for mission success/failure.
