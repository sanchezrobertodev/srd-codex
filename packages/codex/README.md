# @dnd/codex

The SRD 5.1 Bestiary, Spellbook and Armory as a React component, laid out like the printed rulebooks. All data (334 monsters, 319 spells, 199 items) is bundled from `@dnd/data`; nothing is fetched at runtime.

```tsx
import { Codex } from "@dnd/codex";
import "@dnd/codex/codex.css"; // apps without Tailwind: compiled, self-contained styles

<Codex />                                   // full browser with tabs
<Codex initialTab="spells" onClose={...} />  // optional close button and start tab
<StatBlock m={monster} />                    // or the pieces: StatBlock, SpellPage, ItemPage
```

Apps that already run Tailwind v4 should skip `codex.css` and instead add to their own stylesheet:

```css
@import "@dnd/codex/statblock.css";
@source "../path/to/node_modules/@dnd/codex/src";
```

`pnpm --filter @dnd/codex build:css` regenerates `dist/codex.css`.

## Links, search and previews (DAG-76)

- **Links:** every chapter and entry has a link of its own in the location hash: `#bestiary`, `#bestiary.goblin`, `#spells.fireball`, `#armory.longsword`.
  - The Codex follows the hash, so the browser's back and forward buttons work.
  - A link from anywhere opens that entry.
  - These are bare tokens, so they work in the standalone builds, inside the game and in an Artifact.
  - `@dnd/codex/route` (`parseCodexHash`, `codexHref`) reads and writes them without loading the SRD data. The game uses it to open the Codex when the hash is a Codex link, and clears the hash when the Codex closes.
- **Search:** `/` (outside a text field) or Ctrl+K searches every chapter by name.
  - Results are ranked: the whole name first, then the start of the name, then the start of a word, then anywhere.
  - They are grouped by chapter, each with its short facts.
  - Arrow keys move, Enter opens and Escape closes.
  - Before typing, the search lists the entries you opened recently. These are kept in `localStorage` under `dnd-codex:recent`, if the browser allows it.
- **Rules text** (`RulesText`, `linkRules`):
  - conditions and damage types get a short reminder from `CONDITION_TEXT` and `DAMAGE_TYPE_TEXT` in `@dnd/data`, written in our own words;
  - a spellcaster's spell names link to their pages, but only in spellcasting text, where a name like "light" or "shield" is a spell;
  - weapon actions named after an Armory item ("Longsword", "Light Crossbow") link to it.

  Each link or term shows a preview card on hover or keyboard focus. On a touch screen, the first tap shows the preview and a second tap follows the link.

## Lists and filters (DAG-77)

Each chapter is described by a spec in `filters.ts` (`BESTIARY`, `SPELLBOOK`, `ARMORY`): its filters, sorts and, for the Bestiary, the challenge range. Choices inside one filter combine with OR, and different filters combine with AND.

