import rsc from "@vitejs/plugin-rsc/plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    rsc({
      entries: {
        client: "src/entry.browser.tsx",
        rsc: "src/entry.rsc.runtime.tsx",
        ssr: "src/entry.ssr.tsx",
      },
    }),
    devtoolsJson(),
  ],
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          output: {
            format: "cjs",
            exports: "named",
            entryFileNames: "[name].js",
            chunkFileNames: "assets/[name]-[hash].js",
          },
          external: (id) => {
            // Keep Node.js built-ins external
            return /^(node:|fs|path|url|crypto|stream|util|events|buffer|os|http|https|querystring|zlib)$/.test(id);
          },
        },
      },
      resolve: {
        noExternal: /^(?!node:)/,
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          output: {
            format: "cjs",
            exports: "named",
            entryFileNames: "[name].js",
            chunkFileNames: "assets/[name]-[hash].js",
          },
          external: (id) => {
            // Keep Node.js built-ins external
            return /^(node:|fs|path|url|crypto|stream|util|events|buffer|os|http|https|querystring|zlib)$/.test(id);
          },
        },
      },
      resolve: {
        noExternal: /^(?!node:)/,
      },
    },
  },
});
