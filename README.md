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
