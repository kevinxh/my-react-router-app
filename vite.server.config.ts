import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: true,
    target: "node20",
    outDir: "dist/server",
    rollupOptions: {
      input: "ssr.js",
      output: {
        format: "cjs",
        entryFileNames: "ssr.js",
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