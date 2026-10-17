// Backgrounds (DAG-43). The game follows SRD 5.1, which has one background, the Acolyte. The others
// are written for this game in the same shape (two skills, two tools or languages, equipment, gold
// and a feature). Their text is original: no names, features or wording from other books.

import type { BackgroundData } from "@dnd/shared";

/** The SRD 5.1 Acolyte, with its suggested characteristics (from the 5e-bits SRD data; see fixtures/srd-5.1-acolyte.json). */
const ACOLYTE: BackgroundData = {
  id: "acolyte",
  name: "Acolyte",
  source: "srd-5.1",
  summary: "You have spent your life in the service of a temple to a specific god or pantheon of gods, performing sacred rites and conducting worshipers into the presence of the divine.",
  skills: ["insight", "religion"],
  languages: 2,
  tools: [],
  // A holy symbol, a prayer book, 5 sticks of incense, vestments, common clothes and a pouch with 15 gp.
  equipment: [
    { itemId: "holy-symbol", quantity: 1 },
    { itemId: "book", quantity: 1 },
    { itemId: "block-of-incense", quantity: 5 },
    { itemId: "vestments", quantity: 1 },
    { itemId: "clothes-common", quantity: 1 },
    { itemId: "pouch", quantity: 1 },
  ],
  gold: 15,
  feature: {
    name: "Shelter of the Faithful",
    description: "As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle.\n\nYou might also have ties to a specific temple dedicated to your chosen deity or pantheon, and you have a residence there. This could be the temple where you used to serve, if you remain on good terms with it, or a temple where you have found a new home. While near your temple, you can call upon the priests for assistance, provided the assistance you ask for is not hazardous and you remain in good standing with your temple.",
  },
  characteristics: {
    traits: [
        "I idolize a particular hero of my faith, and constantly refer to that person's deeds and example.",
        "I can find common ground between the fiercest enemies, empathizing with them and always working toward peace.",
        "I see omens in every event and action. The gods try to speak to us, we just need to listen.",
        "Nothing can shake my optimistic attitude.",
        "I quote (or misquote) sacred texts and proverbs in almost every situation.",
        "I am tolerant (or intolerant) of other faiths and respect (or condemn) the worship of other gods.",
        "I've enjoyed fine food, drink, and high society among my temple's elite. Rough living grates on me.",
        "I've spent so long in the temple that I have little practical experience dealing with people in the outside world.",
      ],
    ideals: [
        "Tradition. The ancient traditions of worship and sacrifice must be preserved and upheld.",
        "Charity. I always try to help those in need, no matter what the personal cost.",
        "Change. We must help bring about the changes the gods are constantly working in the world.",
        "Power. I hope to one day rise to the top of my faith's religious hierarchy.",
        "Faith. I trust that my deity will guide my actions. I have faith that if I work hard, things will go well.",
        "Aspiration. I seek to prove myself worthy of my god's favor by matching my actions against his or her teachings.",
      ],
    bonds: [
        "I would die to recover an ancient relic of my faith that was lost long ago.",
        "I will someday get revenge on the corrupt temple hierarchy who branded me a heretic.",
        "I owe my life to the priest who took me in when my parents died.",
        "Everything I do is for the common people.",
        "I will do anything to protect the temple where I served.",
        "I seek to preserve a sacred text that my enemies consider heretical and seek to destroy.",
      ],
    flaws: [
        "I judge others harshly, and myself even more severely.",
        "I put too much trust in those who wield power within my temple's hierarchy.",
        "My piety sometimes leads me to blindly trust those that profess faith in my god.",
        "I am inflexible in my thinking.",
        "I am suspicious of strangers and expect the worst of them.",
        "Once I pick a goal, I become obsessed with it to the detriment of everything else in my life.",
      ],
  },
};

