import { buildFloatingHolidayMapForYear } from "./floatingHolidays";

export type Holiday = {
  key: string;
  title: string;
  month: number;
  day: number;
  color?: string;
  icon?: string;
  wiki?: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const FIXED_HOLIDAYS: Holiday[] = [
  // JAN
  {
    key: "new_year",
    title: "New Year",
    month: 0,
    day: 1,
    color: "#16a34a",
    icon: "🎉",
    wiki: "https://en.wikipedia.org/wiki/New_Year",
  },
  {
    key: "epiphany",
    title: "Epiphany",
    month: 0,
    day: 6,
    color: "#0ea5e9",
    icon: "💧",
    wiki: "https://en.wikipedia.org/wiki/Epiphany_(holiday)",
  },

  // FEB
  {
    key: "valentines",
    title: "Valentine's Day",
    month: 1,
    day: 14,
    color: "#db2777",
    icon: "💘",
    wiki: "https://en.wikipedia.org/wiki/Valentine%27s_Day",
  },
  {
    key: "world_cancer",
    title: "World Cancer Day",
    month: 1,
    day: 4,
    color: "#ef4444",
    icon: "🎗️",
    wiki: "https://en.wikipedia.org/wiki/World_Cancer_Day",
  },

  // MAR
  {
    key: "womens_day",
    title: "International Women's Day",
    month: 2,
    day: 8,
    color: "#7c3aed",
    icon: "🌷",
    wiki: "https://en.wikipedia.org/wiki/International_Women%27s_Day",
  },
  {
    key: "st_patrick",
    title: "Saint Patrick's Day",
    month: 2,
    day: 17,
    color: "#16a34a",
    icon: "☘️",
    wiki: "https://en.wikipedia.org/wiki/Saint_Patrick%27s_Day",
  },

  // APR
  {
    key: "april_fools",
    title: "April Fools' Day",
    month: 3,
    day: 1,
    color: "#f97316",
    icon: "🤡",
    wiki: "https://en.wikipedia.org/wiki/April_Fools%27_Day",
  },
  {
    key: "world_health",
    title: "World Health Day",
    month: 3,
    day: 7,
    color: "#22c55e",
    icon: "🩺",
    wiki: "https://en.wikipedia.org/wiki/World_Health_Day",
  },

  // MAY
  {
    key: "labour_day",
    title: "Labour Day",
    month: 4,
    day: 1,
    color: "#0ea5e9",
    icon: "🛠️",
    wiki: "https://en.wikipedia.org/wiki/International_Workers%27_Day",
  },
  {
    key: "victory_day",
    title: "Victory Day",
    month: 4,
    day: 9,
    color: "#dc2626",
    icon: "🎖️",
    wiki: "https://en.wikipedia.org/wiki/Victory_Day_(9_May)",
  },
  {
    key: "star_wars",
    title: "Star Wars Day",
    month: 4,
    day: 4,
    color: "#111827",
    icon: "⭐",
    wiki: "https://en.wikipedia.org/wiki/Star_Wars_Day",
  },

  // JUN
  {
    key: "childrens_day",
    title: "Children's Day",
    month: 5,
    day: 1,
    color: "#f97316",
    icon: "🧒",
    wiki: "https://en.wikipedia.org/wiki/Children%27s_Day",
  },
  {
    key: "env_day",
    title: "World Environment Day",
    month: 5,
    day: 5,
    color: "#16a34a",
    icon: "🌿",
    wiki: "https://en.wikipedia.org/wiki/World_Environment_Day",
  },

  // JUL
  {
    key: "canada_day",
    title: "Canada Day",
    month: 6,
    day: 1,
    color: "#dc2626",
    icon: "🇨🇦",
    wiki: "https://en.wikipedia.org/wiki/Canada_Day",
  },
  {
    key: "us_independence",
    title: "United States Independence Day",
    month: 6,
    day: 4,
    color: "#2563eb",
    icon: "🇺🇸",
    wiki: "https://en.wikipedia.org/wiki/Independence_Day_(United_States)",
  },
  {
    key: "bastille",
    title: "Bastille Day",
    month: 6,
    day: 14,
    color: "#2563eb",
    icon: "🇫🇷",
    wiki: "https://en.wikipedia.org/wiki/Bastille_Day",
  },

  // SEP
  {
    key: "knowledge_day",
    title: "Knowledge Day",
    month: 8,
    day: 1,
    color: "#f97316",
    icon: "📚",
    wiki: "https://en.wikipedia.org/wiki/Knowledge_Day",
  },
  {
    key: "peace_day",
    title: "International Day of Peace",
    month: 8,
    day: 21,
    color: "#0ea5e9",
    icon: "🕊️",
    wiki: "https://en.wikipedia.org/wiki/International_Day_of_Peace",
  },

  // OCT
  {
    key: "teachers_day",
    title: "World Teachers' Day",
    month: 9,
    day: 5,
    color: "#f97316",
    icon: "👩‍🏫",
    wiki: "https://en.wikipedia.org/wiki/World_Teachers%27_Day",
  },
  {
    key: "mental_health",
    title: "World Mental Health Day",
    month: 9,
    day: 10,
    color: "#0ea5e9",
    icon: "🧠",
    wiki: "https://en.wikipedia.org/wiki/World_Mental_Health_Day",
  },
  {
    key: "halloween",
    title: "Halloween",
    month: 9,
    day: 31,
    color: "#f97316",
    icon: "🎃",
    wiki: "https://en.wikipedia.org/wiki/Halloween",
  },

  // NOV
  {
    key: "all_saints",
    title: "All Saints' Day",
    month: 10,
    day: 1,
    color: "#64748b",
    icon: "🕯️",
    wiki: "https://en.wikipedia.org/wiki/All_Saints%27_Day",
  },
  {
    key: "armistice",
    title: "Armistice Day (11/11)",
    month: 10,
    day: 11,
    color: "#dc2626",
    icon: "🎗️",
    wiki: "https://en.wikipedia.org/wiki/Armistice_Day",
  },

  // DEC
  {
    key: "st_nicholas",
    title: "Saint Nicholas Day",
    month: 11,
    day: 6,
    color: "#2563eb",
    icon: "🎁",
    wiki: "https://en.wikipedia.org/wiki/Saint_Nicholas_Day",
  },
  {
    key: "christmas",
    title: "Christmas",
    month: 11,
    day: 25,
    color: "#dc2626",
    icon: "🎄",
    wiki: "https://en.wikipedia.org/wiki/Christmas",
  },
  {
    key: "new_year_eve",
    title: "New Year's Eve",
    month: 11,
    day: 31,
    color: "#16a34a",
    icon: "🥂",
    wiki: "https://en.wikipedia.org/wiki/New_Year%27s_Eve",
  },
];

export const buildHolidayMapForYear = (year: number) => {
  const map = new Map<string, Holiday[]>();

  // 1) fixed
  for (const h of FIXED_HOLIDAYS) {
    const key = `${year}-${pad2(h.month + 1)}-${pad2(h.day)}`;
    const list = map.get(key) ?? [];
    list.push(h);
    map.set(key, list);
  }

  // 2) floating
  const floating = buildFloatingHolidayMapForYear(year);
  for (const [key, list] of floating.entries()) {
    const prev = map.get(key) ?? [];
    map.set(key, [...prev, ...list]);
  }

  return map;
};