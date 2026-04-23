import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import ru from "./locales/ru";

export const LANGUAGE_STORAGE_KEY = "preferredLanguage";

export type AppLanguage = "en" | "ru";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
};

function normalizeLanguage(raw?: string | null): AppLanguage | null {
  if (!raw) return null;

  const value = raw.toLowerCase().trim();

  if (value === "ru" || value.startsWith("ru-")) {
    return "ru";
  }

  if (value === "en" || value.startsWith("en-")) {
    return "en";
  }

  return null;
}

function detectBrowserLanguage(): AppLanguage {
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    const normalized = normalizeLanguage(candidate);
    if (normalized === "ru") return "ru";
  }

  return "en";
}

export function getInitialLanguage(): AppLanguage {
  const stored = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  if (stored) return stored;

  return detectBrowserLanguage();
}

export function saveLanguage(language: AppLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;