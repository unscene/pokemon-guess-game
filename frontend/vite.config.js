import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from 'vite-plugin-stylex';

export default defineConfig({
  plugins: [react(), stylex()],
  server: {
    port: 3000,
    proxy: {
      '/game': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
