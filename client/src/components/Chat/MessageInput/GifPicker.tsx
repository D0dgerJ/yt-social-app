import React, { useEffect, useMemo, useRef, useState } from "react";
import "./GifPicker.scss";

const API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const SEARCH_URL = "https://api.giphy.com/v1/gifs/search";

type GiphyImage = {
  id: string;
  title: string;
  images: {
    fixed_height: { url: string; mp4: string; webp: string };
    preview_gif?: { url: string };
  };
};

interface GifPickerProps {
  onSelect: (url: string) => void;
}

const DEBOUNCE_MS = 400;
const LIMIT = 18;

const GifPicker: React.FC<GifPickerProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GiphyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (q: string) => {
    if (!API_KEY) {
      setErr("GIPHY API key отсутствует (VITE_GIPHY_API_KEY).");
      return;
    }
    if (!q.trim()) {
      setResults([]);
      setErr(null);
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const url = new URL(SEARCH_URL);
      url.searchParams.set("api_key", API_KEY);
      url.searchParams.set("q", q);
      url.searchParams.set("limit", String(LIMIT));
      url.searchParams.set("rating", "pg");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Giphy error: ${res.status}`);
      const json = await res.json();
      setResults(json?.data ?? []);
    } catch (e: any) {
      setErr(e?.message || "Не удалось загрузить GIF");
    } finally {
      setLoading(false);
    }
  };

  const onInput = (val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(val), DEBOUNCE_MS);
  };

  const pickUrl = (g: GiphyImage) => {
    const mp4 = g.images.fixed_height?.mp4;
    const webp = g.images.fixed_height?.webp;
    const gif = g.images.fixed_height?.url;
    onSelect(mp4 || webp || gif);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const content = useMemo(() => {
    if (err) return <div className="gif-error">{err}</div>;
    if (loading) return <div className="gif-loading">Загрузка…</div>;
    if (!results.length && query.trim()) return <div className="gif-empty">Ничего не найдено</div>;
    return (
      <div className="gif-results">
        {results.map((g) => (
          <button
            key={g.id}
            className="gif-thumb"
            title={g.title}
            onClick={() => pickUrl(g)}
          >
            <img
              src={g.images.preview_gif?.url || g.images.fixed_height?.url}
              alt={g.title}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    );
  }, [err, loading, results, query]);

  return (
    <div className="gif-picker">
      <div className="gif-search">
        <input
          type="text"
          placeholder="Поиск GIF…"
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
        />
        <button onClick={() => doSearch(query)} aria-label="Искать">🔍</button>
      </div>
      {content}
    </div>
  );
};

export default GifPicker;
