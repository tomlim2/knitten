import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Caol HQ — personal cockpit dashboard.
// Migration target replacing the legacy `caol-serve-skills` Express monolith.
// Runs on a non-colliding port while the legacy server keeps :972.
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
