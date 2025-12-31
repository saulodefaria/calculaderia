/**
 * Favorites localStorage storage module
 *
 * Stores saved calculator simulations in localStorage with versioned schema.
 * Each entry contains the calculator ID and the URL search params (query string),
 * allowing locale-aware link generation at display time.
 */

export const FAVORITES_STORAGE_KEY = "calculaderia";
export const FAVORITES_SCHEMA_VERSION = 1;

export interface FavoriteEntry {
  /** Unique identifier (UUID) */
  id: string;
  /** Calculator ID (e.g. "juros-compostos", "financiamento") */
  calculatorId: string;
  /** URL search params string (e.g. "?vi=1000&tj=1.2...") */
  search: string;
  /** ISO date string of when the favorite was created */
  createdAt: string;
}

export interface FavoritesStore {
  version: number;
  entries: FavoriteEntry[];
}

/**
 * Generate a UUID v4-like identifier
 */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse stored JSON safely, returning null on failure
 */
function parseStoredData(raw: string | null): FavoritesStore | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // Validate structure
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.version !== "number" ||
      !Array.isArray(parsed.entries)
    ) {
      return null;
    }

    // Validate each entry has required fields
    const validEntries = parsed.entries.filter(
      (entry: unknown): entry is FavoriteEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as FavoriteEntry).id === "string" &&
        typeof (entry as FavoriteEntry).calculatorId === "string" &&
        typeof (entry as FavoriteEntry).search === "string" &&
        typeof (entry as FavoriteEntry).createdAt === "string"
    );

    return {
      version: parsed.version,
      entries: validEntries,
    };
  } catch {
    return null;
  }
}

/**
 * Get the default empty store
 */
function getDefaultStore(): FavoritesStore {
  return {
    version: FAVORITES_SCHEMA_VERSION,
    entries: [],
  };
}

/**
 * Save store to localStorage
 */
function saveStore(store: FavoritesStore): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    // Quota exceeded or other error
    return false;
  }
}

/**
 * Load all favorites from localStorage
 */
export function loadFavorites(): FavoriteEntry[] {
  if (!isLocalStorageAvailable()) return [];

  const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const store = parseStoredData(raw);

  if (!store) {
    return [];
  }

  return store.entries;
}

export type AddFavoriteResult =
  | { success: true; entry: FavoriteEntry }
  | { success: false; reason: "duplicate" | "storage_error" };

/**
 * Add a new favorite.
 * Deduplicates based on (calculatorId + search) combination.
 *
 * @returns Result object indicating success or failure reason
 */
export function addFavorite(calculatorId: string, search: string): AddFavoriteResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, reason: "storage_error" };
  }

  const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const store = parseStoredData(raw) ?? getDefaultStore();

  // Check for duplicate (same calculator + same search params)
  const isDuplicate = store.entries.some((entry) => entry.calculatorId === calculatorId && entry.search === search);

  if (isDuplicate) {
    return { success: false, reason: "duplicate" };
  }

  const newEntry: FavoriteEntry = {
    id: generateId(),
    calculatorId,
    search,
    createdAt: new Date().toISOString(),
  };

  store.entries.unshift(newEntry); // Add to beginning (most recent first)

  if (!saveStore(store)) {
    return { success: false, reason: "storage_error" };
  }

  return { success: true, entry: newEntry };
}

/**
 * Remove a favorite by ID
 *
 * @returns true if removed successfully, false otherwise
 */
export function removeFavorite(id: string): boolean {
  if (!isLocalStorageAvailable()) return false;

  const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const store = parseStoredData(raw);

  if (!store) return false;

  const initialLength = store.entries.length;
  store.entries = store.entries.filter((entry) => entry.id !== id);

  if (store.entries.length === initialLength) {
    // Entry not found
    return false;
  }

  return saveStore(store);
}

/**
 * Clear all favorites
 *
 * @returns true if cleared successfully, false otherwise
 */
export function clearFavorites(): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a specific simulation is already saved
 */
export function isFavorite(calculatorId: string, search: string): boolean {
  const favorites = loadFavorites();
  return favorites.some((entry) => entry.calculatorId === calculatorId && entry.search === search);
}
