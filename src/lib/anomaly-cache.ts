export const ANOMALY_CACHE_KEY = "anomaly-cache";

// Drop the cached anomaly so the dashboard re-runs detection with fresh data
// after a transaction is added or removed.
export function clearAnomalyCache() {
  try {
    sessionStorage.removeItem(ANOMALY_CACHE_KEY);
  } catch {}
}
