import './global.css';
import './stylex.css';
import './press-start-2p.css';
import './shake.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
