# Eclipse - Technical Documentation

This document outlines the technical architecture, stack, and specific design implementations of the Eclipse Secret Hitler multiplayer game.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.IO
- **Communication**: Bidirectional WebSockets for low-latency state synchronization

## Architecture: Server-Authoritative State
The entire game runs on a heavily enforced **Server-Authoritative** architecture to prevent cheating.
- **GameEngine (`backend/gameEngine.js`)**: All rules, deck shuffling, role assignments, vote tallying, and win conditions are calculated purely on the server.
- **Sanitized State Payload**: When the server broadcasts state to connected clients, it dynamically generates a *unique* JSON payload for each socket ID. A Liberal player receives an array of "Unknown" operatives, while Fascists receive a list exposing their co-conspirators.
- **Reconnection Persistence**: 
  - The frontend utilizes `sessionStorage` to cache precisely two items: `eclipse_roomId` and `eclipse_playerName`.
  - When the React `App.jsx` mounts, it checks for these tokens. If found, it automatically bypasses the Splash screen and emits a `join_room` event.
  - The backend intercepts this event, recognizes the existing `playerName` inside the `GameEngine`, dynamically rebinds the new Socket ID to the existing Player Object, and re-emits the sanitized state. This allows for flawless page refreshes during mid-game tension.
- **Abort Protocol (`handleExit`)**:
  - A comprehensive `handleExit` function was added to the root `App.jsx`.
  - When triggered (via "Abort Mission" or "Leave Lobby" buttons), it clears `sessionStorage` keys, invokes `socket.disconnect()`, resets local React state, and scrubs the URL query parameters.
  - This ensures a clean slate for joining new sessions without manual cache clearing.

## Aesthetic Theme: Next-Gen Tactical Dashboard
The aesthetic was overhauled from a typical "glassmorphism" style to a sharp, high-contrast Cyberpunk/Tactical Dashboard.

### CSS Architecture
We utilized Tailwind CSS extended with custom CSS Variables in `index.css`:
- **Colors**: Rely heavily on `obsidian-900` (`#0a0a0c`), `cyan-neon` (`#00f0ff`), and `crimson-neon` (`#ff003c`).
- **Typography**: The primary font is `JetBrains Mono` combined with a stark `Sans Serif`, emphasizing heavy tracking (`tracking-[0.2em]`) and uppercase text spacing to emulate intelligence terminals.
- **Visuals Components**: 
  - Abandoned `rounded-xl` and `backdrop-blur` for sharp corners, thin `border-cyan-500/30` outlines, and decorative 4px corner accents simulating camera viewfinders.
  - Custom Drop Shadows (`shadow-[0_0_20px_rgba(0,240,255,0.2)]`) provide the "neon glow" effect over flat panels.
  - Animations via `Framer Motion` simulate digital decoding and retinal scan terminal UI patterns.

### Component Breakdown
- `Splash.jsx`: Rendered as an authentication terminal. Uses grid backgrounds.
- `Lobby.jsx`: Modeled after an Operative Roster. Features a glowing Sector Code and pulsing states.
- `RoleReveal.jsx`: Replaces standard flip-cards with a "Hold to Authenticate / Scan Retinal Pattern" mechanic, transitioning into a full screen glowing directive.
- `GameBoard.jsx`: The policy trackers are designed as interconnected glowing nodes. Legislative overlays take over the whole screen mimicking decrypted top-secret files.
- `GameOver.jsx`: High contrast debriefing logs displaying cross-outs for executed players and tactical role indicators.
