export const ANOMALY_CACHE_KEY = "anomaly-cache";

// Settings > Notifications > Anomaly alerts. Off means the dashboard neither
// shows the alert nor asks for one. Kept per browser; on unless turned off.
const ALERTS_KEY = "sft:anomaly-alerts";

export function anomalyAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(ALERTS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAnomalyAlertsEnabled(on: boolean) {
  try {
    if (on) localStorage.removeItem(ALERTS_KEY);
    else localStorage.setItem(ALERTS_KEY, "off");
  } catch {}
}

// Drop the cached anomaly so the dashboard re-runs detection with fresh data
// after a transaction is added or removed.
export function clearAnomalyCache() {
  try {
    sessionStorage.removeItem(ANOMALY_CACHE_KEY);
  } catch {}
}
