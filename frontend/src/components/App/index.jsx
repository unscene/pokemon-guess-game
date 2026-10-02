import React, { useState, useEffect } from 'react';
import { getLightestColorFromImage } from '../../getLightestColorFromImage';
import { darkenColor } from '../../colorUtils';
import '../../buttonStyles.css';
import SetupScreen from '../../components/SetupScreen';
import { advanceGame, createGameState, submitGuess } from '../../gameLogic';
import { clearGameState, loadGameState, saveGameState } from '../../gameStorage';

function getInitialGameState() {
  const isResetRequest =
    window.location.pathname === '/reset' ||
    new URLSearchParams(window.location.search).has('reset');

  if (isResetRequest) {
    clearGameState();
    window.history.replaceState({}, document.title, '/');
    return null;
  }

  return loadGameState();
}

function App() {
  const [shakeKey, setShakeKey] = useState(0);
  const [gameState, setGameState] = useState(getInitialGameState);
  const turnState = gameState?.turnState;
  const [imageBgColor, setImageBgColor] = useState('#f0f0f0');

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    if (turnState && turnState.imageUrl) {
      getLightestColorFromImage(turnState.imageUrl).then(setImageBgColor);
    }
  }, [turnState && turnState.imageUrl]);

  const startGame = (players, rounds, mode) => {
    setGameState(createGameState(players, rounds, mode));
  };

  if (!gameState) return <SetupScreen onStart={startGame} />;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const handleGuess = (choice) => {
    if (turnState.correct !== null) return;
    if (choice !== turnState.pokemon && turnState.triesLeft > 1) {
      setShakeKey((key) => key + 1);
    }
    setGameState((state) => submitGuess(state, choice));
  };

  const nextTurn = () => {
    setGameState((state) => advanceGame(state));
  };

  // Game over screen
  if (turnState.gameOver) {
    return (
      <div style={{ fontSize: 36, textAlign: 'center', marginTop: 100 }}>
        <h1>Game Over!</h1>
        <h2>Scores:</h2>
        <ul style={{ fontSize: 32, listStyle: 'none', padding: 0 }}>
          {Object.entries(turnState.scores).map(([player, score]) => (
            <li key={player} style={{ margin: 12 }}>{player}: {score}</li>
          ))}
        </ul>
        <button className="game-btn" style={{ fontSize: 28, marginTop: 32 }} onClick={() => setGameState(null)}>New Game</button>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 32, textAlign: 'center', marginTop: 20 }}>
      <>
        <div style={{ width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', background: imageBgColor, padding: '40px 0 40px 0', transition: 'background 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {/* Player Name inside colored box */}
          <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px 12px 32px' }}>
            <span style={{ fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace", fontSize: 28, color: '#222', textAlign: 'left' }}>
              Player: <b>{currentPlayer}</b> ({gameState?.scores?.[currentPlayer] ?? 0})
            </span>
            <span style={{ fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace", fontSize: 28, color: '#222', textAlign: 'right' }}>
              Round: {gameState.currentRound} / {gameState.rounds}
            </span>
          </div>
          {/* Evolution Mode: show base and evolution side-by-side when both images are present */}
          {gameState.gameMode === 'evolution' && turnState.evolutionImageUrl ? (
            <div
              key={shakeKey}
              style={{ position: 'relative', display: 'inline-block' }}
              className="shake"
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
                  {/* Base Pokémon */}
                  <img
                    key={shakeKey + '-base'}
                    src={turnState.imageUrl}
                    alt="base-pokemon"
                    style={{ width: 320, height: 320, imageRendering: 'pixelated', display: 'block', }}
                  />
                  {/* Arrow */}
                  <span style={{
                    fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace",
                    fontSize: 64,
                    userSelect: 'none',
                    color: '#222',
                    margin: '0 16px',
                    letterSpacing: 2,
                    display: 'inline-block',
                    lineHeight: 1,
                    filter: 'none',
                  }}>
                    ▶
                  </span>
                  {/* Evolution silhouette */}
                  <div style={{ position: 'relative', width: 320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      key={shakeKey + '-evo'}
                      src={turnState.evolutionImageUrl}
                      alt="evolution-silhouette"
                      style={{
                        width: 320,
                        height: 320,
                        imageRendering: 'pixelated',
                        filter: turnState.correct === true ? 'none' : 'brightness(0) grayscale(1) contrast(1.5)',
                        opacity: turnState.correct === true ? 1 : 0.92,
                        display: 'block',
                        margin: '0 auto',
                        background: 'transparent'
                      }}
                    />
                    {turnState.correct === true ? null : (
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 80, color: '#fff', opacity: 0.7, pointerEvents: 'none', textShadow: '2px 2px 12px #000, 0 0 18px #fff' }}>?</span>
                    )}
                  </div>
                </div>
              </div>
          ) : (
            <div
              key={shakeKey}
              style={{ position: 'relative', display: 'inline-block' }}
              className="shake"
            >
              <img
                key={shakeKey}
                src={turnState.imageUrl}
                alt="pokemon"
                style={{ width: 320, height: 320, imageRendering: 'pixelated', display: 'block', margin: '0 auto' }}
              />
            </div>
          )}
          {turnState.correct === true && (
            <div style={{ flexDirection: 'column', gap: 32, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', zIndex: 2 }}>
              <span style={{ fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace", fontSize: 42, color: '#00ff00', textShadow: '2px 2px 0 #222, 0 0 8px #fff', letterSpacing: 2 }}>
                Correct!
              </span>
              <button onClick={nextTurn} className="game-btn" style={{ fontSize: 28, padding: '18px 32px', marginLeft: 0, border: '7px solid #00ff00', boxShadow: '2px 2px 0 #222' }}>
                Next Turn
              </button>
            </div>
          )}
          {turnState.correct === false && (
            <div style={{ flexDirection: 'column', gap: 32, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', zIndex: 2, minWidth: 700, maxWidth: '90vw', justifyContent: 'center', background: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace", fontSize: 38, color: '#ff2222', textShadow: '2px 2px 0 #222, 0 0 8px #fff', letterSpacing: 2 }}>
                Out of tries! The answer was {turnState.pokemon}
              </span>
              <button onClick={nextTurn} className="game-btn" style={{ fontSize: 28, padding: '18px 32px', marginLeft: 0, border: '7px solid #ff2222', boxShadow: '2px 2px 0 #222' }}>
                Next Turn
              </button>
            </div>
          )}
        </div>
         <div style={{
          width: '100vw',
          height: 18,
          background: imageBgColor,
          display: 'flex',
          marginBottom: 20,
        }}>
          {Array.from({ length: 3 }).map((_, i) => {
            // Remaining tries fill from left; used tries fill to the right
            const isRemaining = i < turnState.triesLeft;
            const bg = isRemaining ? darkenColor(imageBgColor, 0.5) : imageBgColor;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '100%',
                  marginRight: i !== 3 - 1 ? 2 : 0,
                  background: bg,
                  transition: 'background 0.3s',
                  boxSizing: 'border-box'
                }}
              />
            );
          })}
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
          maxWidth: 1200,
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {(turnState.choices || []).map(choice => (
            <button
              key={choice}
              className="game-btn"
              style={{ opacity: turnState.correct !== null ? 0.5 : 1 }}
              onClick={() => handleGuess(choice)}
              disabled={turnState.correct !== null}
            >
              {choice}
            </button>
          ))}
        </div>
      </>
    </div>
  );
}

export default App;
