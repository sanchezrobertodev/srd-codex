import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { viteSingleFile } from "vite-plugin-singlefile";
import { assetReleaseCheck } from "@dnd/assets/release";
import { fileURLToPath } from "node:url";

/**
 * Two builds from one app:
 *   pnpm build         -> dist/         static site + service worker (deploy anywhere; installable, offline)
 *   pnpm build:single  -> dist-single/  one self-contained index.html (open from disk, mail it, keep it)
 */
const single = process.env.SINGLE === "1";

/**
 * The single file leaves the art out (DAG-70): the art manifest's file list is swapped for one with
 * no pictures, so entries show their silhouettes and seals, and the file stays within its budget.
 */
const noArt = {
  name: "dnd-codex-no-art",
  enforce: "pre" as const,
  resolveId(source: string, importer?: string) {
    if (source === "./artFiles" && importer?.split("\\").join("/").includes("/packages/assets/src/")) {
      return fileURLToPath(new URL("../../packages/assets/src/artFiles.none.ts", import.meta.url));
    }
    return null;
  },
};

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    // DND_RELEASE=1 refuses a build while placeholders or unreviewed AI art remain.
    assetReleaseCheck(),
    ...(single
      ? [noArt, viteSingleFile({ removeViteModuleLoader: true })]
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg"],
            manifest: {
              name: "SRD Codex",
              short_name: "Codex",
              description: "SRD 5.1 Bestiary, Spellbook, Armory, Classes and Races. Works offline.",
              theme_color: "#14110f",
              background_color: "#14110f",
              display: "standalone",
              icons: [
                { src: "icon-192.png", sizes: "192x192", type: "image/png" },
                { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
              ],
            },
            workbox: {
              // The whole app, data included, is precached on first visit, and so are the thumbnails
              // (about 4 MB, DAG-80), so lists and cards have their pictures offline.
              globPatterns: ["**/*.{js,css,html,svg,png,woff2}", "**/thumb-*.webp"],
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
              runtimeCaching: [
                // Page pictures load as entries are opened (DAG-70), so they are kept once seen, not
                // precached (about 50 MB in all). Room for every entry's picture in every chapter.
                {
                  urlPattern: /\.webp$/,
                  handler: "CacheFirst",
                  options: { cacheName: "art", expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 365 } },
                },
                {
                  urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
                  handler: "CacheFirst",
                  options: { cacheName: "fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
                },
              ],
            },
          }),
        ]),
  ],
  server: { port: 5175, strictPort: true },
  build: single ? { assetsInlineLimit: 100_000_000, cssCodeSplit: false } : {},
});
