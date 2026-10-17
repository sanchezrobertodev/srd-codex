/// <reference types="vite/client" />
// Stands in for artFiles.ts in the Codex single-file build (DAG-70): the art is left out, so that one
// HTML file stays small, and the creature-type and class silhouettes (a few kilobytes of SVG) stay.

const rel = (urls: Record<string, string>) => Object.fromEntries(Object.entries(urls).map(([k, v]) => [k.replace(/^\.\.\//, ""), v]));

export const ART_URLS: Record<string, string> = {};
export const ICON_URLS: Record<string, string> = rel(import.meta.glob("../files/icons/**/*.svg", { query: "?url", import: "default", eager: true }));
export const PROP_URLS: Record<string, string> = {};
