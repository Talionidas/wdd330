const baseURL = "https://www.cheapshark.com/api/1.0";

export async function searchGameDeals(title) {
  const params = new URLSearchParams({
    title,
    pageSize: "20"
  });

  const response = await fetch(`${baseURL}/deals?${params}`);

  if (!response.ok) {
    throw new Error(`CheapShark request failed: ${response.status}`);
  }

  return response.json();
}

export async function getCurrentDeals(pageSize = 20) {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    sortBy: "Deal Rating"
  });

  const response = await fetch(`${baseURL}/deals?${params}`);

  if (!response.ok) {
    throw new Error(`Could not load deals: ${response.status}`);
  }

  return response.json();
}