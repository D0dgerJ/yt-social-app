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
    title: "Новый год",
    month: 0,
    day: 1,
    color: "#16a34a",
    icon: "🎉",
    wiki: "https://ru.wikipedia.org/wiki/Новый_год",
  },
  {
    key: "epiphany",
    title: "Богоявление",
    month: 0,
    day: 6,
    color: "#0ea5e9",
    icon: "💧",
    wiki: "https://ru.wikipedia.org/wiki/Богоявление",
  },

  // FEB
  {
    key: "valentines",
    title: "День святого Валентина",
    month: 1,
    day: 14,
    color: "#db2777",
    icon: "💘",
    wiki: "https://ru.wikipedia.org/wiki/День_святого_Валентина",
  },
  {
    key: "world_cancer",
    title: "Всемирный день борьбы с раком",
    month: 1,
    day: 4,
    color: "#ef4444",
    icon: "🎗️",
    wiki: "https://ru.wikipedia.org/wiki/Всемирный_день_борьбы_против_рака",
  },

  // MAR
  {
    key: "womens_day",
    title: "8 Марта",
    month: 2,
    day: 8,
    color: "#7c3aed",
    icon: "🌷",
    wiki: "https://ru.wikipedia.org/wiki/Международный_женский_день",
  },
  {
    key: "st_patrick",
    title: "День святого Патрика",
    month: 2,
    day: 17,
    color: "#16a34a",
    icon: "☘️",
    wiki: "https://ru.wikipedia.org/wiki/День_святого_Патрика",
  },

  // APR
  {
    key: "april_fools",
    title: "День смеха",
    month: 3,
    day: 1,
    color: "#f97316",
    icon: "🤡",
    wiki: "https://ru.wikipedia.org/wiki/Первое_апреля",
  },
  {
    key: "world_health",
    title: "Всемирный день здоровья",
    month: 3,
    day: 7,
    color: "#22c55e",
    icon: "🩺",
    wiki: "https://ru.wikipedia.org/wiki/Всемирный_день_здоровья",
  },

  // MAY
  {
    key: "labour_day",
    title: "Праздник труда",
    month: 4,
    day: 1,
    color: "#0ea5e9",
    icon: "🛠️",
    wiki: "https://ru.wikipedia.org/wiki/Праздник_Весны_и_Труда",
  },
  {
    key: "victory_day",
    title: "День Победы",
    month: 4,
    day: 9,
    color: "#dc2626",
    icon: "🎖️",
    wiki: "https://ru.wikipedia.org/wiki/День_Победы",
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
    title: "День защиты детей",
    month: 5,
    day: 1,
    color: "#f97316",
    icon: "🧒",
    wiki: "https://ru.wikipedia.org/wiki/Международный_день_защиты_детей",
  },
  {
    key: "env_day",
    title: "Всемирный день окружающей среды",
    month: 5,
    day: 5,
    color: "#16a34a",
    icon: "🌿",
    wiki: "https://ru.wikipedia.org/wiki/Всемирный_день_окружающей_среды",
  },

  // JUL
  {
    key: "canada_day",
    title: "День Канады",
    month: 6,
    day: 1,
    color: "#dc2626",
    icon: "🇨🇦",
    wiki: "https://ru.wikipedia.org/wiki/День_Канады",
  },
  {
    key: "us_independence",
    title: "День независимости США",
    month: 6,
    day: 4,
    color: "#2563eb",
    icon: "🇺🇸",
    wiki: "https://ru.wikipedia.org/wiki/День_независимости_США",
  },
  {
    key: "bastille",
    title: "День взятия Бастилии",
    month: 6,
    day: 14,
    color: "#2563eb",
    icon: "🇫🇷",
    wiki: "https://ru.wikipedia.org/wiki/День_взятия_Бастилии",
  },

  // SEP
  {
    key: "knowledge_day",
    title: "День знаний",
    month: 8,
    day: 1,
    color: "#f97316",
    icon: "📚",
    wiki: "https://ru.wikipedia.org/wiki/День_знаний",
  },
  {
    key: "peace_day",
    title: "Международный день мира",
    month: 8,
    day: 21,
    color: "#0ea5e9",
    icon: "🕊️",
    wiki: "https://ru.wikipedia.org/wiki/Международный_день_мира",
  },

  // OCT
  {
    key: "teachers_day",
    title: "День учителя",
    month: 9,
    day: 5,
    color: "#f97316",
    icon: "👩‍🏫",
    wiki: "https://ru.wikipedia.org/wiki/День_учителя",
  },
  {
    key: "mental_health",
    title: "День психического здоровья",
    month: 9,
    day: 10,
    color: "#0ea5e9",
    icon: "🧠",
    wiki: "https://ru.wikipedia.org/wiki/Всемирный_день_психического_здоровья",
  },
  {
    key: "halloween",
    title: "Хэллоуин",
    month: 9,
    day: 31,
    color: "#f97316",
    icon: "🎃",
    wiki: "https://ru.wikipedia.org/wiki/Хэллоуин",
  },

  // NOV
  {
    key: "all_saints",
    title: "День всех святых",
    month: 10,
    day: 1,
    color: "#64748b",
    icon: "🕯️",
    wiki: "https://ru.wikipedia.org/wiki/День_всех_святых",
  },
  {
    key: "armistice",
    title: "День памяти (11/11)",
    month: 10,
    day: 11,
    color: "#dc2626",
    icon: "🎗️",
    wiki: "https://ru.wikipedia.org/wiki/День_перемирия",
  },

  // DEC
  {
    key: "st_nicholas",
    title: "День Святого Николая",
    month: 11,
    day: 6,
    color: "#2563eb",
    icon: "🎁",
    wiki: "https://ru.wikipedia.org/wiki/День_святого_Николая",
  },
  {
    key: "christmas",
    title: "Рождество",
    month: 11,
    day: 25,
    color: "#dc2626",
    icon: "🎄",
    wiki: "https://ru.wikipedia.org/wiki/Рождество_Христово",
  },
  {
    key: "new_year_eve",
    title: "Канун Нового года",
    month: 11,
    day: 31,
    color: "#16a34a",
    icon: "🥂",
    wiki: "https://ru.wikipedia.org/wiki/Новый_год",
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