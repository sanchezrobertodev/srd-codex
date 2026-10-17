// The release check (DAG-70): a public build must not ship a placeholder or AI art nobody has
// reviewed (DAG-41, DAG-69). Used two ways:
//   - as a Vite plugin in the apps: `vite build` with DND_RELEASE=1 fails while the log has blockers;
//   - from the command line: `pnpm release-check` (exit code 1 with the list).
// Ordinary builds and the dev server are not affected, so work in progress keeps running.
//
// Vite configs load this file in Node as it is, so it imports only types and Node built-ins, and
// reads the log from disk.

import { readFileSync } from "node:fs";
import type { LicenceEntry, LicenceLog } from "./licences";

function readLog(): LicenceLog {
  return JSON.parse(readFileSync(new URL("../licences.json", import.meta.url), "utf8")) as LicenceLog;
}

/** Placeholders and unreviewed AI art (the same rule as `releaseBlockers` in licences.ts). */
const blocks = (e: LicenceEntry) => !!e.placeholder || (!!e.ai && !e.ai.reviewed);

/** The blockers, one line each; empty when the log is ready for a release. */
export function releaseProblems(log: LicenceLog = readLog()): string[] {
  return log.files.filter(blocks).map((e) => `${e.file}: ${e.placeholder ? "placeholder" : "AI art not yet reviewed"}`);
}

/** A Vite plugin that refuses a release build (DND_RELEASE=1) while there are blockers. */
export function assetReleaseCheck(env: Record<string, string | undefined> = process.env) {
  return {
    name: "dnd-asset-release-check",
    apply: "build" as const,
    buildStart() {
      if (env.DND_RELEASE !== "1") return;
      const problems = releaseProblems();
      if (problems.length) {
        throw new Error(`A release build can't ship these files (review them with "pnpm --filter @dnd/assets art review", or replace them):\n  ${problems.join("\n  ")}`);
      }
    },
  };
}
