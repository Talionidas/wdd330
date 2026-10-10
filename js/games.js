import {isFavorite,toggleFavorite} from "./favorites.js";
import {getDealURL} from "./cheapshark.js";

export function createGameCard(game,deal = null) {
  const card = document.createElement("article");
  card.className = "game-card";

  const imageLink = document.createElement("a");
  imageLink.href = `/game.html?id=${encodeURIComponent(game.id)}`;

  const image = document.createElement("img");
  image.src = game.background_image || "";
  image.alt = `${game.name} artwork`;
  image.loading = "lazy";
  image.onerror = () => {
    image.onerror = null;
    image.removeAttribute("src");
    image.alt = "Artwork unavailable";
  };
  imageLink.append(image);

  const content = document.createElement("div");
  content.className = "game-card-content";

  const title = document.createElement("h3");
  const titleLink = document.createElement("a");
  titleLink.href = imageLink.href;
  titleLink.textContent = game.name;
  title.append(titleLink);

  const rating = document.createElement("p");
  rating.textContent = `Rating: ${game.rating ?? "N/A"} / 5`;

  const genres = document.createElement("p");
  genres.textContent = `Genre: ${game.genres?.map(g => g.name).join(", ") || "Unknown"}`;

  const price = document.createElement("p");
  price.className = "game-price";
  if (deal) {
    price.textContent = `$${Number(deal.normalPrice).toFixed(2)} → $${Number(deal.salePrice).toFixed(2)} USD`;
  } else {
    price.textContent = "No verified deal found";
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const details = document.createElement("a");
  details.className = "button-link";
  details.href = imageLink.href;
  details.textContent = "Details";

  const favorite = document.createElement("button");
  favorite.type = "button";
  favorite.className = "favorite-button";

  function updateFavoriteButton() {
    favorite.textContent = isFavorite(game.id) ? "♥ Saved" : "♡ Favorite";
    favorite.setAttribute("aria-pressed",String(isFavorite(game.id)));
  }

  favorite.addEventListener("click",() => {
    toggleFavorite(game);
    updateFavoriteButton();
    document.dispatchEvent(new Event("favoritesChanged"));
  });

  updateFavoriteButton();
  actions.append(details,favorite);

  if (deal) {
    const dealLink = document.createElement("a");
    dealLink.className = "button-link deal-link";
    dealLink.href = getDealURL(deal.dealID);
    dealLink.target = "_blank";
    dealLink.rel = "noopener noreferrer";
    dealLink.textContent = "View Deal";
    actions.append(dealLink);
  }

  content.append(title,rating,genres,price,actions);
  card.append(imageLink,content);
  return card;
}

export function displayGames(games,deals = new Map(),selector = "#game-container") {
  const container = document.querySelector(selector);
  if (!container) return;
  container.replaceChildren();

  if (!games.length) {
    container.textContent = "No games found.";
    return;
  }

  games.forEach(game => {
    container.append(createGameCard(game,deals.get(game.id) || null));
  });
}
