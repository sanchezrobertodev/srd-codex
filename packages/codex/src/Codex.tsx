import { createContext, Fragment, type MouseEvent, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { ClassData, ItemData, MagicItemData, MonsterData, RaceData, SpellData } from "@dnd/shared";
import { ABILITIES } from "@dnd/shared";
import { artFor, isArt, RARITY_COLOURS, silhouetteType } from "@dnd/assets";
import { ART_KIND, listShowsArt } from "./art";
import {
  CLASS_GUIDE, CLASS_KITS, CLASSES, COMPLEXITY_LABELS, CONDITION_TEXT, DAMAGE_TYPE_TEXT, MONSTERS, PREMADE_HEROES, RACE_ABILITY_CHOICES, RACE_EXTRA_LANGUAGES, RACE_GUIDE, SPELLS,
  STARTING_GOLD, WEAPON_PROPERTY_TEXT, WEAPON_SPECIAL_TEXT,
} from "@dnd/data";
import {
  ARMORY_ITEMS, cap, chapterName, classById, RACE_ENTRIES, raceById, rarityLabel, type ArmoryItem, costLabel, crLabel, entry, entryFacts, isSpellcasting, itemById, itemForAction, itemKind, linkRules, monsterById, ordinal, searchCodex, spellById, spellKind,
  type Hit,
} from "./entries";
import {
  activeCount, applyFilters, ARMORY, BESTIARY, CLASS_SPEC, RACE_SPEC, raceRaises, decodeFilters, emptyFilters, encodeFilters, groupOf, HABITATS, habitatLabel, SPECS, SPELLBOOK, toggle,
  type ChapterSpec, type FilterState,
} from "./filters";
import { castersOf, FEATURED, monogram, proficiencyBonus, relatedSpells, rulesBlocks, sensesLabel, similarItems, similarMonsters, speedLabel, wieldersOf } from "./notes";
import { chapterSelection, CODEX_CHAPTERS, codexHref, parseCodexHash, type CodexChapter, type CodexRoute } from "./route";

/**
 * The SRD 5.1 reference: Bestiary, Spellbook, and Armory, laid out like the printed rulebooks.
 * Self-contained: the data is bundled, nothing is fetched. Styles come from "./statblock.css"
 * (plain CSS) plus Tailwind utility classes; consumers without Tailwind import "@dnd/codex/codex.css".
 *
 * Every chapter and entry has a link of its own in the location hash (#bestiary.goblin, DAG-76),
 * so back and forward work and an entry can be opened from anywhere. "/" or Ctrl+K searches
 * every chapter at once.
 */

export type CodexTab = CodexChapter;

/** The Codex's colors (DAG-78): the game's dark slate, a light parchment reading theme, or the system's choice. */
export type CodexTheme = "system" | "light" | "dark";
const THEME_KEY = "dnd-codex:theme";
function loadTheme(fallback: CodexTheme): CodexTheme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "system" || t === "light" || t === "dark" ? t : fallback;
  } catch {
    return fallback;
  }
}

const abilityMod = (score: number) => Math.floor((score - 10) / 2);
const ABILITY_NAMES = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" } as const;
/** "Concentration, up to 1 minute", or the duration as it is. */
const durationLabel = (s: SpellData) => (s.concentration && !/^concentration/i.test(s.duration) ? `Concentration, ${s.duration.charAt(0).toLowerCase()}${s.duration.slice(1)}` : s.duration);
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/* ---------------- Route and recent entries ---------------- */

function readRoute(fallback: CodexChapter): CodexRoute {
  const r = parseCodexHash(location.hash);
  if (!r) return { chapter: fallback, id: null, filters: "" };
  return r.id && !entry(r.chapter, r.id) ? { ...r, id: null } : r;
}

function useCodexRoute(fallback: CodexChapter): CodexRoute {
  const [route, setRoute] = useState(() => readRoute(fallback));
  useEffect(() => {
    const on = () => setRoute(readRoute(fallback));
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, [fallback]);
  return route;
}

/**
 * The open entry of one chapter's browser. Inside the Codex it's given; a browser used on its own
 * (<Bestiary /> without `selectedId`) follows the location hash itself, so its links still open
 * entries.
 */
function useChapterSelection(chapter: CodexChapter, given: string | null | undefined): string | null {
  const route = useCodexRoute(chapter);
  if (given !== undefined) return given;
  return chapterSelection(chapter, route);
}

/** Builds the link to a chapter or entry. Inside the Codex it carries that chapter's filters (DAG-77). */
type LinkTo = (chapter: CodexChapter, id?: string | null) => string;
const LinkContext = createContext<LinkTo>((chapter, id) => codexHref(chapter, id));

const RECENT_KEY = "dnd-codex:recent";
type Recent = { chapter: CodexChapter; id: string };

function loadRecent(): Recent[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Recent[];
    return Array.isArray(list) ? list.filter((r) => entry(r.chapter, r.id)) : [];
  } catch {
    return []; // storage blocked (a private window): recent entries just aren't kept
  }
}

function useRecent(route: CodexRoute): Recent[] {
  const [recent, setRecent] = useState(loadRecent);
  useEffect(() => {
    if (!route.id) return;
    setRecent((list) => {
      const next = [{ chapter: route.chapter, id: route.id! }, ...list.filter((r) => !(r.chapter === route.chapter && r.id === route.id))].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* not kept */
      }
      return next;
    });
  }, [route.chapter, route.id]);
  return recent;
}

const nameOf = (r: Recent) => entry(r.chapter, r.id)?.name ?? r.id;

/* ---------------- The Codex ---------------- */

export function Codex({
  onClose, initialTab = "bestiary", footer, defaultTheme = "system",
}: { onClose?: (() => void) | undefined; initialTab?: CodexTab | undefined; footer?: ReactNode; defaultTheme?: CodexTheme | undefined }) {
  const route = useCodexRoute(initialTab);
  const [theme, setTheme] = useState(() => loadTheme(defaultTheme));
  const changeTheme = (t: CodexTheme) => {
    setTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* not kept */
    }
  };
  const recent = useRecent(route);
  const [searching, setSearching] = useState(false);
  const [view, setView] = useState<ListView>(loadView);
  // Each chapter's filters. The open chapter's are in the link, so a filtered view can be shared
  // and back and forward restore it; the others are kept while you look elsewhere.
  const [filters, setFilters] = useState<Record<CodexChapter, FilterState>>(() => ({
    bestiary: emptyFilters(BESTIARY),
    spells: emptyFilters(SPELLBOOK),
    armory: emptyFilters(ARMORY),
    classes: emptyFilters(CLASS_SPEC),
    races: emptyFilters(RACE_SPEC),
    [route.chapter]: decodeFilters(SPECS[route.chapter], route.filters),
  }));
  useEffect(() => {
    setFilters((all) => ({ ...all, [route.chapter]: decodeFilters(SPECS[route.chapter], route.filters) }));
  }, [route.chapter, route.filters]);
  const filterText = (chapter: CodexChapter, state = filters[chapter]) => encodeFilters(SPECS[chapter], state);
  const linkTo: LinkTo = (chapter, id) => codexHref(chapter, id, filterText(chapter));
  const changeFilters = (chapter: CodexChapter, next: FilterState) => {
    setFilters((all) => ({ ...all, [chapter]: next }));
    // Rewrite the link in place: changing a filter isn't a step to go back to.
    if (chapter === route.chapter) history.replaceState(null, "", codexHref(chapter, route.id, filterText(chapter, next)));
  };
  const changeView = (v: ListView) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* not kept */
    }
  };

  // "/" (outside a text field) or Ctrl+K opens the search.
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable=true]");
      if ((e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        e.preventDefault();
        setSearching(true);
      }
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, []);

  const counts: Record<CodexChapter, number> = { bestiary: MONSTERS.length, spells: SPELLS.length, armory: ARMORY_ITEMS.length, classes: CLASSES.length, races: RACE_ENTRIES.length };
  const chapterProps = (chapter: CodexChapter) => ({
    selectedId: route.chapter === chapter ? route.id : null,
    recent,
    filters: filters[chapter],
    onFilters: (next: FilterState) => changeFilters(chapter, next),
    view,
    onView: changeView,
  });
  return (
    <LinkContext.Provider value={linkTo}>
      <div className="codex-theme h-full bg-slate-900 text-stone-200" data-codex-theme={theme}>
      <div className="mx-auto flex h-full max-w-[96rem] flex-col p-3 sm:p-4">
        <h1 className="sr-only">Codex</h1>
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <nav className="flex max-w-full flex-wrap gap-1 rounded-md border border-slate-700 p-1" aria-label="Codex chapters">
            {CODEX_CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={linkTo(c.id)}
                aria-current={route.chapter === c.id ? "page" : undefined}
                className={`codex-tap font-display inline-flex items-center rounded px-3 py-1.5 text-sm no-underline sm:px-4 ${route.chapter === c.id ? "bg-ember text-white" : "text-stone-300 hover:bg-slate-700"}`}
              >
                {c.name}
                {/* The counts don't fit beside the chapter names on a phone. */}
                <span className="ml-1.5 hidden text-[11px] sm:inline">{counts[c.id]}</span>
              </a>
            ))}
          </nav>
          <button
            className="codex-tap flex min-w-[14rem] flex-1 items-center justify-between gap-3 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-left text-sm text-stone-400 hover:border-ember-light"
            onClick={() => setSearching(true)}
            aria-keyshortcuts="/ Control+K"
          >
            <span className="truncate">Search the Codex</span>
            <kbd className="hidden rounded border border-slate-600 px-1.5 text-[11px] text-stone-400 sm:inline">/</kbd>
          </button>
          <label className="flex items-center gap-1 text-xs text-stone-400">
            Theme
            <select className="codex-tap rounded border border-slate-600 bg-slate-800 px-1 py-0.5 text-stone-200" value={theme} onChange={(e) => changeTheme(e.target.value as CodexTheme)}>
              <option value="system">As the system</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          {onClose && (
            <button className="btn-ghost codex-tap" onClick={onClose}>
              Close codex
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1">
          {/* Every chapter stays mounted, each with its own scroll position. */}
          {CODEX_CHAPTERS.map(({ id }) => {
            const Chapter = CHAPTER_BROWSERS[id];
            return (
              <div key={id} className={route.chapter === id ? "h-full" : "hidden"}>
                <Chapter {...chapterProps(id)} />
              </div>
            );
          })}
        </div>
        {footer}
        {searching && <SearchDialog recent={recent} onClose={() => setSearching(false)} linkTo={linkTo} />}
      </div>
      </div>
    </LinkContext.Provider>
  );
}

