# Eclipse - A Secret Hitler Clone

Welcome to **Eclipse**, a high-tech, mobile-first web adaptation of the popular social deduction game *Secret Hitler*. 

Designed exclusively for private friend groups (5-10 players), you can play this game in the same room or remotely. No installations or accounts are required.

## The Aesthetic
The game features a **"Next-Gen Tactical Dashboard"** theme. We abandoned the classic mid-century board game look in favor of a sleek, cyber-intelligence operation interface:
- Deep obsidian backgrounds
- Glowing Neon Cyan (Liberal) and Crimson (Fascist) accents
- Monospaced terminal fonts
- Sharp, interconnected grids and tactical UI elements

## Features
- **Real-Time Multiplayer**: Instantly see votes, policy enactments, and lobby updates.
- **Mobile-First**: Designed specifically to be played on phones in portrait mode.
- **Auto-Reconnection**: If you accidentally refresh the page during a game, you'll instantly be dropped right back into your secret operative role without losing your identity.
- **Secret Role Masking**: The server strictly guarantees that your secret role is never sent to other players' devices.
- **Abort Protocol**: Integrated "Abort Mission" and "Leave Lobby" buttons across every phase of the game, allowing players to gracefully exit, clear their session data, and return to the main entry terminal.

## How to Run Locally

You'll need two terminal windows to run both the frontend and backend servers.

1. **Start the Backend (Server)**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *(Runs on http://localhost:3001)*

2. **Start the Frontend (Client)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *(Runs on http://localhost:5173 or the port Vite exposes)*

## How to Play
1. Open a browser to the frontend local URL on your phone or desktop.
2. Form a group of 5 to 10 players.
3. Have one person enter their Name and click **GENERATE SECTOR** to host the lobby.
4. Have the others enter their Names and the 4-letter **_SECTOR_CODE** to join.
5. Hit **INITIATE PROTOCOL** to deal roles and begin!
