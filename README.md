# Pokémon Guess Game

A simple multiplayer Pokémon guessing game for TV/party play.

## Tech Stack
- React frontend built with Vite
- Game state and scoring run in the browser; active games are saved in local storage

## Game Flow
1. Host enters player names and number of rounds
2. Each player takes turns guessing the name of a Pokémon (3 tries, 3 choices)
3. Game state is restored after a page refresh in the same browser
4. Game ends after all rounds

Visit `/reset` in the same browser to clear its saved game and return to setup. This does not reset other browsers or devices.

## Setup
Instructions will be added as the project is developed.

## Deploying to Vercel
This repo can be imported into Vercel in two ways:

- **Root Directory = repository root** (default): Vercel uses the top-level `vercel.json`, which builds the `frontend` npm workspace (`npm run build --workspace frontend`) and serves `frontend/dist`.
- **Root Directory = `frontend`**: Vercel uses `frontend/vercel.json` instead, which builds the frontend package directly (no workspace flag) since the workspace root is outside the configured Root Directory.

Make sure the Root Directory setting in the Vercel project matches the `vercel.json` you intend to use; mixing the two (e.g. Root Directory set to `frontend` while expecting the top-level `vercel.json`'s workspace build command to run) will fail with `npm error No workspaces found: --workspace=frontend`.
