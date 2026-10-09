import { getGames } from "./rawg.js";
import { searchGameDeals } from "./cheapshark.js";
import { displayGames, findBestDeal } from "./games.js";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const genreFilter = document.querySelector("#genre-filter");
const sortFilter = document.querySelector("#sort-filter");
const status = document.querySelector("#status");

let currentGames = [];
let currentDeals = [];
let requestNumber = 0;

document.querySelector("#year").textContent = new Date().getFullYear();

async function loadGames() {
  const request = ++requestNumber;
  const search = searchInput.value.trim();
  const genre = genreFilter.value === "all" ? "" : genreFilter.value;

  status.textContent = "Loading games...";
  document.querySelector("#game-container").replaceChildren();

  try {
    const games = await getGames(search, genre);
    let deals = [];

    if (search) {
      try {
        deals = await searchGameDeals(search);
      } catch (error) {
        console.error("CheapShark error:", error);
        status.textContent = "Games loaded, but deal prices are temporarily unavailable.";
      }
    }

    if (request !== requestNumber) return;

    currentGames = games;
    currentDeals = deals;
    renderSortedGames();

    if (status.textContent === "Loading games...") {
      status.textContent = `${games.length} games displayed.`;
    }
  } catch (error) {
    if (request !== requestNumber) return;
    console.error(error);
    status.textContent = `Unable to load games: ${error.message}`;
  }
}

function renderSortedGames() {
  const games = [...currentGames];
  const sort = sortFilter.value;

  if (sort === "rating") {
    games.sort((a, b) => b.rating - a.rating);
  } else if (sort === "name") {
    games.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "price") {
    games.sort((a, b) => {
      const priceA = findBestDeal(a, currentDeals);
      const priceB = findBestDeal(b, currentDeals);
      return (priceA ? Number(priceA.salePrice) : Infinity) -
        (priceB ? Number(priceB.salePrice) : Infinity);
    });
  }

  displayGames(games, currentDeals);
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  loadGames();
});

genreFilter.addEventListener("change", loadGames);
sortFilter.addEventListener("change", renderSortedGames);

loadGames();