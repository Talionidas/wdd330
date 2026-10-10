import {getFavorites} from "./favorites.js";
import {displayGames} from "./games.js";

const status = document.querySelector("#favorites-status");

function renderFavorites() {
  const favorites = getFavorites();
  status.textContent = favorites.length ?
    `${favorites.length} saved game${favorites.length === 1 ? "" : "s"}.` :
    "You haven't saved any games yet. Browse the homepage to add favorites.";

  displayGames(favorites,new Map(),"#favorites-container");
}

document.addEventListener("favoritesChanged",renderFavorites);
window.addEventListener("storage",renderFavorites);
renderFavorites();
