import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTrendingGifs, searchGifs, GifItem } from "@/services/giphy.api";
import "./GifPicker.scss";

interface GifPickerProps {
  onSelect: (url: string) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 400;
const LIMIT = 24;

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, placeholder = "Поиск GIF…" }) => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GifItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = async (opts: { reset?: boolean } = {}) => {
    if (loading) return;
    setLoading(true);
    setErr(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const curOffset = opts.reset ? 0 : offset;
      const page = query.trim()
        ? await searchGifs(query.trim(), LIMIT, curOffset)
        : await getTrendingGifs(LIMIT, curOffset);

      setItems((prev) => (opts.reset ? page : [...prev, ...page]));
      setOffset(curOffset + LIMIT);
      setHasMore(page.length === LIMIT);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setErr(e?.message || "Не удалось загрузить GIF");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage({ reset: true });
    return () => abortRef.current?.abort();
  }, []);

  const onInput = (val: string) => {
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setOffset(0);
      setHasMore(true);
      loadPage({ reset: true });
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, query, offset]);

  const pick = (gif: GifItem) => onSelect(gif.url);

  const content = useMemo(() => {
    if (err) return <div className="gif-error">{err}</div>;
    if (!items.length && loading) return <div className="gif-loading">Загрузка…</div>;
    if (!items.length) return <div className="gif-empty">Ничего не найдено</div>;
    return (
      <>
        <div className="gif-results">
          {items.map((g) => (
            <button
              key={g.id}
              className="gif-thumb"
              title="Отправить GIF"
              onClick={() => pick(g)}
              type="button"
            >
              <img src={g.preview} alt="gif preview" loading="lazy" />
            </button>
          ))}
        </div>
        <div ref={sentinelRef} className="gif-sentinel" />
      </>
    );
  }, [err, loading, items]);

  return (
    <div className="gif-picker">
      <div className="gif-search">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadPage({ reset: true })}
        />
        <button onClick={() => loadPage({ reset: true })} aria-label="Искать" type="button">🔍</button>
      </div>

      {content}

      <div className="gif-powered">GIFs by&nbsp;<a href="https://giphy.com/" target="_blank" rel="noreferrer">GIPHY</a></div>
    </div>
  );
};

export default GifPicker;
