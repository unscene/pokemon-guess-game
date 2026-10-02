import { getPokemonImageUrl, POKEMON_LIST } from './pokemon';

const pokemonById = new Map();
const pokemonByName = new Map();

for (const pokemon of POKEMON_LIST) {
  if (!pokemonById.has(pokemon.id)) pokemonById.set(pokemon.id, pokemon);
  if (!pokemonByName.has(pokemon.name)) pokemonByName.set(pokemon.name, pokemon);
}

const pokemon = [...pokemonByName.values()];
const previousPokemonById = new Map();

for (const entry of pokemon) {
  if (entry.evolvesTo && !previousPokemonById.has(entry.evolvesTo)) {
    previousPokemonById.set(entry.evolvesTo, entry);
  }
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getEvolutionLines() {
  const seen = new Set();
  const lines = [];

  for (const entry of pokemon) {
    if (seen.has(entry.id)) continue;

    let root = entry;
    while (previousPokemonById.has(root.id)) {
      root = previousPokemonById.get(root.id);
    }

    const line = [];
    let current = root;
    while (current && !seen.has(current.id)) {
      line.push(current);
      seen.add(current.id);
      current = current.evolvesTo ? pokemonById.get(current.evolvesTo) : undefined;
    }

    if (line.length) lines.push(line);
  }

  return lines;
}

const evolutionLines = getEvolutionLines();

function makeGameOverTurn(gameState) {
  gameState.status = 'finished';
  gameState.turnState = {
    gameOver: true,
    scores: gameState.scores,
    rounds: gameState.rounds,
    players: gameState.players,
  };
  return gameState;
}

function makeTurn(gameState) {
  if (gameState.gameMode === 'evolution') {
    const available = pokemon.filter(
      (entry) =>
        entry.evolvesTo &&
        pokemonById.has(entry.evolvesTo) &&
        !gameState.usedPokemonGlobal.includes(entry.name),
    );
    if (!available.length) return makeGameOverTurn(gameState);

    const basePokemon = randomItem(available);
    const evolvedPokemon = pokemonById.get(basePokemon.evolvesTo);
    const correctLine = evolutionLines.find((line) =>
      line.some((entry) => entry.id === basePokemon.id),
    ) || [basePokemon, evolvedPokemon];
    const otherLines = evolutionLines.filter(
      (line) =>
        line.length >= 2 &&
        !line.some((entry) => correctLine.some((correct) => correct.id === entry.id)),
    );
    const distractorPool = otherLines.length
      ? randomItem(otherLines)
      : pokemon.filter(
          (entry) => !correctLine.some((correct) => correct.id === entry.id),
        );
    const distractors = shuffled(distractorPool).slice(0, 2);
    const choices = shuffled(
      [...new Map([basePokemon, evolvedPokemon, ...distractors].map((entry) => [entry.id, entry])).values()],
    );

    gameState.usedPokemonGlobal.push(basePokemon.name);
    gameState.turnState = {
      pokemon: evolvedPokemon.name,
      pokemonId: basePokemon.id,
      evolutionPokemonId: evolvedPokemon.id,
      choices: choices.map((entry) => entry.name),
      triesLeft: 3,
      pointsThisTurn: 3,
      correct: null,
      done: false,
      imageUrl: getPokemonImageUrl(basePokemon.id),
      evolutionImageUrl: getPokemonImageUrl(evolvedPokemon.id),
      currentPlayer: gameState.players[gameState.currentPlayerIndex],
      currentRound: gameState.currentRound,
      totalRounds: gameState.rounds,
      gameOver: false,
    };
    return gameState;
  }

  const available = pokemon.filter(
    (entry) => !gameState.usedPokemonGlobal.includes(entry.name),
  );
  if (!available.length) return makeGameOverTurn(gameState);

  const answer = randomItem(available);
  const distractors = shuffled(
    pokemon.filter((entry) => entry.name !== answer.name),
  ).slice(0, 3);
  const choices = shuffled([answer, ...distractors]);
  gameState.usedPokemonGlobal.push(answer.name);
  gameState.turnState = {
    pokemon: answer.name,
    pokemonId: answer.id,
    choices: choices.map((entry) => entry.name),
    triesLeft: 3,
    pointsThisTurn: 3,
    correct: null,
    done: false,
    imageUrl: getPokemonImageUrl(answer.id),
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    currentRound: gameState.currentRound,
    totalRounds: gameState.rounds,
    gameOver: false,
  };
  return gameState;
}

export function createGameState(players, rounds, gameMode) {
  const gameState = {
    players,
    rounds,
    currentRound: 1,
    currentPlayerIndex: 0,
    scores: Object.fromEntries(players.map((player) => [player, 0])),
    status: 'playing',
    usedPokemonGlobal: [],
    gameMode,
    turnState: null,
  };
  return makeTurn(gameState);
}

export function submitGuess(gameState, guess) {
  const currentTurn = gameState?.turnState;
  if (!currentTurn || currentTurn.gameOver || currentTurn.done) return gameState;

  const nextState = {
    ...gameState,
    scores: { ...gameState.scores },
    turnState: { ...currentTurn },
  };
  const turn = nextState.turnState;

  if (guess === turn.pokemon) {
    turn.correct = true;
    turn.done = true;
    const player = nextState.players[nextState.currentPlayerIndex];
    nextState.scores[player] =
      (nextState.scores[player] || 0) + turn.pointsThisTurn;
  } else {
    turn.triesLeft -= 1;
    turn.pointsThisTurn -= 1;
    if (turn.triesLeft <= 0) {
      turn.correct = false;
      turn.done = true;
    }
  }

  return nextState;
}

export function advanceGame(gameState) {
  if (!gameState || gameState.status === 'finished') return gameState;

  const nextState = {
    ...gameState,
    usedPokemonGlobal: [...gameState.usedPokemonGlobal],
    currentPlayerIndex: gameState.currentPlayerIndex + 1,
  };

  if (nextState.currentPlayerIndex >= nextState.players.length) {
    nextState.currentPlayerIndex = 0;
    nextState.currentRound += 1;
    if (nextState.currentRound > nextState.rounds) {
      return makeGameOverTurn(nextState);
    }
  }

  return makeTurn(nextState);
}
