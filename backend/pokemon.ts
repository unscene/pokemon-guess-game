export interface Pokemon {
  name: string;
  id: number;
}

export const POKEMON_LIST: Pokemon[] = [
  // ... (full list of 1-450 as previously generated)
];

export function getPokemonImageUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
