import { env } from "../config/env";

const BASE_URL = "https://api.giphy.com/v1/gifs";

function requireGiphyApiKey(): string {
  if (!env.GIPHY_API_KEY) {
    throw new Error("VITE_GIPHY_API_KEY is not set");
  }

  return env.GIPHY_API_KEY;
}

export async function getTrendingGifs(limit = 20, offset = 0) {
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
  return data.data;
}

export async function searchGifs(query: string, limit = 20, offset = 0) {
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
  return data.data;
}