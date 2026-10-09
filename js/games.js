function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findBestDeal(game, deals) {
  const gameTitle = normalizeTitle(game.name);

  const matches = deals.filter(deal =>
    normalizeTitle(deal.title) === gameTitle
  );

  if (matches.length === 0) return null;

  return matches.reduce((best, deal) =>
    Number(deal.salePrice) < Number(best.salePrice) ? deal : best
  );
}

export function displayGames(games, deals = []) {
  const container = document.querySelector("#game-container");
  container.replaceChildren();

  if (games.length === 0) {
    container.textContent = "No games found. Try another search.";
    return;
  }

  games.forEach(game => {
    const deal = findBestDeal(game, deals);
    const card = document.createElement("article");
    card.className = "game-card";

    const image = document.createElement("img");
    image.src = game.background_image || "/images/placeholder.svg";
    image.alt = `${game.name} cover artwork`;
    image.loading = "lazy";
    image.onerror = () => {
      image.onerror = null;
      image.removeAttribute("src");
      image.alt = "Game artwork unavailable";
    };

    const content = document.createElement("div");
    content.className = "game-card-content";

    const title = document.createElement("h3");
    title.textContent = game.name;

    const rating = document.createElement("p");
    rating.textContent = `Rating: ${game.rating ?? "N/A"} / 5`;

    const genres = document.createElement("p");
    genres.textContent = `Genre: ${game.genres?.map(g => g.name).join(", ") || "Unknown"}`;

    const price = document.createElement("p");
    price.className = "game-price";

    if (deal) {
      const normal = Number(deal.normalPrice);
      const sale = Number(deal.salePrice);
      price.textContent = `$${normal.toFixed(2)} → $${sale.toFixed(2)}`;

      const link = document.createElement("a");
      link.className = "button-link";
      link.href = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(deal.dealID)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View Deal";
      content.append(title, rating, genres, price, link);
    } else {
      price.textContent = "No matching deal found";
      content.append(title, rating, genres, price);
    }

    card.append(image, content);
    container.appendChild(card);
  });
}