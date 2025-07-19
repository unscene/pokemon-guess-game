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
  gameMode: 'guess-pokemon' | 'evolution';
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
  const { players, rounds, gameMode } = req.body;
  if (!Array.isArray(players) || typeof rounds !== 'number' || !['guess-pokemon', 'evolution'].includes(gameMode)) {
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
    gameMode,
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
  if (gameState.gameMode === 'evolution') {
    // Evolution mode: pick a Pokémon with evolvesTo, answer is the evolution
    if (!gameState.turnState || gameState.turnState.done) {
      // Only allow Pokémon that have not been used and have an evolution
      const available = POKEMON_LIST.filter(
        p => p.evolvesTo && !gameState!.usedPokemonGlobal.includes(p.name)
      );
      if (available.length === 0) {
        gameState.status = 'finished';
        return res.json({
          gameOver: true,
          scores: gameState.scores,
          rounds: gameState.rounds,
          players: gameState.players,
          error: 'No more unique Pokémon with evolutions left',
        });
      }
      const answerIdx = Math.floor(Math.random() * available.length);
      const basePokemon = available[answerIdx];
      const evolvedPokemon = POKEMON_LIST.find(p => p.id === basePokemon.evolvesTo)!;

      // Find the full evolutionary line for the evolvedPokemon
      // 1. Go backwards to the first form
      let lineForms: typeof POKEMON_LIST = [];
      let cursor = basePokemon;
      while (true) {
        const prev = POKEMON_LIST.find(p => p.evolvesTo === cursor.id);
        if (!prev) break;
        cursor = prev;
      }
      // 2. Go forwards and collect all forms
      let forward: Pokemon | undefined = cursor;
      while (typeof forward !== 'undefined') {
        lineForms.push(forward);
        if (typeof forward !== 'undefined') {
          const evolvesTo: number | undefined = forward.evolvesTo;
          if (typeof evolvesTo !== 'undefined') {
            const next: Pokemon | undefined = POKEMON_LIST.find(p => p.id === evolvesTo);
            forward = typeof next !== 'undefined' ? next : undefined;
          } else {
            forward = undefined;
          }
        } else {
          forward = undefined;
        }
      }

      // Refactored: Pick two from correct line (base + evolved), two from another line
      const answerForm = evolvedPokemon;
      const baseForm = basePokemon;
      // Find all evolution lines (arrays of forms)
      const lines: Pokemon[][] = [];
      const seen = new Set<number>();
      for (const poke of POKEMON_LIST) {
        if (seen.has(poke.id)) continue;
        // Go to root
        let root = poke;
        while (true) {
          const prev = POKEMON_LIST.find(p => p.evolvesTo === root.id);
          if (!prev) break;
          root = prev;
        }
        // Go forward and collect line
        let forward: Pokemon | undefined = root;
        const line: Pokemon[] = [];
        while (typeof forward !== 'undefined') {
          line.push(forward);
          seen.add(forward.id);
          if (typeof forward !== 'undefined' && typeof forward.evolvesTo !== 'undefined') {
            const next = POKEMON_LIST.find(p => p.id === forward?.evolvesTo);
            forward = typeof next !== 'undefined' ? next : undefined;
          } else {
            forward = undefined;
          }
        }
        lines.push(line);
      }
      // Find the correct line and possible distractor lines
      const correctLine = lines.find(line => line.some(p => p.id === baseForm.id))!;
      const otherLines = lines.filter(line => !line.some(p => p.id === baseForm.id) && line.length >= 2);
      // Pick a random other line with at least 2 forms
      let distractorLine: Pokemon[] = [];
      if (otherLines.length > 0) {
        distractorLine = otherLines[Math.floor(Math.random() * otherLines.length)];
      } else {
        // fallback: pick any other Pokémon not in correctLine
        distractorLine = POKEMON_LIST.filter(p => !correctLine.some(c => c.id === p.id));
      }
      // Pick two random from distractorLine
      let distractors: Pokemon[] = [];
      if (distractorLine.length >= 2) {
        const idxs: number[] = [];
        while (idxs.length < 2) {
          const idx = Math.floor(Math.random() * distractorLine.length);
          if (!idxs.includes(idx)) idxs.push(idx);
        }
        distractors = [distractorLine[idxs[0]], distractorLine[idxs[1]]];
      } else {
        // fallback: pick up to 2 unique
        distractors = distractorLine.slice(0, 2);
      }
      // Choices: base, evolved, and 2 distractors
      let choices = [baseForm, answerForm, ...distractors];
      // Ensure uniqueness and shuffle
      choices = Array.from(new Set(choices.map(p => p.id))).map(id => POKEMON_LIST.find(p => p.id === id)!);
      choices = choices.sort(() => Math.random() - 0.5);


      gameState.turnState = {
        pokemon: evolvedPokemon.name, // The correct answer is the evolved form
        pokemonId: basePokemon.id,   // Still use basePokemon.id for the left image
        choices: choices.map(p => p.name),
        triesLeft: 3,
        pointsThisTurn: 3,
        correct: null,
        done: false,
      };

      gameState.usedPokemonGlobal.push(basePokemon.name);
      // Store evolvedPokemonId for answer checking
      (gameState.turnState as any).evolvedPokemonId = evolvedPokemon.id;
    }
    const evolvedPokemonId = (gameState.turnState as any).evolvedPokemonId || POKEMON_LIST.find(p => p.name === gameState?.turnState?.choices[0])?.id;
    return res.json({
      pokemon: gameState.turnState.pokemon,
      imageUrl: getPokemonImageUrl(gameState.turnState.pokemonId),
      evolutionImageUrl: getPokemonImageUrl(evolvedPokemonId),
      choices: gameState.turnState.choices,
      triesLeft: gameState.turnState.triesLeft,
      currentPlayer: gameState.players[gameState.currentPlayerIndex],
      currentRound: gameState.currentRound,
      totalRounds: gameState.rounds,
      gameOver: false,
    });
  } else {
    // Classic mode
    if (!gameState.turnState || gameState.turnState.done) {
      // Only allow Pokémon that have not been used in the entire game
      const result = getRandomPokemonChoices(gameState.usedPokemonGlobal);
      if (!result) {
        console.log('No more unique Pokémon left for classic mode');
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
    return res.json({
      pokemon: gameState.turnState.pokemon,
      imageUrl: getPokemonImageUrl(gameState.turnState.pokemonId),
      choices: gameState.turnState.choices,
      triesLeft: gameState.turnState.triesLeft,
      currentPlayer: gameState.players[gameState.currentPlayerIndex],
      currentRound: gameState.currentRound,
    totalRounds: gameState.rounds,
    gameOver: false,
  });
}});

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
