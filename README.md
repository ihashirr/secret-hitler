# Eclipse: Secret Hitler (Mobile-First Web Clone)

**Eclipse** is a mobile-first, real-time web adaptation of the Secret Hitler social deduction board game, built with Next.js, React, and powered by a Convex backend. Designed with a mobile-centric UI and modern web technologies, Eclipse supports snappy, engaging social gameplay for friends anywhere.

## Features

- **Real-Time Multiplayer:** Seamless online play for groups, with live state synchronization (Convex as backend state engine).
- **Mobile-First Design:** Optimized for narrow portrait devices with custom UI and "classified dossier" styling; responsive layouts ensure usability across mobile, tablet, and desktop.
- **Modern Stack:** Next.js 16 (React 19) frontend, Tailwind 4 styling, Convex DB in the backend.
- **Zero-Setup Onboarding:** Simple room creation and joining via alias/avatar selection and room codes—no accounts needed.
- **Rich Game Logic:** Implements all Secret Hitler game phases: lobby, role reveal, government formation, voting, legislative session, policy passage, executive actions, and game conclusion.
- **Session Persistence:** State is managed server-side; players reconnect and recover automatically using `sessionStorage`.
- **Admin Controls:** Hosts can reset rooms and fully wipe state from an in-game admin bar.
- **Accessible and Friendly:** Designed for touch devices with large tap targets, action clarity, and a vintage aesthetic.

## Architecture

- **Frontend:**  
  - Located in `app/` (Next.js).
  - Entry: `src/app/page.jsx`.  
  - Phase routing and views under `src/phases/`.
  - UI components like `Splash`, `Lobby`, `RoleReveal`, `GameBoard`, `GameOverlay`, and `GameOver`.
  - Styling via Tailwind 4 and `src/app/globals.css`.
- **Backend:**  
  - Located in `backend/convex/`.
  - Core game logic in `game.ts`: manages rooms, voting, policies, executions, state queries.
  - Schema/types: `schema.ts` for `rooms`, `players`, and `gameLog`.
  - Secure query/mutation API; only exposes roles to authorized clients.
- **Config:**  
  - Shared linting and CSS config in `config/`.

## Mobile-First Strategy

- Game board and interface are readable and navigable on narrow screens.
- Top status banner and bottom action desk for clarity.
- No full-screen modals during play—decisions are always accessible.
- Onboarding is split and streamlined: alias/avatar/room code.
- Dossier/Paper visual theme, large controls for touch accuracy.

## Local Development

1. Clone the repo and install dependencies:  
   ```
   npm install
   ```
2. Start Convex backend (from repo root):  
   ```
   npx convex dev --config convex.json
   ```
3. Launch the Next.js frontend:  
   ```
   npm run dev
   ```
4. The app is now available at [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev`: Run frontend dev server
- `npm run build`: Production build
- `npm run start`: Start production server
- `npm run lint`: Lint all relevant source code

## State Model

- Convex is the source of truth for all in-game state.
- Players are tracked with `eclipse_roomId` and `eclipse_playerId` in browser storage.
- Role and sensitive data are strictly secured and scoped.

## Documentation

- **Technical:** `/docs/tech/architecture.md` — system architecture, state model.
- **Product:** `/docs/product/mobile-strategy.md` — mobile UX goals.

## Project Direction

- Intended as a polished, mobile-first experience for the well-known board game.
- Provides a strong demonstration of full stack engineering, live collaboration, websocket-style play, and advanced CSS/UI thinking.

---

## Screenshots

*(Add screenshots/gifs here for best effect!)*

---

## License

This project is for educational and personal use; see LICENSE for details.

---

**Live Demo:** [secret-hitler-jet.vercel.app](https://secret-hitler-jet.vercel.app)
