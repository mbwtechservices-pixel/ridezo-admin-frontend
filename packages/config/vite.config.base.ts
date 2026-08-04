import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export interface CreateViteConfigOptions {
  appName: string;
  port: number;
  rootDir: string;
}

export function createViteConfig(options: CreateViteConfigOptions): UserConfig {
  const { appName, port, rootDir } = options;

  return defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
        '@ridezo/ui': path.resolve(rootDir, '../../packages/ui/src'),
        '@ridezo/types': path.resolve(rootDir, '../../packages/types/src'),
        '@ridezo/utils': path.resolve(rootDir, '../../packages/utils/src'),
      },
    },
    server: {
      port,
      strictPort: true,
      host: true,
    },
    preview: {
      port,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
    define: {
      __APP_NAME__: JSON.stringify(appName),
    },
  });
}