- **Bestiary:**
  - challenge: quick bands, plus a from–to range that also allows a single CR;
  - type, size, alignment ("evil" doesn't match "any non-evil");
  - where it lives, from the game's encounter tables (biomes and kinds of site);
  - sort by challenge, name or type.
- **Spellbook:**
  - level (quick chips), school, class;
  - casting time (action, bonus action, reaction, a minute or longer);
  - concentration, ritual;
  - damage type and saving throw, from the engine's effect or the spell's text;
  - sort by level, name or school.
- **Armory:**
  - kind (quick chips), category, weapon range, weapon property;
  - cost and weight bands;
  - sort by kind, name, cost or weight.

**The filter bar:**
- a name filter and quick chips, with the rest under "More filters";
- the chosen filters as removable chips, a count and "Clear filters";
- the sort, and a list or cards view (remembered in `localStorage` under `dnd-codex:view`).

**Links:** the open chapter's filters live in its link as `~key-value` segments between the chapter and the entry, for example `#bestiary~cr-1_4-4~type-undead~sort-name.zombie`, so a filtered view can be shared.
- A value is written with only letters, digits and `_`.
- Changing a filter rewrites the link in place. Opening an entry adds a history step.
- Links inside the Codex (chapters, rows, search results, cross-links) carry each target chapter's filters, so moving around doesn't lose them.
- Used on their own, `Bestiary`, `Spellbook` and `Armory` keep their filters in their own state.

## Entry pages and themes (DAG-78)

Each entry opens as a parchment page with notes beside it. The notes sit beside the page when its column is at least 52rem wide (a container query on `.codex-page-area`), and under it otherwise.

- **Monster pages:**
  - the stat block in the rulebook's order, with an art slot and an "at a glance" strip (AC, HP, speed, challenge);
  - Proficiency Bonus, "passive Perception", and spellcasting lists one level per line with each spell linked;
  - notes: where the creature turns up in the game's encounter tables (each place links to the Bestiary filtered by it), its initiative, and similar creatures.
- **Spell pages:**
  - casting time, range, components and duration at a glance;
  - the description, At Higher Levels, and the classes as links to the Spellbook filtered by class;
  - notes: the creatures that cast it, and other spells of its level and school.
- **Item pages:**
  - cost, weight, damage or AC at a glance, with an art slot;
  - each weapon property explained in plain words (`WEAPON_PROPERTY_TEXT` in `@dnd/data`, our own wording);
  - notes: the creatures that fight with it, and similar items.
- **Landing:** before an entry is opened, each chapter shows "good places to start" and the recently opened entries.

The art slot shows the entry's initials on a seal until the art lands (DAG-71 to DAG-73). `StatBlock` and `ItemPage` take `art={false}` to leave it out in small panels. `notes.ts` holds the helpers behind the notes.

**Developer details:** engine ids and spell effects are hidden. Set `localStorage["dnd-codex:dev"] = "1"` to show them.

**Themes:** the chrome is drawn with the host's `slate`, `stone` and `ember` tokens, and the light theme redefines them inside `.codex-theme`.
- Dark is the game's slate; light is a parchment reading theme. The pages are parchment in both.
- The header's Theme menu offers dark, light, or "as the system", remembered in `localStorage` under `dnd-codex:theme`.
- `Codex` takes `defaultTheme` for the first visit. The game passes `"dark"`; the standalone app follows the system.

## Phones, keyboards and screen readers (DAG-79)

- **Phones** (narrower than 768 px):
  - the list and the page are separate screens. Opening an entry shows its page with "Back to the Bestiary" (or the Spellbook, or the Armory) above it; Back returns to the list with that entry's row in view;
  - the chapter counts and the search's `/` hint are hidden to fit, and nothing scrolls sideways;
  - every control is at least 44 px tall (the `codex-tap` class). Links inside running rules text are exempt, as WCAG allows for inline links.
- **Keyboard:**
  - the list is one Tab stop (the open entry, else the last one opened, else the first). Arrow keys move through it (two-dimensional in the cards view), Page Up and Page Down jump ten, Home and End go to the ends, and Enter opens the entry;
  - "/" or Ctrl+K opens the search, a combobox with an active option;
  - previews of linked spells, items, conditions and damage types open on focus as well as on hover;
  - focus always shows a ring (`.codex-theme :focus-visible`).
- **Screen readers:**
  - an `h1` ("Codex", visually hidden), the chapter `nav`, and a labelled region each for the list and the page;
  - the page's heading is the entry's name, with sections below it;
  - the "at a glance" figures are a description list, and the ability scores a table with a caption and the full ability names;
  - the art slot is an image labelled with the entry's name. The art manifest's alt text replaces it when DAG-70 lands.
- **Checks:** contrast meets WCAG AA in both themes. In a dev build, `await axeCheck()` in the console runs axe on the current screen, as in the game. The standalone app wraps the Codex in `main`.

## Reactions, legendary actions and magic items (DAG-83)

The SRD importer (`pnpm import-srd`) now brings in what the stat blocks and the Armory were missing. It's reference data: the engine doesn't use it yet.

- **Reactions and legendary actions:** `MonsterData.reactions` (12 creatures) and `MonsterData.legendary` (32 creatures) with `uses`, the paragraph that introduces them, and the options. The stat block shows them after the actions, in the rulebook's order. The source data leaves out that paragraph, so the importer writes the SRD's standard wording with the creature's short name ("The dragon can take 3 legendary actions…").
- **Magic items:** the SRD's 239 magic items, in `MAGIC_ITEMS` (`@dnd/data`, `generated/magic-items.json`) and the `MagicItemData` type, with type, rarity (or "varies" plus each form's rarity), attunement (and by whom), and the SRD's heading line. They aren't `ItemData`, so the engine's weapons, armor and gear don't change.
  - The magic Potion of Healing shares its id with the game's potion, so it's listed as "Potions of Healing" (`potions-of-healing`), the table of all four.
  - Two headings with typos in the source ("Wondous item", "Wondrous Items") are corrected.
