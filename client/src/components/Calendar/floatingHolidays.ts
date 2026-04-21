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
 * Western Easter (Gregorian) — Meeus/Jones/Butcher algorithm.
 * Returns a Date in the local timezone (only Y-M-D matters here).
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
 * Returns the date of the nth weekday in a month:
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
 * Returns the last weekday in a month:
 * weekday: 0=Sun ... 6=Sat
 */
const lastWeekdayOfMonth = (year: number, month0: number, weekday: number) => {
  const last = new Date(year, month0 + 1, 0); // last day of the month
  const lastW = last.getDay();
  const deltaBack = (lastW - weekday + 7) % 7;
  return new Date(year, month0, last.getDate() - deltaBack);
};

/**
 * Programmer's Day: the 256th day of the year (Sep 13 / Sep 12 in leap years)
 * Date will handle month rollover correctly.
 */
const programmersDay = (year: number) => new Date(year, 0, 256);

export const buildFloatingHolidayMapForYear = (year: number) => {
  const map = new Map<string, Holiday[]>();

  // Easter (Western)
  const easter = calcWesternEaster(year);
  addToMap(map, easter, {
    key: `easter_${year}`,
    title: "Easter",
    month: easter.getMonth(),
    day: easter.getDate(),
    color: "#dc2626",
    icon: "✝️",
    wiki: "https://en.wikipedia.org/wiki/Easter",
  });

  // Earth Hour — last Saturday of March
  const earthHour = lastWeekdayOfMonth(year, 2, 6); // March(2), Saturday(6)
  addToMap(map, earthHour, {
    key: `earth_hour_${year}`,
    title: "Earth Hour",
    month: earthHour.getMonth(),
    day: earthHour.getDate(),
    color: "#0f172a",
    icon: "🌍",
    wiki: "https://en.wikipedia.org/wiki/Earth_Hour",
  });

  // MLK Day — 3rd Monday of January (US)
  const mlk = nthWeekdayOfMonth(year, 0, 1, 3); // Jan(0), Monday(1), 3rd
  addToMap(map, mlk, {
    key: `mlk_${year}`,
    title: "Martin Luther King Jr. Day",
    month: mlk.getMonth(),
    day: mlk.getDate(),
    color: "#0ea5e9",
    icon: "🕊️",
    wiki: "https://en.wikipedia.org/wiki/Martin_Luther_King_Jr._Day",
  });

  // Mother's Day — 2nd Sunday of May (US/many countries)
  const mothers = nthWeekdayOfMonth(year, 4, 0, 2); // May(4), Sunday(0), 2nd
  addToMap(map, mothers, {
    key: `mothers_day_${year}`,
    title: "Mother's Day",
    month: mothers.getMonth(),
    day: mothers.getDate(),
    color: "#db2777",
    icon: "💐",
    wiki: "https://en.wikipedia.org/wiki/Mother%27s_Day",
  });

  // Programmer’s Day — 256th day of the year
  const prog = programmersDay(year);
  addToMap(map, prog, {
    key: `programmers_day_${year}`,
    title: "Programmer's Day",
    month: prog.getMonth(),
    day: prog.getDate(),
    color: "#111827",
    icon: "💻",
    wiki: "https://en.wikipedia.org/wiki/Programmer%27s_Day",
  });

  // Thanksgiving — 4th Thursday of November (US)
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

  // Black Friday — day after Thanksgiving
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