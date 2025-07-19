import { useEffect, useState } from "react";
import { getLightestColorFromImage } from "../../getLightestColorFromImage";

// Use a static list of Gen 1 sprites (publicly available)
const POKEMON_IDS = [
  1,4,7,10,13,16,19,21,23,25,27,29,32,35,37,39,41,43,46,48,50,52,54,56,58,60,63,66,69,72,74,77,79,81,83,84,86,88,90,92,95,96,98,100,102,104,108,109,111,116,118,120,129,131,133,138,140,147,152
];

function getRandomPokemonId() {
  return POKEMON_IDS[Math.floor(Math.random() * POKEMON_IDS.length)];
}

function getPokemonImageUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export default function useRandomPokemonBg() {
  const [bgColor, setBgColor] = useState("#f0f0f0");
  useEffect(() => {
    const id = getRandomPokemonId();
    const url = getPokemonImageUrl(id);
    getLightestColorFromImage(url).then(setBgColor);
  }, []);
  return bgColor;
}
