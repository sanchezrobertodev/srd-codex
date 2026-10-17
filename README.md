# SRD Codex

**A free, offline-capable rulebook for the 5th edition System Reference Document (SRD 5.1):** every creature, spell, item, class and race in the SRD, with stat blocks laid out like a printed rulebook, one search box, filters you can share as links, and a hand-reviewed ink-and-watercolour illustration for every entry.

**Open it:** https://sanchezrobertodev.github.io/srd-codex/

## What's in it

| Chapter | Entries | Highlights |
|---|---|---|
| Bestiary | 334 creatures | full stat blocks, reactions and legendary actions, filters by CR, type, size, habitat, alignment |
| Spellbook | 319 spells | school, level, class lists, ritual/concentration filters, damage types |
| Armory | 438 items | weapons, armour, gear and 239 magic items, with rarity and attunement |
| Classes | 12 | class tables by level, features, spell slots, starting equipment |
| Races | 9 | traits, ability increases and the SRD subrace |

- **Search everything** with `/` or `Ctrl+K`. Rule terms (conditions, damage types, weapon properties) show a preview on hover or focus.
- **Links are shareable**: `#bestiary.goblin`, or a filtered list such as `#bestiary~cr-1~type-undead`.
- **Light and dark themes**, phone layouts, full keyboard navigation and screen-reader labels (checked against WCAG 2.1 AA with axe).
- **Works offline**: it's a PWA. Open it once and install it; lists and thumbnails are cached up front, full pictures as you view them.

## Run it locally

Needs Node 22+ and pnpm 9 (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:5175
pnpm test         # unit tests
pnpm typecheck
```

### Builds

- `pnpm build` → `apps/codex/dist/`: the static site with a service worker. Host it anywhere.
- `pnpm build:single` → `apps/codex/dist-single/index.html`: one self-contained file (about 1.7 MB, no pictures; entries show silhouettes). Open it from disk or keep it on a USB stick.

Set `DND_RELEASE=1` on a build to refuse it while any picture is a placeholder or unreviewed (the Pages deploy does this).

### Deploying

Pushing to `main` runs `.github/workflows/pages.yml`: typecheck, tests, a release build, then GitHub Pages. In the repository's **Settings → Pages**, the source must be **GitHub Actions**.

## Layout

```
apps/codex        the site: Vite + React + Tailwind, PWA
packages/codex    the Codex component (chapters, search, filters, pages) — see its README
packages/data     SRD 5.1 data as typed JSON, and the importer that builds it from 5e-database
packages/shared   the data types
packages/assets   illustrations, icons, the art manifest and the licence log
```

The game data was normalised from [5e-bits/5e-database](https://github.com/5e-bits/5e-database). To re-import, copy that repo's `src/2014/5e-SRD-*.json` files into `packages/data/raw/` without the `5e-SRD-` prefix (`Classes.json`, `Monsters.json`, …) and run `pnpm import-srd`.

## Origin

The Codex began as the in-game rulebook of a private D&D-style game by the same author and was copied out on 2026-10-17 to stand on its own. The `@dnd/*` package names and the story ids in comments (`DAG-…`) come from there.

## Licences

- **Code:** MIT, see [LICENSE](LICENSE).
- **Illustrations:** CC BY 4.0, AI-generated and reviewed by hand, see [LICENSE-ART.md](LICENSE-ART.md).
- **SRD 5.1 text and data:** © Wizards of the Coast LLC, CC BY 4.0.
- **Icons:** game-icons.net, CC BY 3.0.

Full details and attributions: [NOTICE.md](NOTICE.md).

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, licensed under the Creative Commons Attribution 4.0 International License. SRD Codex is unofficial and is not affiliated with or endorsed by Wizards of the Coast.
