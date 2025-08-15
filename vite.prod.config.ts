import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: true,
    target: "node20",
    outDir: "dist/prod",
    rollupOptions: {
      input: "server.js",
      output: {
        format: "cjs",
        entryFileNames: "server.js",
      },
      external: [
        // Keep these as external since they'll be in Lambda layers or node_modules
        // Remove if you want to bundle everything
      ],
    },
    minify: false, // Set to true for smaller bundle
  },
  ssr: {
    noExternal: true, // Bundle all dependencies
  },
});