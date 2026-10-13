import {getGames} from "./rawg.js";
import {getCurrentDeals,searchDealsByQuery,findBestDeal,getDealURL,normalizeTitle} from "./cheapshark.js";
import {displayGames} from "./games.js";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const genreFilter = document.querySelector("#genre-filter");
const sortFilter = document.querySelector("#sort-filter");
const status = document.querySelector("#status");
const featuredStatus = document.querySelector("#featured-status");
const featuredContainer = document.querySelector("#featured-container");

let currentGames = [];
let currentDeals = new Map();
let featuredDeals = [];
let requestNumber = 0;

document.querySelector("#year").textContent = new Date().getFullYear();

function calculateDiscount(deal) {
  const normal = Number(deal.normalPrice);
  const sale = Number(deal.salePrice);
  if (!Number.isFinite(normal) || !Number.isFinite(sale) || normal <= 0) return 0;
  return Math.max(0,Math.min(100,Math.round((1 - sale / normal) * 100)));
}

function createDiscountBadge(discount) {
  const badge = document.createElement("span");
  badge.className = "discount-badge";

  if (discount < 25) badge.classList.add("discount-low");
  else if (discount < 50) badge.classList.add("discount-medium");
  else if (discount < 75) badge.classList.add("discount-high");
  else badge.classList.add("discount-extreme");

  badge.textContent = `-${discount}%`;
  return badge;
}

function createFeaturedCard(deal) {
  const card = document.createElement("article");
  card.className = "game-card featured-card";

  const image = document.createElement("img");
  image.className = "featured-image";
  image.src = deal.thumb || "";
  image.alt = `${deal.title} cover artwork`;
  image.loading = "lazy";
  image.onerror = () => {
    image.onerror = null;
    image.removeAttribute("src");
    image.alt = "Artwork unavailable";
  };

  const content = document.createElement("div");
  content.className = "game-card-content";

  const title = document.createElement("h3");
  title.textContent = deal.title;

  const price = document.createElement("p");
  price.className = "game-price";

  const normalPrice = Number(deal.normalPrice);
  const salePrice = Number(deal.salePrice);
  const discount = calculateDiscount(deal);

  const original = document.createElement("span");
  original.className = "original-price";
  original.textContent = `$${normalPrice.toFixed(2)}`;

  const sale = document.createElement("span");
  sale.className = "sale-price";
  sale.textContent = `$${salePrice.toFixed(2)} USD`;

  price.append(original,sale);
  if (discount > 0) price.append(createDiscountBadge(discount));

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const link = document.createElement("a");
  link.className = "button-link deal-link";
  link.href = getDealURL(deal.dealID);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View Deal";

  actions.append(link);
  content.append(title,price,actions);
  card.append(image,content);
  return card;
}

function displayFeaturedDeals(deals) {
  featuredContainer.replaceChildren();

  const unique = new Map();

  for (const deal of deals) {
    const key = normalizeTitle(deal.title);
    const normal = Number(deal.normalPrice);
    const sale = Number(deal.salePrice);

    if (!key || !deal.dealID || !Number.isFinite(normal) ||
        !Number.isFinite(sale) || normal <= 0 || sale < 0 ||
        sale >= normal) continue;

    const previous = unique.get(key);
    if (!previous || sale < Number(previous.salePrice)) {
      unique.set(key,deal);
    }
  }

  featuredDeals = [...unique.values()]
    .sort((a,b) => {
      const discountDifference = calculateDiscount(b) - calculateDiscount(a);
      return discountDifference || Number(a.salePrice) - Number(b.salePrice);
    })
    .slice(0,3);

  featuredDeals.forEach(deal => {
    featuredContainer.append(createFeaturedCard(deal));
  });

  featuredStatus.textContent = featuredDeals.length
    ? `${featuredDeals.length} featured discounts selected from current CheapShark offers. Prices in USD.`
    : "No featured discounts are available right now.";
}

async function loadFeaturedDeals() {
  try {
    const deals = await getCurrentDeals(60);
    displayFeaturedDeals(deals);
  } catch(error) {
    console.error("Featured deals failed:",error);
    featuredStatus.textContent = `Featured deals temporarily unavailable: ${error.message}`;
  }
}

async function loadGames() {
  const request = ++requestNumber;
  const search = searchInput.value.trim();
  const genre = genreFilter.value === "all" ? "" : genreFilter.value;

  status.textContent = "Loading games...";
  document.querySelector("#game-container").replaceChildren();

  try {
    const games = await getGames(search,genre);
    if (request !== requestNumber) return;

    currentGames = games;
    currentDeals = new Map();
    renderSortedGames();

    if (!games.length) {
      status.textContent = "No matching games found.";
      return;
    }

    status.textContent = `${games.length} games loaded. Checking available prices...`;

    try {
      const deals = search
        ? await searchDealsByQuery(search)
        : await getCurrentDeals(60);

      if (request !== requestNumber) return;

      games.forEach(game => {
        currentDeals.set(game.id,findBestDeal(game,deals));
      });

      renderSortedGames();

      const matches = [...currentDeals.values()].filter(Boolean).length;
      status.textContent = `${games.length} games displayed. ${matches} verified price matches. See Featured Deals above for current discounts.`;
    } catch(error) {
      if (request !== requestNumber) return;
      console.error("Price lookup failed:",error);
      status.textContent = `${games.length} games displayed. Prices temporarily unavailable: ${error.message}`;
    }
  } catch(error) {
    if (request !== requestNumber) return;
    console.error(error);
    status.textContent = `Unable to load games: ${error.message}`;
  }
}

function renderSortedGames() {
  const games = [...currentGames];
  const sort = sortFilter.value;

  if (sort === "rating") {
    games.sort((a,b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === "name") {
    games.sort((a,b) => a.name.localeCompare(b.name));
  } else if (sort === "price") {
    games.sort((a,b) => {
      const aDeal = currentDeals.get(a.id);
      const bDeal = currentDeals.get(b.id);
      return (aDeal ? Number(aDeal.salePrice) : Infinity) -
        (bDeal ? Number(bDeal.salePrice) : Infinity);
    });
  }

  displayGames(games,currentDeals);
}

searchForm.addEventListener("submit",event => {
  event.preventDefault();
  loadGames();
});

genreFilter.addEventListener("change",loadGames);
sortFilter.addEventListener("change",renderSortedGames);
document.addEventListener("favoritesChanged",renderSortedGames);

loadFeaturedDeals();
loadGames();
