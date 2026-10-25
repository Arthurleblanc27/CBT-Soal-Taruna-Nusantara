import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [preact({ compat: true }), tailwind()],
  vite: {
    resolve: {
      preserveSymlinks: true,
    },
  },
  server: {
    port: 4321,
    host: true,
  },
  prefetch: {
    prefetchAll: true,
  },
});
