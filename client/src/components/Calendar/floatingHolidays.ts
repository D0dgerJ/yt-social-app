import type { Holiday } from "./holidays";

const pad2 = (n: number) => String(n).padStart(2, "0");

const ymdKey = (d: Date) => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

const addToMap = (map: Map<string, Holiday[]>, date: Date, h: Holiday) => {
  const key = ymdKey(date);
  const list = map.get(key) ?? [];
  list.push(h);
  map.set(key, list);
};

/**
 * Western Easter (Gregorian) — алгоритм Meeus/Jones/Butcher.
 * Возвращает Date в локальной таймзоне (нам важно только Y-M-D).
 */
const calcWesternEaster = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
};

/**
 * Возвращает дату n-го weekday в месяце:
 * weekday: 0=Sun ... 6=Sat
 * n: 1..5
 */
const nthWeekdayOfMonth = (
  year: number,
  month0: number,
  weekday: number,
  n: number
) => {
  const first = new Date(year, month0, 1);
  const firstWeekday = first.getDay();
  const delta = (weekday - firstWeekday + 7) % 7;
  const day = 1 + delta + (n - 1) * 7;
  return new Date(year, month0, day);
};

/**
 * Последний weekday в месяце:
 * weekday: 0=Sun ... 6=Sat
 */
const lastWeekdayOfMonth = (year: number, month0: number, weekday: number) => {
  const last = new Date(year, month0 + 1, 0); // последний день месяца
  const lastW = last.getDay();
  const deltaBack = (lastW - weekday + 7) % 7;
  return new Date(year, month0, last.getDate() - deltaBack);
};

/**
 * День программиста: 256-й день года (13 Sep / 12 Sep в високосный)
 * (Date сам корректно перекинет месяцы)
 */
const programmersDay = (year: number) => new Date(year, 0, 256);

export const buildFloatingHolidayMapForYear = (year: number) => {
  const map = new Map<string, Holiday[]>();

  // ✅ Пасха (Western)
  const easter = calcWesternEaster(year);
  addToMap(map, easter, {
    key: `easter_${year}`,
    title: "Пасха",
    month: easter.getMonth(),
    day: easter.getDate(),
    color: "#dc2626",
    icon: "✝️",
    wiki: "https://ru.wikipedia.org/wiki/Пасха",
  });

  // ✅ Earth Hour — последняя суббота марта
  const earthHour = lastWeekdayOfMonth(year, 2, 6); // March(2), Saturday(6)
  addToMap(map, earthHour, {
    key: `earth_hour_${year}`,
    title: "Час Земли",
    month: earthHour.getMonth(),
    day: earthHour.getDate(),
    color: "#0f172a",
    icon: "🌍",
    wiki: "https://ru.wikipedia.org/wiki/Час_Земли",
  });

  // ✅ MLK Day — 3-й понедельник января (US)
  const mlk = nthWeekdayOfMonth(year, 0, 1, 3); // Jan(0), Monday(1), 3rd
  addToMap(map, mlk, {
    key: `mlk_${year}`,
    title: "День Мартина Лютера Кинга",
    month: mlk.getMonth(),
    day: mlk.getDate(),
    color: "#0ea5e9",
    icon: "🕊️",
    wiki: "https://ru.wikipedia.org/wiki/День_Мартина_Лютера_Кинга",
  });

  // ✅ Mother's Day — 2-е воскресенье мая (US/многие страны)
  const mothers = nthWeekdayOfMonth(year, 4, 0, 2); // May(4), Sunday(0), 2nd
  addToMap(map, mothers, {
    key: `mothers_day_${year}`,
    title: "День матери",
    month: mothers.getMonth(),
    day: mothers.getDate(),
    color: "#db2777",
    icon: "💐",
    wiki: "https://ru.wikipedia.org/wiki/День_матери",
  });

  // ✅ Programmer’s Day — 256-й день года
  const prog = programmersDay(year);
  addToMap(map, prog, {
    key: `programmers_day_${year}`,
    title: "День программиста",
    month: prog.getMonth(),
    day: prog.getDate(),
    color: "#111827",
    icon: "💻",
    wiki: "https://ru.wikipedia.org/wiki/День_программиста",
  });

  // ✅ Thanksgiving — 4-й четверг ноября (US)
  const thanks = nthWeekdayOfMonth(year, 10, 4, 4); // Nov(10), Thu(4), 4th
  addToMap(map, thanks, {
    key: `thanksgiving_${year}`,
    title: "Thanksgiving",
    month: thanks.getMonth(),
    day: thanks.getDate(),
    color: "#f97316",
    icon: "🦃",
    wiki: "https://en.wikipedia.org/wiki/Thanksgiving",
  });

  // ✅ Black Friday — следующий день после Thanksgiving
  const blackFriday = new Date(
    thanks.getFullYear(),
    thanks.getMonth(),
    thanks.getDate() + 1
  );
  addToMap(map, blackFriday, {
    key: `black_friday_${year}`,
    title: "Black Friday",
    month: blackFriday.getMonth(),
    day: blackFriday.getDate(),
    color: "#111827",
    icon: "🛍️",
    wiki: "https://en.wikipedia.org/wiki/Black_Friday_(shopping)",
  });

  return map;
};