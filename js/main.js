import {getGames} from "./rawg.js";
import {getDealsForGames} from "./cheapshark.js";
import {displayGames} from "./games.js";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const genreFilter = document.querySelector("#genre-filter");
const sortFilter = document.querySelector("#sort-filter");
const status = document.querySelector("#status");

let currentGames = [];
let currentDeals = new Map();
let requestNumber = 0;

document.querySelector("#year").textContent = new Date().getFullYear();

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

    status.textContent = `Loaded ${games.length} games. Checking prices...`;

    const deals = await getDealsForGames(games,(completed,total) => {
      if (request === requestNumber) {
        status.textContent = `Checking deals: ${completed}/${total}`;
      }
    });

    if (request !== requestNumber) return;
    currentDeals = deals;
    renderSortedGames();

    const matches = [...deals.values()].filter(Boolean).length;
    status.textContent = `${games.length} games displayed. ${matches} verified deal matches.`;
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

loadGames();
