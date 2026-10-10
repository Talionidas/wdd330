const baseURL = "https://www.cheapshark.com/api/1.0";
const cachePrefix = "ftg-cheapshark-v3:";
const cooldownKey = "ftg-cheapshark-cooldown";
const cacheDuration = 60 * 60 * 1000;
const fallbackCooldown = 15 * 60 * 1000;
const pendingRequests = new Map();

export function normalizeTitle(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9]/g,"");
}

function readCache(key) {
  try {
    const stored = sessionStorage.getItem(cachePrefix + key);
    if (!stored) return null;
    const entry = JSON.parse(stored);
    if (Date.now() >= entry.expires) {
      sessionStorage.removeItem(cachePrefix + key);
      return null;
    }
    return entry.data;
  } catch(error) {
    return null;
  }
}

function saveCache(key,data) {
  try {
    sessionStorage.setItem(cachePrefix + key,JSON.stringify({
      data,
      expires:Date.now() + cacheDuration
    }));
  } catch(error) {
    console.warn("Could not save CheapShark cache:",error);
  }
}

function getCooldown() {
  try {
    return Number(sessionStorage.getItem(cooldownKey)) || 0;
  } catch(error) {
    return 0;
  }
}

function setCooldown(milliseconds) {
  try {
    const until = Date.now() + milliseconds;
    sessionStorage.setItem(cooldownKey,String(Math.max(getCooldown(),until)));
  } catch(error) {
    console.warn("Could not save API cooldown:",error);
  }
}

export function getCooldownMinutes() {
  return Math.max(0,Math.ceil((getCooldown() - Date.now()) / 60000));
}

async function cheapSharkRequest(path,params = {}) {
  const query = new URLSearchParams(params);
  const key = `${path}?${query}`;
  const cached = readCache(key);
  if (cached !== null) return cached;

  if (Date.now() < getCooldown()) {
    throw new Error(`CheapShark is temporarily unavailable. Try again in approximately ${getCooldownMinutes()} minute(s).`);
  }

  if (pendingRequests.has(key)) return pendingRequests.get(key);

  const request = (async () => {
    try {
      const response = await fetch(`${baseURL}${path}?${query}`);

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const seconds = Number(retryAfter);
        const retryDate = Date.parse(retryAfter || "");
        let wait = fallbackCooldown;

        if (retryAfter && Number.isFinite(seconds) && seconds >= 0) {
          wait = seconds * 1000;
        } else if (Number.isFinite(retryDate)) {
          wait = Math.max(0,retryDate - Date.now());
        }

        setCooldown(Math.max(wait,60000));
        throw new Error("CheapShark rate limit reached. Please try again later.");
      }

      if (!response.ok) {
        throw new Error(`CheapShark request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data && !Array.isArray(data) && data.error) {
        setCooldown(fallbackCooldown);
        throw new Error(`CheapShark: ${data.error}`);
      }

      if (!Array.isArray(data)) {
        throw new Error("CheapShark returned an unexpected response.");
      }

      saveCache(key,data);
      return data;
    } catch(error) {
      if (error instanceof TypeError) {
        setCooldown(fallbackCooldown);
        throw new Error("CheapShark could not be reached. It may be rate-limited or experiencing a network problem.");
      }
      throw error;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key,request);
  return request;
}

export async function searchDealsByQuery(query) {
  if (!String(query || "").trim()) return [];
  return cheapSharkRequest("/deals",{
    title:query,
    pageSize:"60"
  });
}

export async function searchGameDeals(title) {
  const deals = await searchDealsByQuery(title);
  const normalized = normalizeTitle(title);
  return deals.filter(deal => normalizeTitle(deal.title) === normalized);
}

export function findBestDeal(game,deals) {
  const normalized = normalizeTitle(game.name);
  const matches = deals.filter(deal => normalizeTitle(deal.title) === normalized);
  if (!matches.length) return null;
  return matches.reduce((best,deal) =>
    Number(deal.salePrice) < Number(best.salePrice) ? deal : best
  );
}

export async function getBestDeal(title) {
  const deals = await searchGameDeals(title);
  if (!deals.length) return null;
  return deals.reduce((best,deal) =>
    Number(deal.salePrice) < Number(best.salePrice) ? deal : best
  );
}

export async function getCurrentDeals(pageSize = 40) {
  return cheapSharkRequest("/deals",{
    pageSize:String(Math.min(pageSize,60)),
    sortBy:"DealRating"
  });
}

export function getDealURL(dealID) {
  return `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(dealID)}`;
}
