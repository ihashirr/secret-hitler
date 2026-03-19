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
- **Real-Time Multiplayer**: Powered by Convex, see every vote and policy enactment instantly.
- **Mobile-First**: Designed specifically to be played on phones in portrait mode.
- **Auto-Reconnection**: If you accidentally refresh, you'll stay in your session.
- **Secret Role Masking**: Server-side logic ensures your role is never leaked to others.
- **Absolute Host Control**: The host has a global panel to manage or destroy the session.

## How to Run Locally

You'll need two terminal windows.

1. **Setup**
   ```bash
   cd client
   npm install
   ```

2. **Start Backend (Convex)**
   ```bash
   npx convex dev
   ```

3. **Start Frontend (Next.js)**
   ```bash
   npm run dev
   ```
   *Runs on http://localhost:3000*

## How to Play
1. Open http://localhost:3000.
2. Host creates a sector, others join with the 4-alpha code.
3. Use the admin panel (bottom left) for session management (Password for Wipe: `ECLIPSE`).
