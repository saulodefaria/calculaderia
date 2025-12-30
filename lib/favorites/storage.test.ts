import { describe, it, expect, beforeEach } from "vitest";
import {
  FAVORITES_STORAGE_KEY,
  loadFavorites,
  addFavorite,
  removeFavorite,
  clearFavorites,
  isFavorite,
  type FavoriteEntry,
} from "./storage";

// Simple in-memory localStorage mock
let store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

// Replace global localStorage with mock
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("favorites storage", () => {
  beforeEach(() => {
    store = {};
  });

  describe("loadFavorites", () => {
    it("returns empty array when no favorites exist", () => {
      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it("returns stored favorites", () => {
      const entry: FavoriteEntry = {
        id: "test-id",
        calculatorId: "juros-compostos",
        search: "?vi=1000&tj=1.2",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      store[FAVORITES_STORAGE_KEY] = JSON.stringify({ version: 1, entries: [entry] });

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0]).toEqual(entry);
    });

    it("handles corrupted JSON gracefully", () => {
      store[FAVORITES_STORAGE_KEY] = "not valid json{{{";

      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it("handles invalid schema gracefully", () => {
      store[FAVORITES_STORAGE_KEY] = JSON.stringify({ invalid: "schema" });

      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it("filters out entries with missing required fields", () => {
      const validEntry: FavoriteEntry = {
        id: "valid-id",
        calculatorId: "juros-compostos",
        search: "?vi=1000",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      const invalidEntry = {
        id: "invalid-id",
        // missing calculatorId
        search: "?vi=1000",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      store[FAVORITES_STORAGE_KEY] = JSON.stringify({ version: 1, entries: [validEntry, invalidEntry] });

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toBe("valid-id");
    });
  });

  describe("addFavorite", () => {
    it("adds a new favorite successfully", () => {
      const result = addFavorite("juros-compostos", "?vi=1000&tj=1.2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.entry.calculatorId).toBe("juros-compostos");
        expect(result.entry.search).toBe("?vi=1000&tj=1.2");
        expect(result.entry.id).toBeTruthy();
        expect(result.entry.createdAt).toBeTruthy();
      }

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(1);
    });

    it("detects duplicates", () => {
      // Add first time
      addFavorite("juros-compostos", "?vi=1000&tj=1.2");

      // Try to add same again
      const result = addFavorite("juros-compostos", "?vi=1000&tj=1.2");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe("duplicate");
      }

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(1);
    });

    it("allows same calculator with different params", () => {
      addFavorite("juros-compostos", "?vi=1000&tj=1.2");
      const result = addFavorite("juros-compostos", "?vi=2000&tj=1.5");

      expect(result.success).toBe(true);

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(2);
    });

    it("allows same params for different calculators", () => {
      addFavorite("juros-compostos", "?vi=1000");
      const result = addFavorite("financiamento", "?vi=1000");

      expect(result.success).toBe(true);

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(2);
    });

    it("adds new entries to the beginning (most recent first)", () => {
      addFavorite("juros-compostos", "?first=1");
      addFavorite("financiamento", "?second=2");

      const favorites = loadFavorites();
      expect(favorites[0].search).toBe("?second=2");
      expect(favorites[1].search).toBe("?first=1");
    });
  });

  describe("removeFavorite", () => {
    it("removes an existing favorite", () => {
      const result = addFavorite("juros-compostos", "?vi=1000");
      if (!result.success) throw new Error("Failed to add favorite");

      const removed = removeFavorite(result.entry.id);
      expect(removed).toBe(true);

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(0);
    });

    it("returns false when removing non-existent favorite", () => {
      const removed = removeFavorite("non-existent-id");
      expect(removed).toBe(false);
    });

    it("only removes the specified favorite", () => {
      const result1 = addFavorite("juros-compostos", "?first=1");
      const result2 = addFavorite("financiamento", "?second=2");

      if (!result1.success || !result2.success) throw new Error("Failed to add favorites");

      removeFavorite(result1.entry.id);

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].search).toBe("?second=2");
    });
  });

  describe("clearFavorites", () => {
    it("removes all favorites", () => {
      addFavorite("juros-compostos", "?first=1");
      addFavorite("financiamento", "?second=2");
      addFavorite("consorcio", "?third=3");

      const cleared = clearFavorites();
      expect(cleared).toBe(true);

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(0);
    });

    it("works when there are no favorites", () => {
      const cleared = clearFavorites();
      expect(cleared).toBe(true);

      const favorites = loadFavorites();
      expect(favorites).toHaveLength(0);
    });
  });

  describe("isFavorite", () => {
    it("returns true for existing favorite", () => {
      addFavorite("juros-compostos", "?vi=1000");

      const result = isFavorite("juros-compostos", "?vi=1000");
      expect(result).toBe(true);
    });

    it("returns false for non-existent favorite", () => {
      const result = isFavorite("juros-compostos", "?vi=1000");
      expect(result).toBe(false);
    });

    it("returns false when calculator matches but params differ", () => {
      addFavorite("juros-compostos", "?vi=1000");

      const result = isFavorite("juros-compostos", "?vi=2000");
      expect(result).toBe(false);
    });

    it("returns false when params match but calculator differs", () => {
      addFavorite("juros-compostos", "?vi=1000");

      const result = isFavorite("financiamento", "?vi=1000");
      expect(result).toBe(false);
    });
  });

  describe("corrupted data recovery", () => {
    it("recovers from null entries array", () => {
      store[FAVORITES_STORAGE_KEY] = JSON.stringify({ version: 1, entries: null });

      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it("recovers from non-array entries", () => {
      store[FAVORITES_STORAGE_KEY] = JSON.stringify({ version: 1, entries: "not an array" });

      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it("recovers from missing version", () => {
      const entry: FavoriteEntry = {
        id: "test-id",
        calculatorId: "juros-compostos",
        search: "?vi=1000",
        createdAt: "2024-01-01T00:00:00.000Z",
      };

      store[FAVORITES_STORAGE_KEY] = JSON.stringify({ entries: [entry] });

      const favorites = loadFavorites();
      // Should fail validation because version is missing
      expect(favorites).toEqual([]);
    });

    it("can add favorites after corrupted data is cleared", () => {
      // Start with corrupted data
      store[FAVORITES_STORAGE_KEY] = "corrupted{{{";

      // Loading should return empty
      expect(loadFavorites()).toEqual([]);

      // Adding should work (creates fresh store)
      const result = addFavorite("juros-compostos", "?vi=1000");
      expect(result.success).toBe(true);

      // New favorite should be retrievable
      const favorites = loadFavorites();
      expect(favorites).toHaveLength(1);
    });
  });
});
