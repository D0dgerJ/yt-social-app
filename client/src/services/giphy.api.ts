export type GifItem = {
  id: string;
  url: string;
  preview: string;
  width: number;
  height: number;
};

const API = "https://api.giphy.com/v1/gifs";
const KEY = import.meta.env.VITE_GIPHY_API_KEY as string;

if (!KEY) {
  console.warn("VITE_GIPHY_API_KEY is missing – GIF search will be disabled.");
}

type GiphySearchResponse = {
  data: Array<{
    id: string;
    url: string;
    images: {
      fixed_width_small?: { url: string; width: string; height: string };
      fixed_width?: { url: string; width: string; height: string };
      preview_gif?: { url: string; width: string; height: string };
      downsized_small?: { mp4: string };
      original?: { url: string; width: string; height: string };
    };
  }>;
};

export async function searchGifs(q: string, limit = 24, offset = 0): Promise<GifItem[]> {
  if (!KEY) return [];
  const url = new URL(`${API}/search`);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("lang", "en");

  const res = await fetch(url);
  if (!res.ok) throw new Error("GIPHY search failed");
  const json: GiphySearchResponse = await res.json();

  return json.data.map((g) => {
    const img = g.images.fixed_width || g.images.fixed_width_small || g.images.original!;
    return {
      id: g.id,
      url: g.images.original?.url || img?.url,
      preview: (g.images.fixed_width_small || g.images.preview_gif || g.images.fixed_width || g.images.original)!.url,
      width: Number(img?.width || 0),
      height: Number(img?.height || 0),
    };
  });
}

export async function getTrendingGifs(limit = 24, offset = 0): Promise<GifItem[]> {
  if (!KEY) return [];
  const url = new URL(`${API}/trending`);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");

  const res = await fetch(url);
  if (!res.ok) throw new Error("GIPHY trending failed");
  const json: GiphySearchResponse = await res.json();

  return json.data.map((g) => {
    const img = g.images.fixed_width || g.images.fixed_width_small || g.images.original!;
    return {
      id: g.id,
      url: g.images.original?.url || img?.url,
      preview: (g.images.fixed_width_small || g.images.preview_gif || g.images.fixed_width || g.images.original)!.url,
      width: Number(img?.width || 0),
      height: Number(img?.height || 0),
    };
  });
}