import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Set VITE_BASE in the GitHub Actions workflow (or .env) to match your repo name.
// Example: VITE_BASE=/crafting-editor/
// Defaults to '/' for local dev.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      base,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Crafting Editor — PSDK',
        short_name: 'CraftingED',
        description: 'Recipe editor for Pokémon Studio crafting system',
        theme_color: '#5b6af0',
        background_color: '#080a0f',
        display: 'standalone',
        orientation: 'landscape',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 1420,
  },
});
