/// <reference types="vite/client" />
// The URLs of the art and icon files, keyed by their path in packages/assets ("files/art/monster/
// goblin/page.webp"). Vite copies each file into the build and gives back its URL, so pictures load
// on demand and never sit inside a script (`?no-inline`, even for the smallest thumbnails). The Codex single-file build replaces this module with
// artFiles.none.ts (art left out, silhouettes kept).

const rel = (urls: Record<string, string>) => Object.fromEntries(Object.entries(urls).map(([k, v]) => [k.replace(/^\.\.\//, ""), v]));

export const ART_URLS: Record<string, string> = rel(import.meta.glob("../files/art/**/*.webp", { query: "?no-inline", import: "default", eager: true }));
export const ICON_URLS: Record<string, string> = rel(import.meta.glob("../files/icons/**/*.svg", { query: "?url", import: "default", eager: true }));
