const baseURL = "https://www.cheapshark.com/api/1.0";
const cache = new Map();

export function normalizeTitle(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9]/g,"");
}

async function cheapSharkRequest(path,params = {}) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${baseURL}${path}?${query}`);
  if (!response.ok) throw new Error(`CheapShark request failed: ${response.status}`);
  return response.json();
}

export async function searchGameDeals(title) {
  const key = normalizeTitle(title);
  if (!key) return [];
  if (!cache.has(key)) {
    const request = cheapSharkRequest("/deals",{title,pageSize:"60"})
      .then(deals => deals.filter(deal => normalizeTitle(deal.title) === key))
      .catch(error => {
        cache.delete(key);
        throw error;
      });
    cache.set(key,request);
  }
  return cache.get(key);
}

export async function getBestDeal(title) {
  const deals = await searchGameDeals(title);
  if (!deals.length) return null;
  return deals.reduce((best,deal) =>
    Number(deal.salePrice) < Number(best.salePrice) ? deal : best
  );
}

export async function getDealsForGames(games,onProgress = () => {}) {
  const results = new Map();
  const concurrency = 4;
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < games.length) {
      const game = games[nextIndex++];
      try {
        results.set(game.id,await getBestDeal(game.name));
      } catch(error) {
        console.error(`Deal lookup failed for ${game.name}:`,error);
        results.set(game.id,null);
      }
      completed++;
      onProgress(completed,games.length);
    }
  }

  await Promise.all(
    Array.from({length:Math.min(concurrency,games.length)},() => worker())
  );
  return results;
}

export async function getCurrentDeals(pageSize = 40) {
  return cheapSharkRequest("/deals",{
    pageSize:String(pageSize),
    sortBy:"DealRating"
  });
}

export function getDealURL(dealID) {
  return `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(dealID)}`;
}
