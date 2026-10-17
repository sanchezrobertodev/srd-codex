// The third-party licence log (DAG-40): every asset file the game ships, where it came from, who
// made it and under which licence. licences.json is the log; this file types it and groups it for
// the credits screen. A test fails when a tracked asset file is missing from the log.

import log from "../licences.json";

export type LicenceId = "CC0-1.0" | "CC-BY-3.0" | "OFL-1.1" | "project";

export const LICENCE_NAMES: Record<LicenceId, { name: string; url?: string }> = {
  "CC0-1.0": { name: "CC0 1.0 (public domain)", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "CC-BY-3.0": { name: "CC BY 3.0", url: "https://creativecommons.org/licenses/by/3.0/" },
  "OFL-1.1": { name: "SIL Open Font License 1.1", url: "https://openfontlicense.org" },
  project: { name: "Made for this game" },
};

/** Where a pack (or a set of the project's own files) comes from. */
export interface PackInfo {
  name: string;
  author: string;
  source: string;
  licence: LicenceId;
  /** What the game uses it for. */
  use: string;
}

/** How an AI-generated file was made (DAG-69): required on every entry with `ai`. */
export interface AiProvenance {
  /** The generator, e.g. "GPT Image (Codex CLI)". */
  model: string;
  /** The prompt, or the name of the style brief plus the subject. */
  prompt: string;
  /** Who reviewed it; empty until someone has. */
  reviewer: string;
  reviewed: boolean;
}

export interface LicenceEntry {
  /** Path from the repository root, with forward slashes. */
  file: string;
  /** A key of `packs`. */
  pack: string;
  /** What the file is, in the pack's own words where it has them. */
  title: string;
  author: string;
  /** The page the file came from. */
  source: string;
  licence: LicenceId;
  /** YYYY-MM-DD. */
  added: string;
  /** What we changed (renamed files aren't counted as changed). */
  changes?: string;
  /** Present when the file is AI-generated. Shipped AI art must be disclosed (Steam, itch.io). */
  ai?: AiProvenance;
  /** A stand-in to be replaced before release (DAG-41). */
  placeholder?: boolean;
}

export interface LicenceLog {
  packs: Record<string, PackInfo>;
  files: LicenceEntry[];
}

export const LICENCE_LOG = log as LicenceLog;

/** One block on the credits screen: a pack with the people who made the files we use. */
export interface CreditGroup {
  pack: string;
  name: string;
  source: string;
  licence: LicenceId;
  use: string;
  /** The authors of the files we use, in order of first appearance. */
  authors: string[];
  files: number;
  ai: boolean;
}

/** The credits, one group per pack that has at least one file in the log. */
export function creditGroups(entries: readonly LicenceEntry[] = LICENCE_LOG.files, packs: Record<string, PackInfo> = LICENCE_LOG.packs): CreditGroup[] {
  const groups = new Map<string, CreditGroup>();
  for (const e of entries) {
    const p = packs[e.pack];
    if (!p) continue;
    let g = groups.get(e.pack);
    if (!g) {
      g = { pack: e.pack, name: p.name, source: p.source, licence: p.licence, use: p.use, authors: [], files: 0, ai: false };
      groups.set(e.pack, g);
    }
    for (const a of e.author.split(/\s*,\s*|\s+and\s+/)) if (a && !g.authors.includes(a)) g.authors.push(a);
    g.files++;
    g.ai ||= !!e.ai;
  }
  return [...groups.values()];
}

/** Problems with the log itself: unknown packs, missing fields, AI files without provenance. */
export function logProblems(log: LicenceLog = LICENCE_LOG): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const e of log.files) {
    const at = e.file || "(no file)";
    if (seen.has(e.file)) problems.push(`${at}: listed twice`);
    seen.add(e.file);
    if (!log.packs[e.pack]) problems.push(`${at}: unknown pack "${e.pack}"`);
    if (!(e.licence in LICENCE_NAMES)) problems.push(`${at}: unknown licence "${e.licence}"`);
    for (const k of ["title", "author", "source"] as const) if (!e[k]) problems.push(`${at}: no ${k}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.added)) problems.push(`${at}: "added" isn't a date`);
    if (e.ai && (!e.ai.model || !e.ai.prompt || typeof e.ai.reviewed !== "boolean" || (e.ai.reviewed && !e.ai.reviewer))) {
      problems.push(`${at}: AI provenance needs model, prompt, reviewed and (once reviewed) reviewer`);
    }
  }
  return problems;
}

/** Files that must not ship in a release build: AI files nobody has reviewed, and placeholders. */
export function releaseBlockers(log: LicenceLog = LICENCE_LOG): LicenceEntry[] {
  return log.files.filter((e) => e.placeholder || (e.ai && !e.ai.reviewed));
}
