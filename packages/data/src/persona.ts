// Suggestions for a hero's personality (DAG-52). The SRD's Acolyte has its own tables (in
// backgrounds.ts); every other background uses these, which are original, written for this game.

import { findBackgroundByName } from "./backgrounds";

export interface PersonaTables {
  traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

/** Original tables for backgrounds without their own. */
export const GENERIC_PERSONA: PersonaTables = {
  traits: [
    "I notice exits, faces and anything that doesn't belong, and I say so out loud.",
    "I hum old work songs when I'm nervous, and I'm nervous more often than I let on.",
    "I keep careful accounts of every favour owed, mine and everyone else's.",
    "I can't leave a stranger's question unanswered, even a rude one.",
    "I trust my hands more than my words: I'd rather fix it than explain it.",
    "I tell the same three stories about my past, and they get better each time.",
    "I eat as if every meal might be my last, and share as if it were someone else's.",
    "Silence makes me uneasy, so I fill it.",
  ],
  ideals: [
    "Fairness. Rules should bind the strong as tightly as the weak.",
    "Freedom. No one should bow to a master they didn't choose.",
    "Craft. Anything worth doing is worth doing properly.",
    "Belonging. I fight for the people who took me in.",
    "Curiosity. There is always something past the next hill, and I mean to see it.",
    "Mercy. Everyone deserves one more chance than they think they do.",
  ],
  bonds: [
    "Someone back home is waiting for a letter I keep failing to write.",
    "I carry a keepsake from a friend who didn't make it, and I mean to take it where they always wanted to go.",
    "I owe my life to a stranger whose name I never learned.",
    "My old companions scattered after one bad night, and I want to find them.",
    "There's a place I swore to protect, and I'll know when it's in danger.",
    "A rival of mine is out there doing better than me, and I can't stand it.",
  ],
  flaws: [
    "I make promises faster than I can keep them.",
    "When I'm afraid, I get loud and reckless.",
    "I can't resist a locked door, a sealed letter or a sore subject.",
    "I hold grudges long past the point of sense.",
    "I think I'm the only one who sees the danger, and I say so too often.",
    "Gold within reach makes my good judgement go quiet.",
  ],
};

/** The tables for a background: its own (the SRD's Acolyte), or the original ones. */
export function personaTables(backgroundName: string): PersonaTables & { fromBackground: boolean } {
  const c = findBackgroundByName(backgroundName)?.characteristics;
  return c ? { ...c, fromBackground: true } : { ...GENERIC_PERSONA, fromBackground: false };
}

/** Pieces for a suggested appearance, joined as "Lean, with a crooked nose and a faded red scarf." Original. */
export const APPEARANCE_PARTS = {
  builds: ["Lean", "Broad-shouldered", "Wiry", "Heavyset", "Tall and a little stooped", "Small and quick"],
  features: ["a crooked nose", "a scar through one eyebrow", "freckles", "ink-stained fingers", "a chipped front tooth", "weathered skin", "a burn scar on one hand", "grey streaks in dark hair"],
  touches: ["patched travelling clothes", "a faded red scarf", "polished boots that don't match the rest", "a hood worn low", "more pockets than anyone needs", "a charm on a cord around the neck"],
};

/** Ways to end a suggested backstory after the background's own summary. Original. */
export const BACKSTORY_TURNS = [
  "Then a letter with no signature sent you looking for answers.",
  "Then the people who raised you vanished, and you want to know why.",
  "Then you took on a debt with no honest way to pay it.",
  "Then a dream you can't shake started pointing you down the same road every night.",
  "Then you decided you were done waiting for life to come to you.",
  "Then someone you trusted sold you out, and you left before they could do it twice.",
];

export const PRONOUN_PRESETS = ["she/her", "he/him", "they/them"];