type ListView = "list" | "cards";
const VIEW_KEY = "dnd-codex:view";
function loadView(): ListView {
  try {
    return localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "list";
  } catch {
    return "list";
  }
}

/* ---------------- Search across every chapter ---------------- */

function SearchDialog({ recent, onClose, linkTo }: { recent: Recent[]; onClose: () => void; linkTo: LinkTo }) {
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  // Before typing: what was opened last, so going back to it is one key away.
  const groups: { label: string; hits: Hit[] }[] = useMemo(
    () =>
      q.trim()
        ? searchCodex(q).map((g) => ({ label: chapterName(g.chapter), hits: g.hits }))
        : recent.length
          ? [{ label: "Recently opened", hits: recent.slice(0, 6).map((r) => ({ chapter: r.chapter, id: r.id, name: nameOf(r), facts: entryFacts(r.chapter, r.id) })) }]
          : [],
    [q, recent],
  );
  const flat = groups.flatMap((g) => g.hits);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => setAt(0), [q]);
  const open = useCallback(
    (i: number) => {
      const h = flat[i];
      if (!h) return;
      location.hash = linkTo(h.chapter, h.id);
      onClose();
    },
    [flat, onClose, linkTo],
  );
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAt((a) => Math.max(0, Math.min(flat.length - 1, a + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter") {
      e.preventDefault();
      open(at);
    }
  };
  let n = -1;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-600 bg-slate-800 shadow-2xl" role="dialog" aria-modal="true" aria-label="Search the Codex" onKeyDown={onKey}>
        <input
          ref={input}
          className="w-full border-b border-slate-600 bg-transparent px-4 py-3 text-lg text-stone-100 outline-none placeholder:text-stone-500"
          placeholder="Search monsters, spells, items, classes and races"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          role="combobox"
          aria-expanded={flat.length > 0}
          aria-controls={listId}
          aria-activedescendant={flat[at] ? `${listId}-${at}` : undefined}
          aria-autocomplete="list"
        />
        <div id={listId} role="listbox" aria-label="Results" className="scrollbar-thin max-h-[60vh] overflow-y-auto py-2">
          {!q.trim() && !flat.length && <p className="px-4 py-2 text-sm text-stone-500">Type a name. Arrow keys move, Enter opens, Escape closes.</p>}
          {q.trim() && !flat.length && <p className="px-4 py-2 text-sm text-stone-500">Nothing in the Codex is called that.</p>}
          {groups.map((g) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <div className="px-4 pb-1 pt-2 font-display text-[11px] uppercase tracking-wider text-ember-light">{g.label}</div>
              {g.hits.map((h) => {
                n++;
                const i = n;
                return (
                  <div
                    key={`${h.chapter}.${h.id}`}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === at}
                    className={`codex-tap flex cursor-pointer items-center justify-between gap-4 px-4 py-1.5 text-sm ${i === at ? "bg-ember/25 text-stone-100" : "text-stone-300"}`}
                    onMouseEnter={() => setAt(i)}
                    onClick={() => open(i)}
                  >
                    <span>{h.name}</span>
                    <span className="whitespace-nowrap text-xs text-stone-500">{h.facts}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Links and previews inside rules text ---------------- */

/**
 * A link or term with a preview card: on hover or keyboard focus; on a touch screen the first tap
 * shows the preview and a second follows the link.
 */
function Previewed({ href, label, children, preview }: { href?: string; label: string; children: ReactNode; preview: ReactNode }) {
  const [open, setOpen] = useState(false);
  const touch = useRef(false);
  const id = useId();
  const common = {
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onPointerDown: (e: { pointerType: string }) => (touch.current = e.pointerType === "touch"),
    "aria-describedby": open ? id : undefined,
  };
  return (
    <span className="codex-ref" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {href ? (
        <a
          {...common}
          href={href}
          className="codex-xref"
          onClick={(e) => {
            if (touch.current && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {children}
        </a>
      ) : (
        <span {...common} className="codex-term" tabIndex={0} role="button" aria-label={label} onClick={() => setOpen((o) => !o)}>
          {children}
        </span>
      )}
      {open && (
        <span className="codex-preview" role="tooltip" id={id}>
          {preview}
        </span>
      )}
    </span>
  );
}

function SpellPreview({ s }: { s: SpellData }) {
  return (
    <>
      <b className="codex-preview-title">{s.name}</b>
      <i>{spellKind(s)}</i>
      <span className="codex-preview-facts">
        {s.castingTime} · {s.range} · {durationLabel(s)}
      </span>
      <span>{s.description.split(/(?<=\.)\s/)[0]}</span>
    </>
  );
}

function ItemPreview({ i }: { i: ArmoryItem }) {
  if (i.kind === "magic") {
    return (
      <>
        <b className="codex-preview-title">{i.name}</b>
        <i>{i.heading}</i>
        <span>{i.description.split(/(?<=\.)\s/)[0]}</span>
      </>
    );
  }
  return (
    <>
      <b className="codex-preview-title">{i.name}</b>
      <i>
        {itemKind(i)} · {costLabel(i.costGp)}
      </i>
      {i.kind === "weapon" && (
        <span className="codex-preview-facts">
          {i.damage.dice} {i.damage.type}
          {i.properties.length ? ` · ${i.properties.join(", ")}` : ""}
        </span>
      )}
    </>
  );
}

/** Rules text with its conditions and damage types explained, and spell names linked where `spells` is set. */
export function RulesText({ text, spells = false }: { text: string; spells?: boolean }) {
  const linkTo = useContext(LinkContext);
  return (
    <>
      {linkRules(text, { spells }).map((r, k) => {
        if (typeof r === "string") return <Fragment key={k}>{r}</Fragment>;
        if (r.kind === "spell") {
          const s = spellById.get(r.id)!;
          return (
            <Previewed key={k} href={linkTo("spells", r.id)} label={s.name} preview={<SpellPreview s={s} />}>
              {r.text}
            </Previewed>
          );
        }
        const what = r.kind === "condition" ? CONDITION_TEXT[r.id as keyof typeof CONDITION_TEXT] : DAMAGE_TYPE_TEXT[r.id as keyof typeof DAMAGE_TYPE_TEXT];
        return (
          <Previewed
            key={k}
            label={`${cap(r.id)}${r.kind === "damage" ? " damage" : ""}: ${what}`}
            preview={
              <>
                <b className="codex-preview-title">
                  {cap(r.id)}
                  {r.kind === "damage" ? " damage" : ""}
                </b>
                <span>{what}</span>
              </>
            }
          >
            {r.text}
          </Previewed>
        );
      })}
    </>
  );
}

/* ---------------- A chapter: filters, list and page (DAG-77) ---------------- */

export interface ChapterProps {
  /** The open entry; leave out to follow the location hash (a browser used on its own). */
  selectedId?: string | null | undefined;
  recent?: Recent[];
  /** The chapter's filters, when the host keeps them (the Codex keeps them in the link). */
  filters?: FilterState | undefined;
  onFilters?: ((next: FilterState) => void) | undefined;
  view?: ListView | undefined;
  onView?: ((v: ListView) => void) | undefined;
}

type Entry = MonsterData | SpellData | ArmoryItem | ClassData | RaceData;

/** The short line beside an entry in the list, leaving out what its group heading already says. */
function rowFacts(chapter: CodexChapter, sort: string, e: Entry): string {
  if (chapter === "classes") return sort === "hd" ? (CLASS_GUIDE[e.id]?.role ?? "") : entryFacts(chapter, e.id);
  if (chapter === "races") return sort === "speed" ? cap((e as RaceData).size) : entryFacts(chapter, e.id);
  if (chapter === "bestiary") {
    const m = e as MonsterData;
    return sort === "cr" ? `${cap(m.size)} ${m.type}` : sort === "type" ? `CR ${crLabel(m.cr)}` : `CR ${crLabel(m.cr)} · ${m.type}`;
  }
  if (chapter === "spells") {
    const s = e as SpellData;
    const marks = `${s.concentration ? " · C" : ""}${s.ritual ? " · R" : ""}`;
    return sort === "level" ? `${cap(s.school)}${marks}` : sort === "school" ? `${s.level === 0 ? "Cantrip" : ordinal(s.level)}${marks}` : `${s.level === 0 ? "Cantrip" : ordinal(s.level)} ${s.school}${marks}`;
  }
  const i = e as ArmoryItem;
  // A magic item says what its heading doesn't: its rarity under a type, its type under a rarity.
  if (i.kind === "magic") return sort === "kind" ? cap(rarityLabel(i)) : sort === "rarity" ? cap(i.type) : itemKind(i);
  return sort === "weight" ? `${i.weight} lb.` : costLabel(i.costGp);
}

function ChapterBrowser<T extends Entry>({
  spec, render, selectedId, recent = [], filters, onFilters, view, onView,
}: ChapterProps & { spec: ChapterSpec<T>; render: (id: string) => ReactNode }) {
  const chapter = spec.chapter;
  const selected = useChapterSelection(chapter, selectedId);
  // Used on its own, a chapter keeps its filters and view itself.
  const [ownFilters, setOwnFilters] = useState<FilterState>(() => emptyFilters(spec));
  const [ownView, setOwnView] = useState<ListView>("list");
  const state = filters ?? ownFilters;
  const setState = onFilters ?? setOwnFilters;
  const shown = view ?? ownView;
  const setShown = onView ?? setOwnView;
  const linkTo = useContext(LinkContext);
  const rowArt = listShowsArt(chapter);

  const items = useMemo(() => applyFilters(spec, state), [spec, state]);
  const group = groupOf(spec, state);
  const groups = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const it of items) {
      const k = group ? group(it) : "";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(it);
    }
    return [...map.entries()];
  }, [items, group]);

  const list = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLElement>(null);
  // The entry last opened: on a phone, Back returns to the list with its row in view.
  const last = useRef<string | null>(null);
  // A newly opened entry is shown from its top, and its row scrolled into the list's view.
  useEffect(() => {
    page.current?.scrollTo({ top: 0 });
    if (selected) last.current = selected;
    const id = selected ?? last.current;
    if (id) list.current?.querySelector(`[data-row="${CSS.escape(id)}"]`)?.scrollIntoView({ block: selected ? "nearest" : "center" });
  }, [selected]);
  const mine = recent.filter((r) => r.chapter === chapter).slice(0, 6);
  const c = CODEX_CHAPTERS.find((x) => x.id === chapter)!;
  const noun = c.noun;
  // One row is in the Tab order (the open entry, else the last one, else the first); arrow keys move between rows.
  const has = (id: string | null | undefined) => !!id && items.some((it) => it.id === id);
  const tabbable = has(selected) ? selected : has(last.current) ? last.current : items[0]?.id;
  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const rows = [...(list.current?.querySelectorAll<HTMLAnchorElement>("a[data-row]") ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    const across = shown === "cards" ? 2 : 1;
    const moves: Record<string, number> = { ArrowDown: across, ArrowUp: -across, PageDown: 10, PageUp: -10, Home: -rows.length, End: rows.length };
    if (shown === "cards") Object.assign(moves, { ArrowRight: 1, ArrowLeft: -1 });
    const move = moves[e.key];
    if (move === undefined) return;
    e.preventDefault();
    const next = rows[Math.max(0, Math.min(rows.length - 1, at + move))]!;
    rows[at]!.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
    next.scrollIntoView({ block: "nearest" });
  };

  return (
    // On a phone the list and the page are separate screens: the page, once an entry is open.
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      <section aria-label={`${c.name}: ${noun}`} className={`${selected ? "hidden md:flex" : "flex"} min-h-0 flex-col rounded-lg border border-slate-700 bg-slate-800`}>
        <FilterBar spec={spec} state={state} onChange={setState} count={items.length} noun={noun} view={shown} onView={setShown} />
        <div ref={list} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto" onKeyDown={onListKey}>
          {shown === "cards" ? (
            <div className="grid grid-cols-2 gap-2 p-2">
              {items.map((it) => (
                <a
                  key={it.id}
                  href={linkTo(chapter, it.id)}
                  data-row={it.id}
                  tabIndex={it.id === tabbable ? 0 : -1}
                  aria-current={selected === it.id ? "page" : undefined}
                  className={`flex flex-col gap-0.5 rounded-md border p-2 text-sm no-underline ${selected === it.id ? "border-ember-light bg-ember/20 text-stone-100" : "border-slate-700 bg-slate-900/40 text-stone-200 hover:border-slate-500"}`}
                >
                  <ArtSlot chapter={chapter} id={it.id} size="thumb" />
                  <span className="mt-1 font-semibold leading-tight">{it.name}</span>
                  {/* Cards have no group headings, so they say everything (the Armory's long kinds stay short). */}
                  <span className="text-[11px] text-stone-500">{chapter === "armory" && (it as ArmoryItem).kind !== "magic" ? rowFacts(chapter, state.sort, it) : entryFacts(chapter, it.id)}</span>
                </a>
              ))}
            </div>
          ) : (
            groups.map(([g, rows]) => (
              <div key={g}>
                {g && <div className="sticky top-0 z-10 bg-slate-800 px-3 py-1 font-display text-[11px] uppercase tracking-wider text-ember-light">{g}</div>}
                {rows.map((it) => (
                  <a
                    key={it.id}
                    href={linkTo(chapter, it.id)}
                    data-row={it.id}
                    tabIndex={it.id === tabbable ? 0 : -1}
                    aria-current={selected === it.id ? "page" : undefined}
                    className={`codex-tap flex items-center justify-between gap-3 px-3 py-1.5 text-sm no-underline ${selected === it.id ? "bg-ember/25 text-stone-100" : "text-stone-300 hover:bg-slate-700"}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {rowArt && <RowArt chapter={chapter} id={it.id} />}
                      <span className="min-w-0 truncate">{it.name}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-stone-500">{rowFacts(chapter, state.sort, it)}</span>
                  </a>
                ))}
              </div>
            ))
          )}
          {items.length === 0 && (
            <p className="p-3 text-sm text-stone-500">
              Nothing matches.{" "}
              <button className="codex-tap text-ember-light underline" onClick={() => setState(emptyFilters(spec))}>
                Clear filters
              </button>
            </p>
          )}
        </div>
      </section>
      <section
        ref={page}
        aria-label={selected ? (entry(chapter, selected)?.name ?? c.name) : c.name}
        className={`${selected ? "" : "hidden md:block"} codex-page-area scrollbar-thin min-h-0 overflow-y-auto`}
      >
        {selected && (
          <a href={linkTo(chapter)} className="codex-tap mb-2 inline-flex items-center gap-1 text-sm font-semibold text-ember-light no-underline md:hidden">
            <span aria-hidden="true">←</span> Back to the {c.name}
          </a>
        )}
        {selected ? render(selected) : <Landing chapter={chapter} count={spec.items.length} recent={mine} />}
      </section>
    </div>
  );
}

function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string | undefined }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      title={title}
      className={`codex-tap shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${on ? "border-ember bg-ember text-white" : "border-slate-600 text-stone-300 hover:border-ember-light"}`}
    >
      {children}
    </button>
  );
}

function FilterBar<T extends Entry>({
  spec, state, onChange, count, noun, view, onView,
}: { spec: ChapterSpec<T>; state: FilterState; onChange: (s: FilterState) => void; count: number; noun: string; view: ListView; onView: (v: ListView) => void }) {
  const [more, setMore] = useState(false);
  const panelId = useId();
  const pick = (key: string, value: string) => onChange({ ...state, picks: { ...state.picks, [key]: toggle(state.picks[key], value) } });
  const quick = spec.filters.filter((d) => d.quick);
  const rest = spec.filters.filter((d) => !d.quick);
  const n = activeCount(state);
  const crs = spec.cr;
  const crText = (lo: number, hi: number) => (lo === hi ? `CR ${crLabel(lo)}` : `CR ${crLabel(lo)}–${crLabel(hi)}`);

  // The chosen filters as removable chips.
  const active: { key: string; label: string; remove: () => void }[] = [];
  if (state.q.trim()) active.push({ key: "q", label: `“${state.q.trim()}”`, remove: () => onChange({ ...state, q: "" }) });
  if (state.cr) active.push({ key: "cr", label: crText(state.cr[0], state.cr[1]), remove: () => onChange({ ...state, cr: null }) });
  for (const def of spec.filters) {
    for (const v of state.picks[def.key] ?? []) {
      const label = def.options.find((o) => o.value === v)?.label ?? v;
      active.push({ key: `${def.key}-${v}`, label: def.options.length === 1 ? label : `${def.label}: ${label}`, remove: () => pick(def.key, v) });
    }
  }

  return (
    <div className="space-y-2 border-b border-slate-700 p-3">
      <input className="input codex-tap" value={state.q} onChange={(e) => onChange({ ...state, q: e.target.value })} placeholder={`Filter ${noun} by name`} aria-label={`Filter ${noun} by name`} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick filters">
        {crs?.bands.map((b) => {
          const on = !!state.cr && state.cr[0] === b.min && state.cr[1] === Math.max(...crs.values.filter((v) => v <= b.max));
          const hi = Math.max(...crs.values.filter((v) => v <= b.max));
          return (
            <Chip key={b.label} on={on} onClick={() => onChange({ ...state, cr: on ? null : [b.min, hi] })}>
              CR {b.label}
            </Chip>
          );
        })}
        {quick.flatMap((d) =>
          d.options.map((o) => (
            <Chip key={`${d.key}-${o.value}`} on={state.picks[d.key]?.includes(o.value) ?? false} onClick={() => pick(d.key, o.value)}>
              {o.label}
            </Chip>
          )),
        )}
      </div>
      <button type="button" className="codex-tap text-xs text-ember-light underline" aria-expanded={more} aria-controls={panelId} onClick={() => setMore((m) => !m)}>
        {more ? "Fewer filters" : "More filters"}
      </button>
      {more && (
        <div id={panelId} className="scrollbar-thin max-h-[40vh] space-y-2.5 overflow-y-auto rounded-md border border-slate-700 bg-slate-900/50 p-2.5">
          {crs && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300" role="group" aria-label="Challenge rating">
              <span className="w-full font-display text-[11px] uppercase tracking-wider text-stone-400">Challenge</span>
              <label className="flex items-center gap-1">
                From
                <select
                  className="codex-tap rounded border border-slate-600 bg-slate-800 px-1 py-0.5"
                  value={state.cr ? String(state.cr[0]) : "any"}
                  onChange={(e) => {
                    if (e.target.value === "any") return onChange({ ...state, cr: null });
                    const lo = Number(e.target.value);
                    onChange({ ...state, cr: [lo, Math.max(lo, state.cr?.[1] ?? lo)] });
                  }}
                >
                  <option value="any">Any</option>
                  {crs.values.map((v) => (
                    <option key={v} value={v}>
                      {crLabel(v)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                to
                <select
                  className="codex-tap rounded border border-slate-600 bg-slate-800 px-1 py-0.5"
                  value={state.cr ? String(state.cr[1]) : "any"}
                  onChange={(e) => {
                    if (e.target.value === "any") return onChange({ ...state, cr: null });
                    const hi = Number(e.target.value);
                    onChange({ ...state, cr: [Math.min(hi, state.cr?.[0] ?? hi), hi] });
                  }}
                >
                  <option value="any">Any</option>
                  {crs.values.map((v) => (
                    <option key={v} value={v}>
                      {crLabel(v)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {rest.map((d) => (
            <div key={d.key} role="group" aria-label={d.label}>
              <div className="mb-1 font-display text-[11px] uppercase tracking-wider text-stone-400">{d.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {d.options.map((o) => (
                  <Chip key={o.value} on={state.picks[d.key]?.includes(o.value) ?? false} onClick={() => pick(d.key, o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {active.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Chosen filters">
          {active.map((a) => (
            <button key={a.key} type="button" onClick={a.remove} className="codex-tap rounded-full bg-slate-700 px-2 py-0.5 text-[11px] text-stone-200 hover:bg-slate-600" aria-label={`Remove ${a.label}`}>
              {a.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
        <span aria-live="polite">
          {count} {count === 1 ? noun.replace(/s$/, "") : noun}
        </span>
        {n > 0 && (
          <button type="button" className="codex-tap text-ember-light underline" onClick={() => onChange({ ...state, q: "", picks: {}, cr: null })}>
            Clear filters
          </button>
        )}
        <span className="flex-1" />
        <label className="flex items-center gap-1">
          Sort
          <select className="codex-tap rounded border border-slate-600 bg-slate-800 px-1 py-0.5 text-stone-200" value={state.sort} onChange={(e) => onChange({ ...state, sort: e.target.value })}>
            {spec.sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex overflow-hidden rounded border border-slate-600" role="group" aria-label="View">
          {(["list", "cards"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => onView(v)} className={`codex-tap px-2 py-0.5 ${view === v ? "bg-slate-600 text-stone-100" : "text-stone-400"}`}>
              {v === "list" ? "List" : "Cards"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Pages: shared parts (DAG-78) ---------------- */

/** An entry's page with its notes: beside it on wide screens, under it on narrow ones. */
function Spread({ page, notes }: { page: ReactNode; notes: ReactNode }) {
  return (
    <div className="codex-spread">
      {page}
      <aside className="codex-notes text-sm text-stone-300" aria-label="Notes">
        {notes}
      </aside>
    </div>
  );
}

function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 font-display text-[11px] uppercase tracking-wider text-ember-light">{title}</h3>
      {children}
    </section>
  );
}

/** Entries named in a note, each with its short facts, and how many more there are. */
function NoteLinks<T extends { id: string; name: string }>({ chapter, entries, facts, limit = 6 }: { chapter: CodexChapter; entries: readonly T[]; facts: (e: T) => string; limit?: number }) {
  const linkTo = useContext(LinkContext);
  return (
    <ul className="flex flex-col gap-1">
      {entries.slice(0, limit).map((e) => (
        <li key={e.id} className="flex items-baseline justify-between gap-3">
          <a className="codex-tap inline-flex min-w-0 items-center text-ember-light underline-offset-2 hover:underline" href={linkTo(chapter, e.id)}>
            {e.name}
          </a>
          <span className="shrink-0 text-[11px] text-stone-500">{facts(e)}</span>
        </li>
      ))}
      {entries.length > limit && <li className="text-[11px] text-stone-500">and {entries.length - limit} more</li>}
    </ul>
  );
}

/** A tag-like link, for a place or a class. */
function TagLink({ href, title, children }: { href: string; title?: string; children: ReactNode }) {
  return (
    <a href={href} title={title} className="codex-tap inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5 text-xs text-stone-200 no-underline hover:border-ember-light">
      {children}
    </a>
  );
}


/**
 * Where an entry's illustration goes (DAG-70): its picture from the art manifest, loaded when it
 * comes into view; or a seal with a stand-in silhouette (a creature type, a class emblem); or a seal
 * with its initials until the art lands (DAG-71 to DAG-74).
 */
function ArtSlot({ chapter, id, size, name: shown }: { chapter: CodexChapter; id: string; size: "page" | "thumb"; name?: string }) {
  const e = entry(chapter, id);
  const name = shown ?? e?.name ?? id;
  const type = chapter === "bestiary" ? (e as MonsterData | undefined)?.type : undefined;
  const hint = { name, creatureType: silhouetteType(type) };
  // A class's page shows a hero of that class (DAG-74) when its picture is there; otherwise, and on
  // its thumbnail, the emblem or its silhouette (the single-file build carries no pictures at all).
  const hero = chapter === "classes" && size === "page" ? artFor("class-art", id, size, hint) : null;
  const art = isArt(hero) ? hero : artFor(ART_KIND[chapter], id, size, hint);
  // A magic item's mark (DAG-72): a pip in its rarity's colour. The rarity is written beside it.
  const pip = <RarityPip chapter={chapter} id={id} />;
  if (isArt(art)) {
    return size === "page" ? (
      <div className="codex-art codex-art-page has-art">
        <img src={art.src} alt={art.alt} loading="lazy" decoding="async" />
        {pip}
        {art.ai && <span className="codex-art-caption">AI-generated illustration</span>}
      </div>
    ) : (
      <span className="codex-art codex-art-thumb has-art" aria-hidden="true">
        <img src={art.src} alt="" loading="lazy" decoding="async" />
        {pip}
      </span>
    );
  }
  const seal = art ? (
    <span className="codex-seal codex-seal-icon" aria-hidden="true">
      <img src={art.src} alt="" />
    </span>
  ) : (
    <span className="codex-seal" aria-hidden="true">
      {monogram(name)}
    </span>
  );
  // Without art, a page gets a slim header, not a large empty frame (DAG-75): the seal and a note.
  return size === "page" ? (
    <div className="codex-art codex-art-slim" role="img" aria-label={`Illustration of ${name}, to come`}>
      {seal}
      {pip}
      <span className="codex-art-slim-note" aria-hidden="true">
        Illustration to come
      </span>
    </div>
  ) : (
    <span className="codex-art codex-art-thumb" aria-hidden="true">
      {seal}
      {pip}
    </span>
  );
}

/**
 * A list row's picture (DAG-80): the entry's thumbnail, or its stand-in silhouette, or an empty
 * space so the names stay in line. Decorative: the name beside it says what it is.
 */
function RowArt({ chapter, id }: { chapter: CodexChapter; id: string }) {
  const e = entry(chapter, id);
  const type = chapter === "bestiary" ? (e as MonsterData | undefined)?.type : undefined;
  const art = artFor(ART_KIND[chapter], id, "thumb", { creatureType: silhouetteType(type) });
  // The pip sits outside the round crop, so it isn't clipped.
  return (
    <span className="codex-row-art-wrap" aria-hidden="true">
      <span className={`codex-row-art ${art && !isArt(art) ? "is-icon" : ""}`}>{art && <img src={art.src} alt="" loading="lazy" decoding="async" />}</span>
      <RarityPip chapter={chapter} id={id} />
    </span>
  );
}

/**
 * A school of magic's mark (DAG-73), beside the school's name: decorative, since the name says it.
 * Nothing when the school has no mark (the single-file build carries no pictures).
 */
function SchoolMark({ school }: { school: string }) {
  const art = artFor("school", school, "thumb");
  return isArt(art) ? <img className="codex-school-mark" src={art.src} alt="" aria-hidden="true" loading="lazy" decoding="async" /> : null;
}

/**
 * A magic item's mark (DAG-72): a pip in its rarity's colour, on its picture wherever it shows (page,
 * card or list row), so a magic item reads as one even at 28 px. Decorative: the rarity is written
 * beside it. Nothing for anything but a magic item.
 */
function RarityPip({ chapter, id }: { chapter: CodexChapter; id: string }) {
  const e = chapter === "armory" ? (entry(chapter, id) as ArmoryItem | undefined) : undefined;
  if (e?.kind !== "magic") return null;
  return <span className="codex-rarity" style={{ background: RARITY_COLOURS[e.rarity] ?? RARITY_COLOURS.varies }} title={cap(e.rarity)} aria-hidden="true" />;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="codex-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Rules text in its paragraphs and lists, with its links; `lead` starts the first paragraph ("Multiattack."). */
function RulesBlocks({ text, spells = false, lead }: { text: string; spells?: boolean; lead?: ReactNode }) {
  const blocks = rulesBlocks(text, spells);
  const leadAlone = lead && blocks[0]?.kind !== "p";
  return (
    <>
      {leadAlone && <p className="my-1.5">{lead}</p>}
      {blocks.map((b, k) =>
        b.kind === "table" ? (
          <div key={k} className="codex-table-wrap" tabIndex={0} role="region" aria-label={`${b.caption ?? "Rules"} table`}>
            <table className="codex-table">
              {b.caption && <caption>{b.caption}</caption>}
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, j) => (
                  <tr key={j}>
                    {row.map((c, n) => (
                      <td key={n}>
                        <RulesText text={c} spells={spells} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : b.kind === "p" ? (
          <p key={k} className="my-1.5">
            {k === 0 && lead ? <>{lead} </> : null}
            {b.lead && (
              <>
                <b>
                  <i>{b.lead}</i>
                </b>{" "}
              </>
            )}
            <RulesText text={b.text} spells={spells} />
          </p>
        ) : (
          <ul key={k} className="codex-list">
            {b.items.map((it, j) => (
              <li key={j}>
                {it.label && <i>{it.label}: </i>}
                <RulesText text={it.text} spells={spells} />
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

const DEV_KEY = "dnd-codex:dev";
/** Engine ids and effects, for developers: shown only when localStorage "dnd-codex:dev" is "1". */
function DevLine({ children }: { children: ReactNode }) {
  const [on] = useState(() => {
    try {
      return localStorage.getItem(DEV_KEY) === "1";
    } catch {
      return false;
    }
  });
  return on ? <p className="mt-3 text-[11px] text-ink-soft">{children}</p> : null;
}

const filtered = <T extends { id: string; name: string }>(spec: ChapterSpec<T>, picks: Record<string, string[]>) => encodeFilters(spec, { ...emptyFilters(spec), picks });
const facts = {
  monster: (m: MonsterData) => `CR ${crLabel(m.cr)}`,
  spell: (s: SpellData) => (s.level === 0 ? "Cantrip" : ordinal(s.level)),
  item: (i: ArmoryItem) => (i.kind === "magic" ? cap(rarityLabel(i)) : costLabel(i.costGp)),
};

/* ---------------- Landing: a way into each chapter ---------------- */

function Landing({ chapter, count, recent }: { chapter: CodexChapter; count: number; recent: Recent[] }) {
  const linkTo = useContext(LinkContext);
  const c = CODEX_CHAPTERS.find((x) => x.id === chapter)!;
  const featured = FEATURED[chapter].filter((id) => entry(chapter, id));
  return (
    <div className="mx-auto max-w-4xl px-1 pb-6 text-stone-300">
      <h2 className="font-display text-3xl text-stone-100">{c.name}</h2>
      <p className="mb-6 mt-1 max-w-2xl text-stone-400">
        {count} {c.noun} from the SRD 5.1. Pick one from the list, narrow the list with its filters, or press{" "}
        <kbd className="rounded border border-slate-600 px-1.5 text-[11px]">/</kbd> to search every chapter.
      </p>
      <h3 className="mb-2 font-display text-[11px] uppercase tracking-wider text-ember-light">Good places to start</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
        {featured.map((id) => (
          <a key={id} href={linkTo(chapter, id)} className="flex flex-col gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2 no-underline hover:border-ember-light">
            <ArtSlot chapter={chapter} id={id} size="thumb" />
            <span className="font-semibold leading-tight text-stone-100">{nameOf({ chapter, id })}</span>
            <span className="text-[11px] text-stone-500">{entryFacts(chapter, id)}</span>
          </a>
        ))}
      </div>
      {recent.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-display text-[11px] uppercase tracking-wider text-ember-light">Recently opened</h3>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((r) => (
              <TagLink key={r.id} href={linkTo(r.chapter, r.id)}>
                {nameOf(r)}
              </TagLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Bestiary ---------------- */

export function Bestiary(props: ChapterProps) {
  return <ChapterBrowser spec={BESTIARY} render={(id) => <MonsterEntry m={monsterById.get(id)!} />} {...props} />;
}

function MonsterEntry({ m }: { m: MonsterData }) {
  const homes = HABITATS.get(m.id) ?? [];
  return (
    <Spread
      page={<StatBlock m={m} />}
      notes={
        <>
          <Note title="Where it lives">
            {homes.length ? (
              <>
                <p className="mb-1.5">Usually found in:</p>
                <div className="flex flex-wrap gap-1.5">
                  {homes.map((h) => (
                    <TagLink key={h} href={codexHref("bestiary", m.id, filtered(BESTIARY, { home: [h] }))} title={`Every creature found in ${habitatLabel(h).toLowerCase()}`}>
                      {habitatLabel(h)}
                    </TagLink>
                  ))}
                </div>
              </>
            ) : (
              <p>No usual habitat: it appears when the story calls for it.</p>
            )}
            <p className="mt-2 text-stone-400">Initiative {sign(abilityMod(m.abilities.dex))}</p>
          </Note>
          <Note title="Similar creatures">
            <NoteLinks chapter="bestiary" entries={similarMonsters(m)} facts={facts.monster} />
          </Note>
        </>
      }
    />
  );
}

/** A creature's stat block, in the rulebook's order. `art` leaves out the illustration (for small panels). */
export function StatBlock({ m, art = true }: { m: MonsterData; art?: boolean }) {
  const line = (label: string, value: string) =>
    value ? (
      <p className="codex-line">
        <b>{label}</b> {value}
      </p>
    ) : null;
  const linkTo = useContext(LinkContext);
  const actionName = (name: string) => {
    const itemId = itemForAction(name);
    const item = itemId ? itemById.get(itemId) : undefined;
    return item ? (
      <Previewed href={linkTo("armory", item.id)} label={item.name} preview={<ItemPreview i={item} />}>
        {name}
      </Previewed>
    ) : (
      name
    );
  };
  const feature = (section: string, f: { name: string; description: string }, name: ReactNode = f.name) => (
    <div key={`${section}.${f.name}`} className="codex-block">
      <RulesBlocks
        text={f.description}
        spells={isSpellcasting(f.name)}
        lead={
          <b>
            <i>{name}.</i>
          </b>
        }
      />
    </div>
  );
  return (
    <article className="statblock">
      <header>
        <h2 className="statblock-title">{m.name}</h2>
        <p className="italic">
          {cap(m.size)} {m.type}, {m.alignment}
        </p>
      </header>
      {art && <ArtSlot chapter="bestiary" id={m.id} size="page" />}
      <dl className="codex-glance" aria-label="At a glance">
        <Fact label="Armor Class">{m.ac}</Fact>
        <Fact label="Hit Points">
          {m.hp.average} <small>({m.hp.dice})</small>
        </Fact>
        <Fact label="Speed">{speedLabel(m.speed)}</Fact>
        <Fact label="Challenge">
          {crLabel(m.cr)} <small>({m.xp.toLocaleString()} XP)</small>
        </Fact>
      </dl>
      <hr className="statblock-rule" />
      <table className="codex-abilities">
        <caption className="sr-only">Ability scores, with modifiers</caption>
        <thead>
          <tr>
            {ABILITIES.map((a) => (
              <th key={a} scope="col">
                <abbr title={ABILITY_NAMES[a]}>{a.toUpperCase()}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {ABILITIES.map((a) => (
              <td key={a}>
                {m.abilities[a]} <span>({sign(abilityMod(m.abilities[a]))})</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <hr className="statblock-rule" />
      {line(
        "Saving Throws",
        Object.entries(m.saves)
          .map(([k, v]) => `${cap(k)} ${sign(v)}`)
          .join(", "),
      )}
      {line(
        "Skills",
        Object.entries(m.skills)
          .map(([k, v]) => `${cap(k.replace(/-/g, " "))} ${sign(v)}`)
          .join(", "),
      )}
      {m.vulnerabilities.length > 0 && <TermLine label="Damage Vulnerabilities" terms={m.vulnerabilities} damage />}
      {m.resistances.length > 0 && <TermLine label="Damage Resistances" terms={m.resistances} damage />}
      {m.immunities.length > 0 && <TermLine label="Damage Immunities" terms={m.immunities} damage />}
      {m.conditionImmunities.length > 0 && <TermLine label="Condition Immunities" terms={m.conditionImmunities} />}
      {line("Senses", sensesLabel(m.senses))}
      {line("Languages", m.languages || "—")}
      {line("Proficiency Bonus", sign(proficiencyBonus(m.cr)))}
      {(m.traits.length > 0 || m.actions.length > 0) && <hr className="statblock-rule" />}
      {m.traits.map((t) => feature("trait", t))}
      {m.actions.length > 0 && <h3 className="statblock-section">Actions</h3>}
      {m.actions.map((a) => feature("action", a, actionName(a.name)))}
      {m.reactions && m.reactions.length > 0 && <h3 className="statblock-section">Reactions</h3>}
      {m.reactions?.map((r) => feature("reaction", r))}
      {m.legendary && (
        <>
          <h3 className="statblock-section">Legendary Actions</h3>
          <p className="my-1.5">{m.legendary.description}</p>
          {m.legendary.actions.map((a) => feature("legendary", a))}
        </>
      )}
      <DevLine>
        Engine id: <code>{m.id}</code>
      </DevLine>
    </article>
  );
}

/** A stat block line of damage types or conditions, each with its reminder. */
function TermLine({ label, terms, damage = false }: { label: string; terms: readonly string[]; damage?: boolean }) {
  return (
    <p className="codex-line">
      <b>{label}</b>{" "}
      {terms.map((t, k) => {
        const what = damage ? DAMAGE_TYPE_TEXT[t as keyof typeof DAMAGE_TYPE_TEXT] : CONDITION_TEXT[t as keyof typeof CONDITION_TEXT];
        return (
          <Fragment key={t}>
            {k > 0 && ", "}
            {what ? (
              <Previewed label={`${cap(t)}: ${what}`} preview={<><b className="codex-preview-title">{cap(t)}{damage ? " damage" : ""}</b><span>{what}</span></>}>
                {t}
              </Previewed>
            ) : (
              t
            )}
          </Fragment>
        );
      })}
    </p>
  );
}

/* ---------------- Spellbook ---------------- */

export function Spellbook(props: ChapterProps) {
  return <ChapterBrowser spec={SPELLBOOK} render={(id) => <SpellEntry s={spellById.get(id)!} />} {...props} />;
}

function SpellEntry({ s }: { s: SpellData }) {
  const casters = castersOf(s.id);
  return (
    <Spread
      page={<SpellPage s={s} />}
      notes={
        <>
          <Note title="Creatures that cast it">
            {casters.length ? <NoteLinks chapter="bestiary" entries={casters} facts={facts.monster} /> : <p className="text-stone-400">No creature in the Bestiary casts it.</p>}
          </Note>
          <Note title={s.level === 0 ? `Other ${s.school} cantrips` : `Other ${ordinal(s.level)}-level ${s.school}`}>
            <NoteLinks chapter="spells" entries={relatedSpells(s)} facts={facts.spell} />
          </Note>
        </>
      }
    />
  );
}

export function SpellPage({ s, art = true }: { s: SpellData; art?: boolean }) {
  const letters = [s.components.v && "V", s.components.s && "S", s.components.m && "M"].filter(Boolean).join(", ");
  return (
    <article className="statblock">
      <header>
        <h2 className="statblock-title">{s.name}</h2>
        <p className="codex-school-line italic">
          <SchoolMark school={s.school} />
          {spellKind(s)}
          {s.ritual ? " (ritual)" : ""}
        </p>
        {(s.concentration || s.ritual) && (
          <div className="codex-badges">
            {s.concentration && <span className="codex-badge">Concentration</span>}
            {s.ritual && <span className="codex-badge">Ritual</span>}
          </div>
        )}
      </header>
      {/* The spell's icon when DAG-73 brings it; the same slot as the other chapters. */}
      {art && <ArtSlot chapter="spells" id={s.id} size="page" />}
      <dl className="codex-glance" aria-label="At a glance">
        <Fact label="Casting Time">{s.castingTime}</Fact>
        <Fact label="Range">
          {s.range}
          {s.area ? <small> ({s.area.size}-foot {s.area.shape})</small> : null}
        </Fact>
        <Fact label="Components">
          {letters}
          {s.components.m ? <small className="block">{s.components.m}</small> : null}
        </Fact>
        <Fact label="Duration">{durationLabel(s)}</Fact>
      </dl>
      <hr className="statblock-rule" />
      <RulesBlocks text={s.description} />
      {s.higherLevel && (
        <RulesBlocks
          text={s.higherLevel}
          lead={
            <b>
              <i>At Higher Levels.</i>
            </b>
          }
        />
      )}
      <hr className="statblock-rule" />
      <p className="codex-line">
        <b>Classes</b>{" "}
        {s.classes.map((c, k) => (
          <Fragment key={c}>
            {k > 0 && ", "}
            <a className="codex-xref" href={codexHref("spells", s.id, filtered(SPELLBOOK, { class: [c] }))} title={`Every ${cap(c)} spell`}>
              {cap(c)}
            </a>
          </Fragment>
        ))}
      </p>
      <DevLine>
        Engine id: <code>{s.id}</code> · engine effect: {describeEffect(s)}
      </DevLine>
    </article>
  );
}

function describeEffect(s: SpellData): string {
  const e = s.effect;
  switch (e.type) {
    case "attack":
      return `spell attack, ${e.damage} ${e.damageType}${e.upcast ? ` (+${e.upcast}/slot)` : ""}`;
    case "save":
      return `${e.save.toUpperCase()} save, ${e.damage} ${e.damageType}${e.halfOnSave ? ", half on save" : ""}${e.upcast ? ` (+${e.upcast}/slot)` : ""}`;
    case "auto-damage":
      return `${e.count}× ${e.damage} ${e.damageType}, auto-hit`;
    case "heal":
      return `heals ${e.dice} + modifier${e.upcast ? ` (+${e.upcast}/slot)` : ""}`;
    case "buff":
      return "tracked as a described effect (DM adjudicates)";
    case "narrative":
      return "narrative only (DM adjudicates)";
  }
}

/* ---------------- Armory ---------------- */

export function Armory(props: ChapterProps) {
  return <ChapterBrowser spec={ARMORY} render={(id) => <ItemEntry i={itemById.get(id)!} />} {...props} />;
}

function ItemEntry({ i }: { i: ArmoryItem }) {
  const wielders = wieldersOf(i.id);
  return (
    <Spread
      page={<ItemPage i={i} />}
      notes={
        <>
          {wielders.length > 0 && (
            <Note title="Creatures that use it">
              <NoteLinks chapter="bestiary" entries={wielders} facts={facts.monster} />
            </Note>
          )}
          <Note title="Similar items">
            <NoteLinks chapter="armory" entries={similarItems(i)} facts={facts.item} />
          </Note>
        </>
      }
    />
  );
}

/** What a weapon property adds to its name: a thrown weapon's range, the two-handed damage. */
function propertyDetail(i: Extract<ItemData, { kind: "weapon" }>, p: string): string {
  if ((p === "thrown" || p === "ammunition") && i.range) return ` (range ${i.range.normal}/${i.range.long})`;
  if (p === "versatile" && i.versatileDamage) return ` (${i.versatileDamage.dice})`;
  return "";
}

/** An item's page. `art` leaves out the illustration (for small panels). */
export function ItemPage({ i, art = true }: { i: ArmoryItem; art?: boolean }) {
  if (i.kind === "magic") return <MagicItemPage i={i} art={art} />;
  const damage = (dice: string, type: keyof typeof DAMAGE_TYPE_TEXT) => (
    <>
      {dice}{" "}
      <Previewed label={`${cap(type)} damage: ${DAMAGE_TYPE_TEXT[type]}`} preview={<><b className="codex-preview-title">{cap(type)} damage</b><span>{DAMAGE_TYPE_TEXT[type]}</span></>}>
        {type}
      </Previewed>
    </>
  );
  return (
    <article className="statblock">
      <header>
        <h2 className="statblock-title">{i.name}</h2>
        <p className="italic">{itemKind(i)}</p>
      </header>
      {art && <ArtSlot chapter="armory" id={i.id} size="page" />}
      <dl className="codex-glance" aria-label="At a glance">
        <Fact label="Cost">{costLabel(i.costGp)}</Fact>
        <Fact label="Weight">{i.weight ? `${i.weight} lb.` : "—"}</Fact>
        {i.kind === "weapon" && (
          <Fact label="Damage">
            {damage(i.damage.dice, i.damage.type)}
            {i.versatileDamage ? <small> ({i.versatileDamage.dice} two-handed)</small> : null}
          </Fact>
        )}
        {i.kind === "weapon" && i.range && (
          <Fact label="Range">
            {i.range.normal}/{i.range.long} ft.
          </Fact>
        )}
        {i.kind === "armor" && (
          <Fact label="Armor Class">
            {i.category === "shield" ? `+${i.baseAc}` : i.baseAc}
            {i.category !== "shield" && i.dexBonus ? <small> + Dex{i.maxDexBonus ? ` (max ${i.maxDexBonus})` : ""}</small> : null}
          </Fact>
        )}
        {i.kind === "armor" && i.strMin ? <Fact label="Strength">{i.strMin}</Fact> : null}
        {i.kind === "armor" && <Fact label="Stealth">{i.stealthDisadvantage ? "Disadvantage" : "—"}</Fact>}
      </dl>
      {i.kind === "weapon" && i.properties.length > 0 && (
        <>
          <hr className="statblock-rule" />
          <h3 className="statblock-section">Properties</h3>
          <dl className="codex-props">
            {i.properties.map((p) => (
              <div key={p}>
                <dt>
                  {cap(p)}
                  {propertyDetail(i, p)}.
                </dt>
                <dd>{p === "special" ? (WEAPON_SPECIAL_TEXT[i.id] ?? WEAPON_PROPERTY_TEXT[p]) : WEAPON_PROPERTY_TEXT[p]}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {i.kind === "armor" && (
        <>
          <hr className="statblock-rule" />
          <p className="my-1.5">{armorNote(i)}</p>
        </>
      )}
      {i.kind === "gear" && (i.effect?.type === "heal" || i.description) && (
        <>
          <hr className="statblock-rule" />
          {i.effect?.type === "heal" && (
            <p className="codex-line">
              <b>Effect</b> drinking it restores {i.effect.dice} hit points.
            </p>
          )}
          {i.description && <RulesBlocks text={i.description} />}
        </>
      )}
      <DevLine>
        Engine id: <code>{i.id}</code>
      </DevLine>
    </article>
  );
}

/** A magic item's page (DAG-83): the SRD's heading line, rarity and attunement at a glance, and its text. */
function MagicItemPage({ i, art }: { i: MagicItemData; art: boolean }) {
  const forms = i.rarities?.length ? `${cap(i.rarities[0]!)} to ${i.rarities.at(-1)}` : undefined;
  return (
    <article className="statblock">
      <header>
        <h2 className="statblock-title">{i.name}</h2>
        <p className="italic">{i.heading}</p>
      </header>
      {art && <ArtSlot chapter="armory" id={i.id} size="page" />}
      <dl className="codex-glance" aria-label="At a glance">
        <Fact label="Type">{cap(i.type)}</Fact>
        <Fact label="Rarity">{i.rarity === "varies" ? (forms ?? "Varies") : cap(i.rarity)}</Fact>
        <Fact label="Attunement">{i.attunement === true ? "Required" : i.attunement ? cap(i.attunement) : "Not needed"}</Fact>
      </dl>
      <hr className="statblock-rule" />
      <RulesBlocks text={i.description} />
      <DevLine>
        Id: <code>{i.id}</code> (reference only: the engine doesn&apos;t use magic items yet)
      </DevLine>
    </article>
  );
}

/** How a piece of armor works, in plain words. */
function armorNote(i: Extract<ItemData, { kind: "armor" }>): string {
  const parts: string[] = [];
  if (i.category === "shield") parts.push(`Carried in one hand, it adds ${i.baseAc} to your Armor Class.`);
  else if (!i.dexBonus) parts.push(`Your Armor Class is ${i.baseAc}, whatever your Dexterity.`);
  else if (i.maxDexBonus) parts.push(`Your Armor Class is ${i.baseAc} plus your Dexterity modifier, counting at most +${i.maxDexBonus}.`);
  else parts.push(`Your Armor Class is ${i.baseAc} plus your Dexterity modifier.`);
  if (i.strMin) parts.push(`Wearers with less than Strength ${i.strMin} lose 10 feet of speed.`);
  if (i.stealthDisadvantage) parts.push("It's noisy: Stealth checks have disadvantage.");
  return parts.join(" ");
}

/* ---------------- Classes and Races (DAG-84) ---------------- */

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six"];
const PROFICIENCY_WORDS: Record<string, string> = {
  "all-armor": "all armor",
  "light-armor": "light armor",
  "medium-armor": "medium armor",
  shields: "shields",
  "simple-weapons": "simple weapons",
  "martial-weapons": "martial weapons",
  "hand-crossbows": "hand crossbows",
  "crossbows-light": "light crossbows",
};
const proficiencyWord = (id: string) => PROFICIENCY_WORDS[id] ?? itemById.get(id)?.name.toLowerCase() ?? id.replace(/-/g, " ");
/** A list of proficiencies as a sentence: "Light armor, medium armor, shields". */
const proficiencyList = (ids: readonly string[]) => (ids.length ? cap(ids.map(proficiencyWord).join(", ")) : "None");
const skillName = (s: string) => cap(s.replace(/-/g, " "));
const abilityList = (abilities: readonly string[]) => abilities.map((a) => ABILITY_NAMES[a as keyof typeof ABILITY_NAMES] ?? a).join(", ");
/** "4th, 8th and 12th level". */
const levelList = (levels: readonly number[]) => {
  const words = levels.map(ordinal);
  return `${words.length > 1 ? `${words.slice(0, -1).join(", ")} and ${words.at(-1)}` : words[0]} level`;
};

const CHAPTER_BROWSERS: Record<CodexChapter, (props: ChapterProps) => ReactNode> = {
  bestiary: Bestiary,
  spells: Spellbook,
  armory: Armory,
  classes: Classes,
  races: Races,
};

export function Classes(props: ChapterProps) {
  return <ChapterBrowser spec={CLASS_SPEC} render={(id) => <ClassEntry c={classById.get(id)!} />} {...props} />;
}

export function Races(props: ChapterProps) {
  return <ChapterBrowser spec={RACE_SPEC} render={(id) => <RaceEntry r={raceById.get(id)!} />} {...props} />;
}

/** The game's quick-start heroes for a class or a race, with a link to the other half of each. */
function HeroNotes({ heroes, link }: { heroes: typeof PREMADE_HEROES; link: "class" | "race" }) {
  const linkTo = useContext(LinkContext);
  if (!heroes.length) return <p className="text-stone-400">None yet.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {heroes.map((h) => {
        const other = link === "class" ? classById.get(h.classId) : raceById.get(h.raceId);
        // Their own portrait (DAG-113), where the build carries pictures.
        const face = h.portraitArt ? artFor("portrait", h.portraitArt, "thumb") : null;
        return (
          <li key={h.id} className="flow-root">
            {isArt(face) && <img className="float-left mr-2 h-10 w-10 rounded-full border border-[rgba(201,164,106,0.6)] object-cover object-top" src={face.src} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
            <span className="text-stone-200">{h.name}</span>,{" "}
            {other ? (
              <a className="codex-tap inline-flex items-center text-ember-light underline-offset-2 hover:underline" href={linkTo(link === "class" ? "classes" : "races", other.id)}>
                {link === "class" ? other.name.toLowerCase() : other.name}
              </a>
            ) : null}
            <span className="block text-[11px] text-stone-500">{h.pitch}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ClassEntry({ c }: { c: ClassData }) {
  const fits = RACE_ENTRIES.filter((r) => c.primaryAbilities.some((a) => raceRaises(r, a)));
  const raises = (r: RaceData) =>
    c.primaryAbilities
      .filter((a) => raceRaises(r, a))
      .map((a) => `${ABILITY_NAMES[a]}${raceRaises(r, a) === "choice" ? " (your choice)" : ""}`)
      .join(", ");
  const spells = SPELLS.filter((s) => s.classes.includes(c.id)).length;
  return (
    <Spread
      page={<ClassPage c={c} />}
      notes={
        <>
          <Note title="For new players">
            <p>{COMPLEXITY_LABELS[CLASS_GUIDE[c.id]?.complexity ?? "some-choices"]}</p>
          </Note>
          {spells > 0 && (
            <Note title="Spell list">
              <TagLink href={codexHref("spells", null, filtered(SPELLBOOK, { class: [c.id] }))}>
                {spells} {c.name.toLowerCase()} spells
              </TagLink>
            </Note>
          )}
          <Note title="Quick start heroes of this class">
            <HeroNotes heroes={PREMADE_HEROES.filter((h) => h.classId === c.id)} link="race" />
          </Note>
          {fits.length > 0 && (
            <Note title="Races that raise its main abilities">
              <NoteLinks chapter="races" entries={fits} facts={raises} />
            </Note>
          )}
        </>
      }
    />
  );
}

/** A class's features, each once: a feature gained again at later levels with the same text is listed with all its levels. */
function featureGroups(c: ClassData): { name: string; levels: number[]; description: string }[] {
  const base = (name: string) => name.replace(/\s*\([^)]*\)$/, "");
  const texts = new Map<string, Set<string>>();
  for (const f of c.features) texts.set(base(f.name), (texts.get(base(f.name)) ?? new Set()).add(f.description));
  const groups: { key: string; name: string; levels: number[]; description: string }[] = [];
  for (const f of c.features) {
    // A name with one text everywhere is listed once; one whose text changes keeps each version.
    const shared = texts.get(base(f.name))!.size === 1;
    const key = shared ? base(f.name) : `${f.name}\u0000${f.description}`;
    const g = groups.find((x) => x.key === key);
    if (g) g.levels.push(f.level);
    else groups.push({ key, name: shared ? base(f.name) : f.name, levels: [f.level], description: f.description });
  }
  return groups;
}

/** The class table, level by level: proficiency bonus, features, the class's own columns and its spellcasting. */
function ClassTable({ c }: { c: ClassData }) {
  const levels = Array.from({ length: 20 }, (_, k) => k + 1);
  const sc = c.spellcasting;
  const cantrips = sc && Object.values(sc.cantripsKnown).some((n) => n > 0);
  const known = sc?.spellsKnown;
  const slotLevels = sc && !sc.pact ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((s) => levels.some((l) => (sc.slots[l]?.[s] ?? 0) > 0)) : [];
  const pact = (l: number) => Object.entries(sc?.slots[l] ?? {}).find(([, n]) => n > 0);
  return (
    <div className="codex-table-wrap" tabIndex={0} role="region" aria-label={`The ${c.name} table`}>
      <table className="codex-table codex-class-table">
        <caption>The {c.name}</caption>
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col">Proficiency Bonus</th>
            <th scope="col">Features</th>
            {c.columns?.map((col) => (
              <th key={col.label} scope="col">
                {col.label}
              </th>
            ))}
            {cantrips && <th scope="col">Cantrips Known</th>}
            {known && <th scope="col">Spells Known</th>}
            {sc?.pact && (
              <>
                <th scope="col">Spell Slots</th>
                <th scope="col">Slot Level</th>
              </>
            )}
            {slotLevels.map((s) => (
              <th key={s} scope="col">
                <abbr title={`${ordinal(s)}-level spell slots`}>{ordinal(s)}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {levels.map((l) => (
            <tr key={l}>
              <td>{ordinal(l)}</td>
              <td>+{Math.ceil(l / 4) + 1}</td>
              <td>{c.features.filter((f) => f.level === l).map((f) => f.name).join(", ") || "—"}</td>
              {c.columns?.map((col) => <td key={col.label}>{col.values[l] ?? "—"}</td>)}
              {cantrips && <td>{sc!.cantripsKnown[l] || "—"}</td>}
              {known && <td>{known[l] || "—"}</td>}
              {sc?.pact && (
                <>
                  <td>{pact(l)?.[1] ?? "—"}</td>
                  <td>{pact(l) ? ordinal(Number(pact(l)![0])) : "—"}</td>
                </>
              )}
              {slotLevels.map((s) => (
                <td key={s}>{sc!.slots[l]?.[s] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A class's page (DAG-84): at a glance, hit points, proficiencies, equipment, the class table and its features. */
export function ClassPage({ c, art = true }: { c: ClassData; art?: boolean }) {
  const linkTo = useContext(LinkContext);
  const guide = CLASS_GUIDE[c.id];
  const kit = CLASS_KITS[c.id];
  const gold = STARTING_GOLD[c.id];
  const sc = c.spellcasting;
  const item = (id: string, quantity: number) => {
    const it = itemById.get(id);
    const text = `${quantity > 1 ? `${quantity} × ` : ""}${it?.name ?? id}`;
    return it ? (
      <a className="codex-xref" href={linkTo("armory", id)}>
        {text}
      </a>
    ) : (
      text
    );
  };
  const line = (label: string, value: ReactNode) => (
    <p className="codex-line">
      <b>{label}</b> {value}
    </p>
  );
  return (
    <article className="statblock">
      <header>
        <h2 className="statblock-title">{c.name}</h2>
        {guide && (
          <p className="italic">
            {guide.role}. {guide.summary}
          </p>
        )}
      </header>
      {art && <ArtSlot chapter="classes" id={c.id} size="page" />}
      <dl className="codex-glance" aria-label="At a glance">
        <Fact label="Hit Die">d{c.hitDie}</Fact>
        <Fact label="Primary Ability">{abilityList(c.primaryAbilities)}</Fact>
        <Fact label="Saving Throws">{abilityList(c.savingThrows)}</Fact>
        <Fact label="Spellcasting">{sc ? `${ABILITY_NAMES[sc.ability]}${sc.pact ? " (Pact Magic)" : ""}` : "None"}</Fact>
      </dl>
      <hr className="statblock-rule" />
      <h3 className="statblock-section">Hit Points</h3>
      {line("Hit Dice", `1d${c.hitDie} per ${c.name.toLowerCase()} level`)}
      {line("At 1st level", `${c.hitDie} + your Constitution modifier`)}
      {line("At higher levels", `1d${c.hitDie} (or ${c.hitDie / 2 + 1}) + your Constitution modifier per ${c.name.toLowerCase()} level after 1st`)}
      <h3 className="statblock-section">Proficiencies</h3>
      {line("Armor", proficiencyList(c.armorProficiencies))}
      {line("Weapons", proficiencyList(c.weaponProficiencies))}
      {line("Tools", proficiencyList(c.toolProficiencies))}
      {line("Saving Throws", abilityList(c.savingThrows))}
      {line("Skills", `Choose ${NUMBER_WORDS[c.skillChoices.count] ?? c.skillChoices.count} from ${c.skillChoices.from.map(skillName).join(", ")}`)}
      {kit && (
        <>
          <h3 className="statblock-section">Equipment</h3>
          <ul className="codex-list">
            {kit.choices.map((ch) => (
              <li key={ch.id}>{ch.options.map((o) => o.label).join(", or ")}</li>
            ))}
            {kit.fixed.map((k) => (
              <li key={k.itemId}>{item(k.itemId, k.quantity)}</li>
            ))}
          </ul>
          <p className="my-1.5 text-sm text-ink-soft">
            The potion of healing is this Codex&apos;s suggested extra, not part of the SRD kit.
            {gold ? ` Or start with ${gold.dice}${gold.multiplier > 1 ? ` × ${gold.multiplier}` : ""} gp and buy your own.` : ""}
          </p>
        </>
      )}
      <hr className="statblock-rule" />
      <ClassTable c={c} />
      <h3 className="statblock-section">Class Features</h3>
      {featureGroups(c).map((g) => (
        <div key={`${g.name}.${g.levels[0]}`} className="codex-block">
          <h4 className="codex-feature">
            {g.name} <span className="codex-feature-level">{levelList(g.levels)}</span>
          </h4>
          <RulesBlocks text={g.description} spells={false} />
        </div>
      ))}
      {sc && (
        <p className="codex-line mt-3">
          <b>Spell list</b>{" "}
          <a className="codex-xref" href={codexHref("spells", null, filtered(SPELLBOOK, { class: [c.id] }))}>
            Every {c.name.toLowerCase()} spell in the Spellbook
          </a>
        </p>
      )}
      <DevLine>
        Engine id: <code>{c.id}</code>
      </DevLine>
    </article>
  );
}

function RaceEntry({ r }: { r: RaceData }) {
  const fits = CLASSES.filter((c) => c.primaryAbilities.some((a) => raceRaises(r, a)));
  return (
    <Spread
      page={<RacePage r={r} />}
      notes={
        <>
          <Note title="For new players">
            <p>{COMPLEXITY_LABELS[RACE_GUIDE[r.id]?.complexity ?? "some-choices"]}</p>
          </Note>
          <Note title="Quick start heroes of this race">
            <HeroNotes heroes={PREMADE_HEROES.filter((h) => h.raceId === r.id)} link="class" />
          </Note>
          {fits.length > 0 && (
            <Note title="Classes whose main abilities it raises">
              <NoteLinks chapter="classes" entries={fits} facts={(c) => `d${c.hitDie}`} limit={12} />
            </Note>
          )}
        </>
      }
    />
  );
}

/** A race's page (DAG-84): ability scores, size, speed and languages at a glance, its traits, and its subrace's. */
export function RacePage({ r, art = true }: { r: RaceData; art?: boolean }) {
  // The game's RaceData is named after its subrace ("Hill Dwarf"): the page is the race's ("Dwarf").
  const name = r.subrace?.baseName ?? r.name;
  const guide = RACE_GUIDE[r.id];
  const sub = r.subrace;
  const own = r.traits.filter((t) => !sub?.traitIds.includes(t.id));
  const subTraits = r.traits.filter((t) => sub?.traitIds.includes(t.id));
  const choice = RACE_ABILITY_CHOICES[r.id];
  const extra = RACE_EXTRA_LANGUAGES[r.id] ?? 0;
  const bonuses = (b: Partial<Record<string, number>>) =>
    Object.entries(b)
      .map(([a, n]) => `${ABILITY_NAMES[a as keyof typeof ABILITY_NAMES]} +${n}`)
      .join(", ");
  const baseBonuses = Object.fromEntries(Object.entries(r.abilityBonuses).map(([a, n]) => [a, (n ?? 0) - (sub?.abilityBonuses[a as keyof typeof sub.abilityBonuses] ?? 0)]).filter(([, n]) => (n as number) > 0));
  const trait = (t: { id: string; name: string; description: string }) => (
    <div key={t.id} className="codex-block">
      <RulesBlocks
        text={t.description}
        spells={/cantrip|spell/i.test(t.name)}
        lead={
          <b>
            <i>{t.name}.</i>
          </b>
        }
      />
    </div>
  );
  return (
    <article className="statblock">
      <header>
        <h2 className="statblock-title">{name}</h2>
        {guide && <p className="italic">{guide.summary}</p>}
      </header>
      {art && <ArtSlot chapter="races" id={r.id} name={name} size="page" />}
      <dl className="codex-glance" aria-label="At a glance">
        <Fact label="Ability Scores">
          {bonuses(r.abilityBonuses)}
          {choice ? <small className="block">and +1 to {NUMBER_WORDS[choice.count]} others of your choice</small> : null}
        </Fact>
        <Fact label="Size">{cap(r.size)}</Fact>
        <Fact label="Speed">{r.speed} ft.</Fact>
        <Fact label="Darkvision">{r.darkvision ? `${r.darkvision} ft.` : "—"}</Fact>
      </dl>
      <hr className="statblock-rule" />
      <p className="codex-line">
        <b>Ability Score Increase</b> {bonuses(baseBonuses)}
        {choice ? `, and +1 to ${NUMBER_WORDS[choice.count]} other abilities of your choice` : ""}
      </p>
      <p className="codex-line">
        <b>Languages</b> {r.languages.join(", ")}
        {extra ? `, and ${NUMBER_WORDS[extra]} more of your choice` : ""}
      </p>
      {own.length > 0 ? (
        <>
          <h3 className="statblock-section">Traits</h3>
          {own.map(trait)}
        </>
      ) : (
        <p className="my-1.5">No traits beyond its ability scores and language.</p>
      )}
      {sub && (
        <>
          <h3 className="statblock-section">{sub.name}</h3>
          <p className="my-1.5 text-sm text-ink-soft">The SRD&apos;s subrace of the {name.toLowerCase()}.</p>
          <p className="codex-line">
            <b>Ability Score Increase</b> {bonuses(sub.abilityBonuses)}
          </p>
          {subTraits.map(trait)}
        </>
      )}
      <DevLine>
        Engine id: <code>{r.id}</code>
      </DevLine>
    </article>
  );
}
/* ---------------- The Codex in play (DAG-81) ---------------- */

/** An entry's page with its notes, for any chapter. */
function EntryView({ chapter, id }: { chapter: CodexChapter; id: string }) {
  switch (chapter) {
    case "bestiary":
      return <MonsterEntry m={monsterById.get(id)!} />;
    case "spells":
      return <SpellEntry s={spellById.get(id)!} />;
    case "armory":
      return <ItemEntry i={itemById.get(id)!} />;
    case "classes":
      return <ClassEntry c={classById.get(id)!} />;
    case "races":
      return <RaceEntry r={raceById.get(id)!} />;
  }
}

/**
 * One Codex entry in a side panel, for the game (DAG-81): a creature, spell or item named in play
 * opens here without leaving the game. Links inside the panel open their entry in it, with Back;
 * "Open in the Codex" opens the whole Codex at the entry. Escape or the close button closes it,
 * and focus goes back to where it was.
 */
export function CodexPanel({
  chapter,
  id,
  onClose,
  defaultTheme = "dark",
  aside,
  label,
}: {
  chapter: CodexChapter;
  id: string;
  onClose: () => void;
  defaultTheme?: CodexTheme;
  /** Shown above the first entry (DAG-177: what the party knows of a creature it inspects). */
  aside?: ReactNode;
  /** The panel's name, in place of "Codex: <entry>". */
  label?: string;
}) {
  const [trail, setTrail] = useState<{ chapter: CodexChapter; id: string }[]>([{ chapter, id }]);
  useEffect(() => setTrail([{ chapter, id }]), [chapter, id]);
  const here = trail.at(-1)!;
  const found = entry(here.chapter, here.id);
  const [theme] = useState(() => loadTheme(defaultTheme));
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.();
  }, []);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    panel.current?.focus();
  }, [here]);
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [onClose]);
  // Beside the game the panel is a non-modal dialog: the game stays usable. When it covers the
  // whole screen (a phone), what's behind it is made inert, so focus and screen readers stay in it.
  useEffect(() => {
    const el = panel.current;
    if (!el?.parentElement) return;
    const behind = [...el.parentElement.children].filter((c): c is HTMLElement => c !== el && c instanceof HTMLElement);
    const update = () => {
      const covers = el.getBoundingClientRect().width >= (visualViewport?.width ?? innerWidth) - 1;
      for (const c of behind) c.inert = covers;
      el.setAttribute("aria-modal", covers ? "true" : "false");
    };
    update();
    addEventListener("resize", update);
    return () => {
      removeEventListener("resize", update);
      for (const c of behind) c.inert = false;
    };
  }, []);
  // A link to another entry opens it here; a link to a filtered list opens the whole Codex.
  const follow = (e: MouseEvent) => {
    if (e.defaultPrevented) return; // a first tap that only showed a preview
    const href = (e.target as HTMLElement).closest("a")?.getAttribute("href") ?? "";
    const r = parseCodexHash(href);
    if (!r || !r.id || r.filters || !entry(r.chapter, r.id)) return;
    e.preventDefault();
    setTrail((t) => [...t, { chapter: r.chapter, id: r.id! }]);
  };
  return (
    <div
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-label={label ?? `Codex: ${found?.name ?? "entry"}`}
      data-codex-theme={theme}
      className="codex-theme codex-panel fixed inset-y-0 right-0 z-40 flex w-full max-w-[36rem] flex-col border-l border-slate-600 bg-slate-900 text-stone-200 shadow-2xl outline-none"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 px-3 py-2">
        {trail.length > 1 && (
          <button type="button" className="btn-ghost codex-tap" onClick={() => setTrail((t) => t.slice(0, -1))}>
            <span aria-hidden="true">←</span> Back
          </button>
        )}
        <span className="font-display text-sm text-stone-300">{chapterName(here.chapter)}</span>
        <span className="flex-1" />
        <a className="codex-tap inline-flex items-center text-sm text-ember-light underline-offset-2 hover:underline" href={codexHref(here.chapter, here.id)}>
          Open in the Codex
        </a>
        <button type="button" className="btn-ghost codex-tap" onClick={onClose} aria-label="Close the Codex panel">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div ref={body} className="codex-page-area scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3" onClick={follow}>
        {aside && trail.length === 1 ? aside : null}
        {found ? <EntryView chapter={here.chapter} id={here.id} /> : <p className="text-stone-400">The Codex has no entry for that.</p>}
      </div>
    </div>
  );
}
