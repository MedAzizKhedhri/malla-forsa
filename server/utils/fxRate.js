// Caches EUR->TND and USD->TND exchange rates so we don't hit the FX API
// on every request. Refreshed once per day; a stale cached rate is served
// (with a warning) if the API is temporarily unreachable.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = {
  EUR: { rate: null, fetchedAt: 0 },
  USD: { rate: null, fetchedAt: 0 },
};

async function fetchLiveRate(currency) {
  const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
  if (!res.ok) throw new Error(`FX API responded with status ${res.status}`);
  const data = await res.json();
  const rate = data?.rates?.TND;
  if (data?.result !== 'success' || typeof rate !== 'number') {
    throw new Error('FX API response missing a usable TND rate');
  }
  return rate;
}

// Returns the EUR/USD -> TND rate, fetching live if the cache is cold or
// stale. Falls back to a stale cached value (if any) on API failure.
async function getRate(currency) {
  const entry = cache[currency];
  if (!entry) throw new Error(`Unsupported currency: ${currency}`);

  if (entry.rate !== null && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.rate;
  }

  try {
    const rate = await fetchLiveRate(currency);
    cache[currency] = { rate, fetchedAt: Date.now() };
    return rate;
  } catch (error) {
    if (entry.rate !== null) {
      console.warn(`FX API failed, serving stale ${currency}->TND rate:`, error.message);
      return entry.rate;
    }
    throw error;
  }
}

// Non-blocking accessor for read paths that shouldn't wait on a network call.
// Returns null if no rate has ever been fetched yet.
function getCachedRateSync(currency) {
  return cache[currency]?.rate ?? null;
}

module.exports = { getRate, getCachedRateSync };
