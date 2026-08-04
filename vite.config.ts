import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ridezo Admin',
        short_name: 'Ridezo Admin',
        description: 'Ridezo operations dashboard',
        theme_color: '#16D1B2',
        background_color: '#f3faf8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/manifest\.webmanifest$/],
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ridezo/ui': path.resolve(__dirname, './packages/ui/src'),
      '@ridezo/types': path.resolve(__dirname, './packages/types/src'),
      '@ridezo/utils': path.resolve(__dirname, './packages/utils/src'),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 5175,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-table': ['@tanstack/react-table'],
          'vendor-charts': ['recharts'],
          'vendor-export': ['xlsx', 'jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
}));
