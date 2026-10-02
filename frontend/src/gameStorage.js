const STORAGE_KEY = 'pokemon-guess-game-state';

export function loadGameState(storage) {
  try {
    const browserStorage = storage ?? window.localStorage;
    const serializedState = browserStorage.getItem(STORAGE_KEY);
    if (!serializedState) return null;

    const state = JSON.parse(serializedState);
    if (
      !Array.isArray(state.players) ||
      !state.players.every((player) => typeof player === 'string') ||
      !Number.isInteger(state.rounds) ||
      state.rounds < 1 ||
      !Number.isInteger(state.currentPlayerIndex) ||
      state.currentPlayerIndex < 0 ||
      state.currentPlayerIndex >= state.players.length ||
      !state.scores ||
      typeof state.scores !== 'object' ||
      !Array.isArray(state.usedPokemonGlobal) ||
      !['guess-pokemon', 'evolution'].includes(state.gameMode) ||
      !state.turnState ||
      typeof state.turnState !== 'object'
    ) {
      browserStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function saveGameState(state, storage) {
  try {
    const browserStorage = storage ?? window.localStorage;
    if (state) {
      browserStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      browserStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // The current game remains playable if browser storage is unavailable.
  }
}

export function clearGameState(storage) {
  try {
    const browserStorage = storage ?? window.localStorage;
    browserStorage.removeItem(STORAGE_KEY);
  } catch {
    // The reset URL still returns to setup if browser storage is unavailable.
  }
}
