import {getCurrentDeals,getDealURL} from "./cheapshark.js";

const container = document.querySelector("#deals-container");
const status = document.querySelector("#deals-status");
const searchInput = document.querySelector("#deal-search");
const sortFilter = document.querySelector("#deal-sort");
let currentDeals = [];

function displayDeals() {
  const search = searchInput.value.trim().toLowerCase();
  const deals = currentDeals.filter(deal => deal.title.toLowerCase().includes(search));

  if (sortFilter.value === "discount") {
    deals.sort((a,b) => Number(b.savings) - Number(a.savings));
  } else if (sortFilter.value === "price") {
    deals.sort((a,b) => Number(a.salePrice) - Number(b.salePrice));
  } else if (sortFilter.value === "name") {
    deals.sort((a,b) => a.title.localeCompare(b.title));
  } else {
    deals.sort((a,b) => Number(b.dealRating) - Number(a.dealRating));
  }

  container.replaceChildren();
  status.textContent = `${deals.length} deals displayed.`;

  if (!deals.length) {
    container.textContent = "No matching deals found.";
    return;
  }

  deals.forEach(deal => {
    const card = document.createElement("article");
    card.className = "game-card";

    const image = document.createElement("img");
    image.src = deal.thumb || "";
    image.alt = `${deal.title} artwork`;
    image.loading = "lazy";

    const content = document.createElement("div");
    content.className = "game-card-content";

    const title = document.createElement("h3");
    title.textContent = deal.title;

    const price = document.createElement("p");
    price.className = "game-price";
    price.textContent = `$${Number(deal.normalPrice).toFixed(2)} → $${Number(deal.salePrice).toFixed(2)} USD`;

    const discount = document.createElement("p");
    discount.textContent = `Save ${Math.round(Number(deal.savings))}%`;

    const link = document.createElement("a");
    link.className = "button-link";
    link.href = getDealURL(deal.dealID);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View Deal";

    content.append(title,price,discount,link);
    card.append(image,content);
    container.append(card);
  });
}

async function loadDeals() {
  try {
    currentDeals = await getCurrentDeals(60);
    displayDeals();
  } catch(error) {
    console.error(error);
    status.textContent = `Unable to load deals: ${error.message}`;
  }
}

searchInput.addEventListener("input",displayDeals);
sortFilter.addEventListener("change",displayDeals);
loadDeals();
