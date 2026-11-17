import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'build',
    // firebase.json marks /static/** as immutable; only hashed bundles belong there.
    assetsDir: 'static',
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
    css: false,
    include: ['src/**/*.test.{js,jsx}'],
  },
});
