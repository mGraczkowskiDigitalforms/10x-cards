// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    session: true,
  },
  integrations: [react(), sitemap()],
  server: { port: 3001 },
  vite: {
    plugins: [tailwindcss()],
  },
});
