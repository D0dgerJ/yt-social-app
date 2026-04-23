import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTrendingGifs, searchGifs, type GifItem } from "@/services/giphy.api";
import "./GifPicker.scss";

interface GifPickerProps {
  onSelect: (url: string) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 400;
const LIMIT = 24;

function mergeUniqueById(list: GifItem[], add: GifItem[]) {
  const map = new Map<string, GifItem>();
  for (const it of list) map.set(it.id, it);
  for (const it of add) {
    if (!map.has(it.id)) map.set(it.id, it);
  }
  return Array.from(map.values());
}

const GifPicker: React.FC<GifPickerProps> = ({
  onSelect,
  placeholder,
}) => {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder || t("chat.searchGif");

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GifItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const sourceKeyRef = useRef<string>("");

  const resetList = (newQuery: string) => {
    sourceKeyRef.current = newQuery.trim();
    setItems([]);
    setOffset(0);
    setHasMore(true);
  };

  const fetchPage = async (
    effectiveQuery: string,
    curOffset: number,
    reset = false
  ) => {
    if (loading) return;

    setLoading(true);
    setErr(null);

    try {
      const page = effectiveQuery
        ? await searchGifs(effectiveQuery, LIMIT, curOffset)
        : await getTrendingGifs(LIMIT, curOffset);

      const safePage = page.filter(
        (g: GifItem) => Boolean(g.id && g.preview && g.url)
      );

      setItems((prev) =>
        reset ? mergeUniqueById([], safePage) : mergeUniqueById(prev, safePage)
      );
      setOffset(curOffset + safePage.length);
      setHasMore(safePage.length === LIMIT);
    } catch (e: any) {
      setErr(e?.message || t("chat.failedToLoadGifs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) return;

    const initialQuery = "";
    sourceKeyRef.current = initialQuery;
    void fetchPage(initialQuery, 0, true);
    setInitialized(true);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const onInput = (val: string) => {
    setQuery(val);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const nextQuery = val.trim();
      resetList(nextQuery);
      void fetchPage(nextQuery, 0, true);
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!initialized) return;

    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        const nextQuery = sourceKeyRef.current || query.trim();
        void fetchPage(nextQuery, offset, false);
      }
    });

    io.observe(el);

    return () => {
      io.disconnect();
    };
  }, [hasMore, loading, offset, query, initialized]);

  const pick = (gif: GifItem) => {
    if (!gif.url) return;
    onSelect(gif.url);
  };

  const content = useMemo(() => {
    if (err) return <div className="gif-error">{err}</div>;
    if (!items.length && loading) return <div className="gif-loading">{t("common.loading")}</div>;
    if (!items.length) return <div className="gif-empty">{t("chat.nothingFound")}</div>;

    return (
      <>
        <div className="gif-results">
          {items.map((g, i) => (
            <button
              key={`gif-${g.id}-${i}`}
              className="gif-thumb"
              title={t("chat.sendGif")}
              onClick={() => pick(g)}
              type="button"
            >
              <img src={g.preview} alt={g.title || "gif preview"} loading="lazy" />
            </button>
          ))}
        </div>
        <div ref={sentinelRef} className="gif-sentinel" />
      </>
    );
  }, [err, loading, items, t]);

  return (
    <div className="gif-picker">
      <div className="gif-search">
        <input
          type="text"
          placeholder={effectivePlaceholder}
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const nextQuery = query.trim();
              resetList(nextQuery);
              void fetchPage(nextQuery, 0, true);
            }
          }}
        />
        <button
          onClick={() => {
            const nextQuery = query.trim();
            resetList(nextQuery);
            void fetchPage(nextQuery, 0, true);
          }}
          aria-label={t("chat.search")}
          type="button"
        >
          🔍
        </button>
      </div>

      {content}

      <div className="gif-powered">
        GIFs by&nbsp;
        <a href="https://giphy.com/" target="_blank" rel="noreferrer">
          GIPHY
        </a>
      </div>
    </div>
  );
};

export default GifPicker;