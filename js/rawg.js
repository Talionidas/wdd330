const baseURL = "https://api.rawg.io/api";
const apiKey = import.meta.env.VITE_RAWG_API_KEY;

async function rawgRequest(path, parameters = {}) {
  if (!apiKey) throw new Error("RAWG API key is missing. Check your .env file.");
  const params = new URLSearchParams({key:apiKey,...parameters});
  const response = await fetch(`${baseURL}${path}?${params}`);
  if (!response.ok) throw new Error(`RAWG request failed: ${response.status}`);
  return response.json();
}

export async function getGames(search = "", genre = "") {
  const params = {page_size:"12"};
  if (search) params.search = search;
  if (genre) params.genres = genre;
  if (!search) params.ordering = "-rating";
  const data = await rawgRequest("/games",params);
  return data.results || [];
}

export async function getGameDetails(id) {
  return rawgRequest(`/games/${encodeURIComponent(id)}`);
}
