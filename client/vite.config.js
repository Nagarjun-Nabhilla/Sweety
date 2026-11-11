import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// "/api" requests from React are forwarded to the Express server.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
  // Tests run in a fake browser (jsdom). globals: true lets Testing Library clean up after each test.
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js' },
});
