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
    const normalPrice = Number(deal.normalPrice);
    const salePrice = Number(deal.salePrice);
    const discount = normalPrice > 0
      ? Math.max(0,Math.min(100,Math.round((1 - salePrice / normalPrice) * 100)))
      : 0;

    const original = document.createElement("span");
    original.className = "original-price";
    original.textContent = `$${normalPrice.toFixed(2)}`;

    const sale = document.createElement("span");
    sale.className = "sale-price";
    sale.textContent = `$${salePrice.toFixed(2)} USD`;

    price.append(original,sale);

    if (discount > 0) {
      const badge = document.createElement("span");
      badge.className = "discount-badge";

      if (discount < 25) {
        badge.classList.add("discount-low");
      } else if (discount < 50) {
        badge.classList.add("discount-medium");
      } else if (discount < 75) {
        badge.classList.add("discount-high");
      } else {
        badge.classList.add("discount-extreme");
      }

      badge.textContent = `-${discount}%`;
      price.append(badge);
    }
  } else {
    price.textContent = "Price not available or not checked";
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
