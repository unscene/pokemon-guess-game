import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#fff',
    textAlign: 'center',
  },
  heading: {
    fontSize: 36,
    marginBottom: 8,
    fontWeight: 700,
  },
  subheading: {
    fontSize: 28,
    marginBottom: 12,
    fontWeight: 500,
  },
  playerRow: {
    margin: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInput: {
    fontSize: 24,
    width: 250,
    padding: 8,
  },
  removeBtn: {
    fontSize: 24,
    marginLeft: 8,
  },
  addPlayerBtn: {
    fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace",
    fontSize: 36,
    padding: '24px 64px',
    borderRadius: 0,
    background: '#eee',
    border: '7px solid #aaa',
    color: '#000',
    cursor: 'pointer',
    marginTop: 12,
    transition: 'background 0.15s, color 0.15s',
  },
  roundsRow: {
    margin: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundsLabel: {
    fontSize: 24,
    marginRight: 8,
  },
  roundsInput: {
    fontSize: 24,
    width: 80,
    marginLeft: 8,
  },
  startBtn: {
    fontFamily: "'Press Start 2P', 'Courier New', Courier, monospace",
    fontSize: 36,
    padding: '24px 64px',
    borderRadius: 0,
    background: '#eee',
    border: '7px solid #aaa',
    color: '#000',
    cursor: 'pointer',
    marginTop: 24,
    transition: 'background 0.15s, color 0.15s',
  },
});
