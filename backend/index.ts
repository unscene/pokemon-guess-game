import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { POKEMON_LIST, getPokemonImageUrl, Pokemon } from './pokemon';

interface TurnState {
  pokemon: string;
  pokemonId: number;
  choices: string[];
  triesLeft: number;
  pointsThisTurn: number;
  correct: boolean | null;
  done: boolean;
}

interface GameState {
  players: string[];
  rounds: number;
  currentRound: number;
  currentPlayerIndex: number;
  turnState: TurnState | null;
  scores: { [player: string]: number };
  status: 'playing' | 'finished';
  guesses: any[];
  usedPokemonThisRound: string[];
  usedPokemonGlobal: string[];
}

const app = express();
const PORT = 4000;
app.use(cors());
app.use(bodyParser.json());

// In-memory game state (to be replaced with persistent storage)
let gameState: GameState | null = null;

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function getRandomPokemonChoices(
  excludeNames: string[] = []
): { answer: Pokemon; choices: Pokemon[] } | null {
  const available = POKEMON_LIST.filter((p) => !excludeNames.includes(p.name));
  if (available.length === 0) return null;
  const answerIdx = getRandomInt(available.length);
  const answer = available[answerIdx];
  let distractors: Pokemon[] = [];
  while (distractors.length < 3) {
    const idx = getRandomInt(POKEMON_LIST.length);
    if (
      POKEMON_LIST[idx].name !== answer.name &&
      !distractors.some((d) => d.name === POKEMON_LIST[idx].name)
    ) {
      distractors.push(POKEMON_LIST[idx]);
    }
  }
  const choices = [answer, ...distractors].sort(() => Math.random() - 0.5);
  return { answer, choices };
}

// Start new game
app.post('/game/start', (req: Request, res: Response) => {
  const { players, rounds } = req.body;
  if (!Array.isArray(players) || typeof rounds !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  gameState = {
    players,
    rounds,
    currentRound: 1,
    currentPlayerIndex: 0,
    turnState: null,
    scores: players.reduce((acc, p) => {
      acc[p] = 0;
      return acc;
    }, {}),
    status: 'playing',
    guesses: [],
    usedPokemonThisRound: [], // (legacy, not needed)
    usedPokemonGlobal: [], // Track used Pokémon for the entire game
  };
  res.json({ success: true, gameState });
});

// Get current game state
app.get('/game/state', (req: Request, res: Response) => {
  if (!gameState) return res.status(404).json({ error: 'No game in progress' });
  res.json(gameState);
});

// Get turn data (real logic)
app.get('/game/turn', (req: Request, res: Response) => {
  if (!gameState) return res.status(404).json({ error: 'No game in progress' });
  // If game is over, indicate it
  if (gameState.status === 'finished') {
    return res.json({
      gameOver: true,
      scores: gameState.scores,
      rounds: gameState.rounds,
      players: gameState.players,
    });
  }
  // If no turnState or previous turn is done, generate new
  if (!gameState.turnState || gameState.turnState.done) {
    // Only allow Pokémon that have not been used in the entire game
    const result = getRandomPokemonChoices(gameState.usedPokemonGlobal);
    if (!result) {
      // No more unique Pokémon left, end game
      gameState.status = 'finished';
      return res.json({
        gameOver: true,
        scores: gameState.scores,
        rounds: gameState.rounds,
        players: gameState.players,
        error: 'No more unique Pokémon left',
      });
    }
    const { answer, choices } = result;
    gameState.turnState = {
      pokemon: answer.name,
      pokemonId: answer.id,
      choices: choices.map((p) => p.name),
      triesLeft: 3,
      pointsThisTurn: 3,
      correct: null,
      done: false,
    };
    // Track used Pokémon for the entire game
    gameState.usedPokemonGlobal.push(answer.name);
  }
  res.json({
    pokemon: gameState.turnState.pokemon,
    imageUrl: getPokemonImageUrl(gameState.turnState.pokemonId),
    choices: gameState.turnState.choices,
    triesLeft: gameState.turnState.triesLeft,
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    currentRound: gameState.currentRound,
    totalRounds: gameState.rounds,
    gameOver: false,
  });
});

// Submit a guess (real logic)
app.post('/game/guess', (req: Request, res: Response) => {
  if (!gameState || !gameState.turnState)
    return res.status(400).json({ error: 'No game in progress' });
  const { guess } = req.body;
  if (gameState.turnState.done) {
    return res.json({
      correct: gameState.turnState.correct,
      triesLeft: gameState.turnState.triesLeft,
    });
  }
  if (guess === gameState.turnState.pokemon) {
    gameState.turnState.correct = true;
    gameState.turnState.done = true;
    const player = gameState.players[gameState.currentPlayerIndex];
    gameState.scores[player] = (gameState.scores[player] || 0) + gameState.turnState.pointsThisTurn;
    return res.json({ correct: true, triesLeft: gameState.turnState.triesLeft });
  } else {
    gameState.turnState.triesLeft -= 1;
    gameState.turnState.pointsThisTurn -= 1;
    if (gameState.turnState.triesLeft <= 0) {
      gameState.turnState.correct = false;
      gameState.turnState.done = true;
      const player = gameState.players[gameState.currentPlayerIndex];
      gameState.scores[player] = (gameState.scores[player] || 0) + 0;
      return res.json({ correct: false, triesLeft: 0 });
    }
    return res.json({ correct: null, triesLeft: gameState.turnState.triesLeft });
  }
  return res.json({ error: 'Invalid guess' });
});

// Advance to next player/round
function advanceTurn() {
  if (!gameState) return;
  // Move to next player
  gameState.currentPlayerIndex += 1;
  if (gameState.currentPlayerIndex >= gameState.players.length) {
    // Next round
    gameState.currentPlayerIndex = 0;
    gameState.currentRound += 1;
    // No need to reset usedPokemonGlobal; it tracks all used for the whole game
    if (gameState.currentRound > gameState.rounds) {
      gameState.status = 'finished';
    }
  }
  gameState.turnState = null; // Will be generated on next /game/turn
}

app.post('/game/next', (req: Request, res: Response) => {
  if (!gameState) return res.status(404).json({ error: 'No game in progress' });
  advanceTurn();
  res.json({ success: true, gameState });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
