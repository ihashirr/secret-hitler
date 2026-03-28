# Eclipse

Mobile-first Secret Hitler clone built with Next.js and Convex.

## Structure
- `app/`: Next.js app, static assets, and UI components
- `backend/convex/`: Convex schema, queries, and mutations
- `config/`: shared ESLint and PostCSS config
- `docs/`: product and technical notes

## Local development
1. Install dependencies with `npm install`.
2. Start Convex from the repo root with `npx convex dev --config convex.json`.
3. Start the frontend with `npm run dev`.
4. Open `http://localhost:3000`.

## Scripts
- `npm run dev`: runs the Next.js app from `app/`
- `npm run build`: production build for the app
- `npm run start`: starts the built app
- `npm run lint`: lints `src` and `backend/convex`

## Notes
- Session state is stored in `sessionStorage` so reloads keep the same room/player pair.
- The host controls room reset and full database wipe from the in-game admin bar.
- Current docs live under [docs/README.md](/c:/Users/ihash/Desktop/secret%20hitler/docs/README.md).
