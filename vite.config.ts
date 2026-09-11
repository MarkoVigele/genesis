import { defineConfig } from "vite";

export default defineConfig({
  base: "/genesis/",
  build: {
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true,
    port: 5173,
    open: "/genesis/",
  },
  preview: {
    host: true,
    port: 4173,
  },
});
