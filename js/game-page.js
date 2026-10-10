import {getGameDetails} from "./rawg.js";
import {searchGameDeals,getDealURL} from "./cheapshark.js";
import {isFavorite,toggleFavorite} from "./favorites.js";

const container = document.querySelector("#game-details");
const status = document.querySelector("#status");
const id = new URLSearchParams(window.location.search).get("id");

function createText(tag,text,className = "") {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

async function loadGame() {
  if (!id) {
    status.textContent = "No game was selected.";
    return;
  }

  try {
    const game = await getGameDetails(id);
    document.title = `${game.name} | Find the Game`;

    const layout = document.createElement("article");
    layout.className = "details-layout";

    const image = document.createElement("img");
    image.className = "details-image";
    image.src = game.background_image || "";
    image.alt = `${game.name} artwork`;

    const information = document.createElement("div");
    information.className = "details-content";

    const title = createText("h1",game.name);
    const release = createText("p",`Released: ${game.released || "Unknown"}`);
    const rating = createText("p",`Rating: ${game.rating ?? "N/A"} / 5`);
    const genres = createText("p",`Genres: ${game.genres?.map(g => g.name).join(", ") || "Unknown"}`);
    const platforms = createText("p",`Platforms: ${game.platforms?.map(p => p.platform.name).join(", ") || "Unknown"}`);
    const descriptionTitle = createText("h2","Description");
    const description = createText("p",game.description_raw || "No description available.");

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "favorite-button";
    favoriteButton.type = "button";

    function updateFavorite() {
      favoriteButton.textContent = isFavorite(game.id) ? "♥ Remove Favorite" : "♡ Add to Favorites";
      favoriteButton.setAttribute("aria-pressed",String(isFavorite(game.id)));
    }

    favoriteButton.addEventListener("click",() => {
      toggleFavorite(game);
      updateFavorite();
    });
    updateFavorite();

    const dealsTitle = createText("h2","Available Deals");
    const dealsContainer = document.createElement("div");
    dealsContainer.className = "details-deals";
    dealsContainer.textContent = "Checking CheapShark prices...";

    information.append(title,release,rating,genres,platforms,favoriteButton,
      descriptionTitle,description,dealsTitle,dealsContainer);
    layout.append(image,information);
    container.append(layout);
    status.textContent = "";

    try {
      const deals = await searchGameDeals(game.name);
      dealsContainer.replaceChildren();

      if (!deals.length) {
        dealsContainer.textContent = "No verified deals found for this game.";
        return;
      }

      const sorted = [...deals].sort((a,b) => Number(a.salePrice) - Number(b.salePrice));
      sorted.slice(0,10).forEach(deal => {
        const item = document.createElement("div");
        item.className = "deal-row";

        const price = createText("span",
          `$${Number(deal.normalPrice).toFixed(2)} → $${Number(deal.salePrice).toFixed(2)} USD`
        );
        const link = document.createElement("a");
        link.className = "button-link";
        link.href = getDealURL(deal.dealID);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View Deal";

        item.append(price,link);
        dealsContainer.append(item);
      });
    } catch(error) {
      console.error(error);
      dealsContainer.textContent = "Prices are temporarily unavailable.";
    }
  } catch(error) {
    console.error(error);
    status.textContent = `Unable to load game details: ${error.message}`;
  }
}

loadGame();
