const storageKey = "findTheGameFavorites";

export function getFavorites() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(data) ? data : [];
  } catch(error) {
    console.error("Could not read favorites:",error);
    return [];
  }
}

export function isFavorite(id) {
  return getFavorites().some(game => String(game.id) === String(id));
}

export function addFavorite(game) {
  const favorites = getFavorites();
  if (isFavorite(game.id)) return;
  favorites.push({
    id:game.id,
    name:game.name,
    background_image:game.background_image || "",
    rating:game.rating ?? null,
    released:game.released || "",
    genres:game.genres || []
  });
  localStorage.setItem(storageKey,JSON.stringify(favorites));
}

export function removeFavorite(id) {
  const favorites = getFavorites().filter(game => String(game.id) !== String(id));
  localStorage.setItem(storageKey,JSON.stringify(favorites));
}

export function toggleFavorite(game) {
  if (isFavorite(game.id)) {
    removeFavorite(game.id);
    return false;
  }
  addFavorite(game);
  return true;
}
