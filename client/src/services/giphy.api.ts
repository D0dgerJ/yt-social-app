import { env } from "../config/env";

const BASE_URL = "https://api.giphy.com/v1/gifs";

export type GifItem = {
  id: string;
  title: string;
  preview: string;
  url: string;
};

function requireGiphyApiKey(): string {
  if (!env.GIPHY_API_KEY) {
    throw new Error("VITE_GIPHY_API_KEY is not set");
  }

  return env.GIPHY_API_KEY;
}

function mapGif(item: any): GifItem {
  const preview =
    item?.images?.fixed_width?.url ||
    item?.images?.downsized_medium?.url ||
    item?.images?.preview_gif?.url ||
    item?.images?.original?.url ||
    "";

  const url =
    item?.images?.original?.url ||
    item?.images?.fixed_width?.url ||
    item?.images?.downsized_medium?.url ||
    "";

  return {
    id: String(item?.id ?? ""),
    title: String(item?.title ?? "GIF"),
    preview,
    url,
  };
}

function normalizeGifResponse(payload: any): GifItem[] {
  const raw = Array.isArray(payload?.data) ? payload.data : [];
  return raw
    .map(mapGif)
    .filter((gif: GifItem) => Boolean(gif.id && gif.preview && gif.url));
}

export async function getTrendingGifs(
  limit = 20,
  offset = 0
): Promise<GifItem[]> {
  const apiKey = requireGiphyApiKey();

  const url = new URL(`${BASE_URL}/trending`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Failed to fetch trending GIFs");
  }

  const data = await response.json();
  return normalizeGifResponse(data);
}

export async function searchGifs(
  query: string,
  limit = 20,
  offset = 0
): Promise<GifItem[]> {
  const apiKey = requireGiphyApiKey();

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Failed to search GIFs");
  }

  const data = await response.json();
  return normalizeGifResponse(data);
}