import { stylex } from 'stylex';

export const styles = stylex.create({
  container: {
    padding: 32,
    maxWidth: 600,
    margin: 'auto',
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
    fontSize: 27,
    marginTop: 12,
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
    fontSize: 32,
    padding: '16px 64px',
    marginTop: 24,
  },
});
