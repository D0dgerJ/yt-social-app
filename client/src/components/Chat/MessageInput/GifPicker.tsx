import React, { useState } from "react";
import axios from "axios";
import "./GifPicker.scss";

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

const GifPicker: React.FC<GifPickerProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(GIPHY_SEARCH_URL, {
        params: {
          api_key: GIPHY_API_KEY,
          q: query,
          limit: 10,
        },
      });
      setResults(res.data.data);
    } catch (error) {
      console.error("Ошибка при поиске GIF:", error);
    }
  };

  return (
    <div className="gif-picker">
      <div className="gif-search">
        <input
            type="text"
            placeholder="Поиск GIF..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>
      <div className="gif-results">
        {results.map((gif) => (
          <img
            key={gif.id}
            src={gif.images.fixed_height.url}
            alt={gif.title}
            onClick={() => onSelect(gif.images.fixed_height.url)}
          />
        ))}
      </div>
    </div>
  );
};

export default GifPicker;
