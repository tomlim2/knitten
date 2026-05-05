import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Caol HQ — personal cockpit dashboard.
// Port 9720 (4-digit homage to the legacy 972 — privileged port on macOS).
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: {
    host: 'localhost',
    port: 9720,
  },
  vite: {
    server: {
      // Watch the Obsidian vault and Claude config so HMR fires when
      // learnings / standards / skills / hardware / repos change on disk.
      watch: { ignored: ['**/node_modules/**'] },
    },
  },
});
