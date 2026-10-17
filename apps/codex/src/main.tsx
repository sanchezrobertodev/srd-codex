import React from "react";
import ReactDOM from "react-dom/client";
import { Codex } from "@dnd/codex";
import "./index.css";

// Dev builds only: `await axeCheck()` in the console runs axe on the current screen (as in the game, DAG-53).
if (import.meta.env.DEV) {
  Object.assign(window, {
    axeCheck: async () => {
      const { default: axe } = await import("axe-core");
      const { violations } = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] });
      console.table(violations.map((v) => ({ rule: v.id, impact: v.impact, count: v.nodes.length, first: v.nodes[0]?.target.join(" ") })));
      return violations;
    },
  });
}

const footer = (
  <p className="mt-3 text-center text-[11px] text-stone-500">
    This work includes material from the System Reference Document 5.1 by Wizards of the Coast LLC, licensed under CC-BY-4.0. Data via 5e-bits/5e-database. Class and creature-type silhouettes by Lorc and Delapouite from{" "}
    <a className="underline" href="https://game-icons.net">game-icons.net</a>, licensed under{" "}
    <a className="underline" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Illustrations by Roberto Sanchez, made with AI image generation and reviewed by hand, licensed under{" "}
    <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Not affiliated with or endorsed by Wizards of the Coast.{" "}
    <a className="underline" href="https://github.com/sanchezrobertodev/srd-codex">Source</a>. Installable; works offline.
  </p>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <main className="h-screen">
      <Codex footer={footer} />
    </main>
  </React.StrictMode>,
);