- **The Armory:**
  - lists both (438 entries), with a Magic items chip, and Magic item type, Rarity and Attunement filters. An item whose rarity varies matches each of its forms;
  - adds a Rarity sort. Magic items have no price or weight in the SRD, so the cost and weight filters leave them out and those sorts put them last;
  - shows a magic item's page with its heading, type, rarity and attunement at a glance, and similar items of the same type.
- **Tables:** rules text renders the source's pipe tables, with their caption ("Potions of Healing (table)"), for magic items and seven spells (Confusion, Teleport, …).

## Classes and Races (DAG-84)

Two more chapters, in the same frame as the others: the one search, links of their own (`#classes.wizard`, `#races.dwarf`), filters in the link, the landing, the notes column, art slots, both themes and phones. They're built from the data the game already uses (`CLASSES`, `RACES`, the creator's `CLASS_GUIDE`, `RACE_GUIDE`, `CLASS_KITS` and `PREMADE_HEROES`), so the Codex and the character creator say the same things.

- **Classes** (12):
  - at a glance: hit die, primary ability, saving throws, spellcasting;
  - hit points, proficiencies, and the starting equipment as the game's kit offers it (choices and fixed items, with the starting gold to buy your own instead);
  - the class table by level: proficiency bonus, features, the class's own columns (Rages, Martial Arts, Sneak Attack, Sorcery Points, Invocations Known), cantrips and spells known, and spell slots (the Warlock's as slots and slot level);
  - each feature once, with the levels it comes at, and a link to the class's spell list in the Spellbook;
  - filters: how it casts (full, half, pact, none), for new players, hit die, primary ability; sorts by name or hit die;
  - notes: the quick start heroes of the class, and the races that raise its main abilities.
- **Races** (9), listed by the race's own name ("Dwarf"):
  - at a glance: ability scores (with the Half-Elf's choice), size, speed, darkvision;
  - ability score increase, languages, the race's traits, then its SRD subrace ("Hill Dwarf") with what that adds;
  - filters: size, for new players, darkvision, abilities raised; sorts by name or speed;
  - notes: the quick start heroes of the race, and the classes whose main abilities it raises.
- **Data** (`pnpm import-srd`, additive):
  - `ClassData.columns` holds the class tables' own columns from 5e-bits' class_specific values;
  - `RaceData.subrace` holds the merged subrace's id, name, ability bonuses and traits, plus the race's own name. `RaceData.name` stays the subrace's, as the game shows it.
- Wide tables scroll inside their own box, which takes keyboard focus. The search box says "Search the Codex", and the chapter tabs wrap on phones.

## The Codex in play (DAG-81)

`CodexPanel` shows one entry (its page and notes) in a side panel, so the game can open a creature, spell or item without leaving play: `<CodexPanel chapter="bestiary" id="goblin" onClose={...} />`. `aside` puts something above the entry (the game's inspect panel, DAG-177: what the party knows of a creature), and `label` names the panel.
- Links inside the panel open their entry in it, with a Back button. A link to a filtered list opens the whole Codex.
- "Open in the Codex" opens the whole Codex at the entry.
- Escape or the close button closes it, and focus returns to where it was. It takes the remembered theme, dark by default.

## Standalone builds

`apps/codex` wraps this component with no other dependencies:

- `pnpm --filter @dnd/codex-app build` -> `apps/codex/dist/`: a static site with a service worker. Host it anywhere (GitHub Pages, a NAS, a folder behind any web server); once opened it is installable and works offline.
- `pnpm --filter @dnd/codex-app build:single` -> `apps/codex/dist-single/index.html`: one file of about 4 MB with everything inlined. Open it from disk, mail it, keep it on a USB stick.

## Attribution

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, licensed under the Creative Commons Attribution 4.0 International License (https://creativecommons.org/licenses/by/4.0/legalcode). JSON transcription via https://github.com/5e-bits/5e-database.
