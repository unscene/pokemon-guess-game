import React, { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { styles } from './styles.stylex';

function SetupScreen({ onStart }) {
  const [players, setPlayers] = useState(['']);
  const [rounds, setRounds] = useState(5);

  const handlePlayerChange = (i, val) => {
    const arr = [...players];
    arr[i] = val;
    setPlayers(arr);
  };
  const addPlayer = () => setPlayers([...players, '']);
  const removePlayer = (i) => setPlayers(players.filter((_, idx) => idx !== i));

  const canStart = players.every(p => p.trim()) && players.length > 1 && rounds > 0;

  return (
    <div {...stylex.props(styles.container)}>
      <h1 {...stylex.props(styles.heading)}>Pokémon Guess Game</h1>
      <h2 {...stylex.props(styles.subheading)}>Enter Player Names</h2>
      {players.map((p, i) => (
        <div key={i} {...stylex.props(styles.playerRow)}>
          <input
            {...stylex.props(styles.playerInput)}
            value={p}
            onChange={e => handlePlayerChange(i, e.target.value)}
            placeholder={`Player ${i + 1}`}
          />
          {players.length > 2 && (
            <button {...stylex.props(styles.removeBtn)} onClick={() => removePlayer(i)}>
              ✕
            </button>
          )}
        </div>
      ))}
      <button className="game-btn" {...stylex.props(styles.addPlayerBtn)} onClick={addPlayer}>+ Add Player</button>
      <div {...stylex.props(styles.roundsRow)}>
        <label {...stylex.props(styles.roundsLabel)}>
          Rounds:
          <input
            type="number"
            min={1}
            value={rounds}
            onChange={e => setRounds(Number(e.target.value))}
            {...stylex.props(styles.roundsInput)}
          />
        </label>
      </div>
      <button
        className="game-btn"
        {...stylex.props(styles.startBtn)}
        disabled={!canStart}
        onClick={() => onStart(players, rounds)}
      >
        Start Game
      </button>
    </div>
  );
}

export default SetupScreen;
