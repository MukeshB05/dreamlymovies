import { site_name } from "../../config.js";

const SEARCH_HISTORY_KEY = `${site_name}_search_history`;
const MAX_HISTORY_ITEMS = 10;

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    let history = getSearchHistory();
    history = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
    history.unshift(query.trim());
    history = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Silently fail
  }
}

export function removeFromSearchHistory(query: string): void {
  if (typeof window === 'undefined') return;
  try {
    let history = getSearchHistory();
    history = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Silently fail
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Silently fail
  }
}
