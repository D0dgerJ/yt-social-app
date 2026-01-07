import { buildFloatingHolidayMapForYear } from "./floatingHolidays";

export type Holiday = {
  key: string;
  title: string;
  month: number;
  day: number;
  color?: string;
  icon?: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const FIXED_HOLIDAYS: Holiday[] = [
  // JAN
  { key: "new_year", title: "Новый год", month: 0, day: 1, color: "#16a34a", icon: "🎉" },
  { key: "epiphany", title: "Богоявление", month: 0, day: 6, color: "#0ea5e9", icon: "💧" },

  // FEB
  { key: "valentines", title: "День святого Валентина", month: 1, day: 14, color: "#db2777", icon: "💘" },
  { key: "world_cancer", title: "Всемирный день борьбы с раком", month: 1, day: 4, color: "#ef4444", icon: "🎗️" },

  // MAR
  { key: "womens_day", title: "8 Марта", month: 2, day: 8, color: "#7c3aed", icon: "🌷" },
  { key: "st_patrick", title: "День святого Патрика", month: 2, day: 17, color: "#16a34a", icon: "☘️" },

  // APR
  { key: "april_fools", title: "День смеха", month: 3, day: 1, color: "#f97316", icon: "🤡" },
  { key: "world_health", title: "Всемирный день здоровья", month: 3, day: 7, color: "#22c55e", icon: "🩺" },

  // MAY
  { key: "labour_day", title: "Праздник труда", month: 4, day: 1, color: "#0ea5e9", icon: "🛠️" },
  { key: "victory_day", title: "День Победы", month: 4, day: 9, color: "#dc2626", icon: "🎖️" },
  { key: "star_wars", title: "Star Wars Day", month: 4, day: 4, color: "#111827", icon: "⭐" },

  // JUN
  { key: "childrens_day", title: "День защиты детей", month: 5, day: 1, color: "#f97316", icon: "🧒" },
  { key: "env_day", title: "Всемирный день окружающей среды", month: 5, day: 5, color: "#16a34a", icon: "🌿" },

  // JUL
  { key: "canada_day", title: "День Канады", month: 6, day: 1, color: "#dc2626", icon: "🇨🇦" },
  { key: "us_independence", title: "День независимости США", month: 6, day: 4, color: "#2563eb", icon: "🇺🇸" },
  { key: "bastille", title: "День взятия Бастилии", month: 6, day: 14, color: "#2563eb", icon: "🇫🇷" },

  // SEP
  { key: "knowledge_day", title: "День знаний", month: 8, day: 1, color: "#f97316", icon: "📚" },
  { key: "peace_day", title: "Международный день мира", month: 8, day: 21, color: "#0ea5e9", icon: "🕊️" },

  // OCT
  { key: "teachers_day", title: "День учителя", month: 9, day: 5, color: "#f97316", icon: "👩‍🏫" },
  { key: "mental_health", title: "День психического здоровья", month: 9, day: 10, color: "#0ea5e9", icon: "🧠" },
  { key: "halloween", title: "Хэллоуин", month: 9, day: 31, color: "#f97316", icon: "🎃" },

  // NOV
  { key: "all_saints", title: "День всех святых", month: 10, day: 1, color: "#64748b", icon: "🕯️" },
  { key: "armistice", title: "День памяти (11/11)", month: 10, day: 11, color: "#dc2626", icon: "🎗️" },

  // DEC
  { key: "st_nicholas", title: "День Святого Николая", month: 11, day: 6, color: "#2563eb", icon: "🎁" },
  { key: "christmas", title: "Рождество", month: 11, day: 25, color: "#dc2626", icon: "🎄" },
  { key: "new_year_eve", title: "Канун Нового года", month: 11, day: 31, color: "#16a34a", icon: "🥂" },
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