/** Backgrounds written for this game. Each gives two skills and two tools or languages, like the SRD's. */
const ORIGINAL: BackgroundData[] = [
  {
    id: "caravan-guard",
    name: "Caravan Guard",
    source: "original",
    summary: "You walked the trade roads beside merchant wagons, watching the tree line for bandits and the travellers for liars.",
    skills: ["insight", "perception"],
    languages: 1,
    tools: ["dice-set"],
    equipment: [
      { itemId: "clothes-travelers", quantity: 1 },
      { itemId: "dice-set", quantity: 1 },
      { itemId: "signal-whistle", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 10,
    feature: {
      name: "Road-Known",
      description:
        "Caravan masters, teamsters and roadside innkeepers know your kind. You can always find work guarding a caravan bound for a nearby town, which gives you and your companions free passage and meals along the way.",
    },
  },
  {
    id: "hedge-scholar",
    name: "Hedge Scholar",
    source: "original",
    summary: "You never sat in a college, but you begged, copied and traded for every scrap of lore you could find, from hermits, travelling tutors and the margins of borrowed books.",
    skills: ["arcana", "history"],
    languages: 2,
    tools: [],
    equipment: [
      { itemId: "book", quantity: 1 },
      { itemId: "ink-1-ounce-bottle", quantity: 1 },
      { itemId: "ink-pen", quantity: 1 },
      { itemId: "clothes-common", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 10,
    feature: {
      name: "Marginalia",
      description:
        "When you don't know a piece of lore, you usually know who would: which library keeps it, which sage or old hermit remembers it, and what they are likely to ask in return.",
    },
  },
  {
    id: "street-runner",
    name: "Street Runner",
    source: "original",
    summary: "You grew up carrying messages, and sometimes stranger parcels, across a crowded city for anyone who paid.",
    skills: ["sleight-of-hand", "stealth"],
    languages: 0,
    tools: ["thieves-tools", "playing-card-set"],
    equipment: [
      { itemId: "clothes-common", quantity: 1 },
      { itemId: "small-knife", quantity: 1 },
      { itemId: "playing-card-set", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 10,
    feature: {
      name: "Rooftop Ways",
      description:
        "In any city you soon find the alleys, rooftops and cellar passages that runners use. Through them you and your companions can cross the city in half the usual time, and unseen if you are careful.",
    },
  },
  {
    id: "village-herbalist",
    name: "Village Herbalist",
    source: "original",
    summary: "You gathered roots and leaves, eased fevers and set bones for a village that had no priest and no physician.",
    skills: ["medicine", "nature"],
    languages: 1,
    tools: ["herbalism-kit"],
    equipment: [
      { itemId: "herbalism-kit", quantity: 1 },
      { itemId: "clothes-common", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 10,
    feature: {
      name: "A Remedy for a Roof",
      description:
        "Common folk trust anyone who has eased their pain. In villages and farmsteads you can trade your care for a meal and a dry place to sleep for you and your companions, and the locals will tell you what they have seen on the roads.",
    },
  },
  {
    id: "frontier-scout",
    name: "Frontier Scout",
    source: "original",
    summary: "You ranged ahead of settlers and surveyors at the edge of the known lands, mapping the way and warning of what waited there.",
    skills: ["survival", "stealth"],
    languages: 1,
    tools: ["cartographers-tools"],
    equipment: [
      { itemId: "clothes-travelers", quantity: 1 },
      { itemId: "hunting-trap", quantity: 1 },
      { itemId: "tinderbox", quantity: 1 },
      { itemId: "waterskin", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 10,
    feature: {
      name: "Trail Sign",
      description:
        "You read the marks that hunters, scouts and outlaws leave for each other, such as a notched branch or a cairn of three stones. Following them, you can usually find fresh water, a sheltered camp or a safer way through wild country.",
    },
  },
  {
    id: "exiled-heir",
    name: "Exiled Heir",
    source: "original",
    summary: "Your family lost its lands and its title in a quarrel you were too young to understand. You kept its name, its manners and a ring that no longer opens any door.",
    skills: ["history", "persuasion"],
    languages: 1,
    tools: ["playing-card-set"],
    equipment: [
      { itemId: "clothes-fine", quantity: 1 },
      { itemId: "signet-ring", quantity: 1 },
      { itemId: "sealing-wax", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 15,
    feature: {
      name: "An Old Name",
      description:
        "Minor nobles, old retainers and heralds still recognise your family's name. You can usually gain an audience with a local lord or official, though some of them remember why your family fell.",
    },
  },
  {
    id: "militia-veteran",
    name: "Militia Veteran",
    source: "original",
    summary: "You stood watch on a town wall and marched with the levy when raiders came. You know drill, hard bread and how fear spreads down a line.",
    skills: ["athletics", "intimidation"],
    languages: 1,
    tools: ["dice-set"],
    equipment: [
      { itemId: "clothes-common", quantity: 1 },
      { itemId: "dice-set", quantity: 1 },
      { itemId: "whetstone", quantity: 1 },
      { itemId: "pouch", quantity: 1 },
    ],
    gold: 10,
    feature: {
      name: "Muster Roll",
      description:
        "Watchmen, sergeants and militia captains treat you as one of their own. They share news of local dangers, and you and your companions can shelter in a guardhouse or barracks.",
    },
  },
];

export const BACKGROUNDS: BackgroundData[] = [ACOLYTE, ...ORIGINAL];

export const getBackground = (id: string): BackgroundData => {
  const b = BACKGROUNDS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown background: ${id}`);
  return b;
};

/** The background with this name, for characters that store it by name (all of them, so far). */
export const findBackgroundByName = (name: string): BackgroundData | undefined => BACKGROUNDS.find((b) => b.name === name);
