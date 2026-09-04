import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      // Custom plugin to force Google AI Studio/Vite to serve assetlinks.json
      {
        name: 'serve-well-known',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/.well-known/assetlinks.json') {
              const filePath = path.resolve(__dirname, 'public/.well-known/assetlinks.json');
              if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', 'application/json');
                res.end(fs.readFileSync(filePath));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    assetsInclude: ['**/.well-known/*'], // Explicitly includes dotfiles in building
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});