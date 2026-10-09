const baseURL = "https://api.rawg.io/api";
const apiKey = import.meta.env.VITE_RAWG_API_KEY;

export async function getGames(search = "", genre = "") {
  if (!apiKey) {
    throw new Error("RAWG API key is missing. Check your .env file.");
  }

  const params = new URLSearchParams({
    key: apiKey,
    page_size: "20"
  });

  if (search) params.set("search", search);
  if (genre) params.set("genres", genre);
  if (!search) params.set("ordering", "-rating");

  const response = await fetch(`${baseURL}/games?${params}`);

  if (!response.ok) {
    throw new Error(`RAWG request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

export async function getGameDetails(id) {
  const response = await fetch(`${baseURL}/games/${encodeURIComponent(id)}?key=${apiKey}`);

  if (!response.ok) {
    throw new Error(`Could not load game details: ${response.status}`);
  }

  return response.json();
}