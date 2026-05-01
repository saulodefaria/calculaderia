import { describe, expect, it } from "vitest";
import {
  createFavorite,
  deleteFavorite,
  DuplicateFavoriteError,
  FavoriteValidationError,
  type FavoriteRecord,
  type FavoriteRepository,
  listFavorites,
  renameFavorite,
  clearFavorites,
  validateCreateFavoriteInput,
  validateRenameFavoriteInput,
} from "./service";

class InMemoryFavoriteRepository implements FavoriteRepository {
  private records: FavoriteRecord[] = [];
  private sequence = 0;

  async listByUser(userId: string): Promise<FavoriteRecord[]> {
    return this.records
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findBySimulation(userId: string, calculatorId: string, search: string): Promise<FavoriteRecord | null> {
    return (
      this.records.find(
        (record) => record.userId === userId && record.calculatorId === calculatorId && record.search === search
      ) ?? null
    );
  }

  async create(data: {
    userId: string;
    calculatorId: string;
    search: string;
    name: string;
  }): Promise<FavoriteRecord> {
    const existing = await this.findBySimulation(data.userId, data.calculatorId, data.search);
    if (existing) throw new DuplicateFavoriteError();

    this.sequence += 1;
    const now = new Date(`2026-01-01T00:00:${String(this.sequence).padStart(2, "0")}.000Z`);
    const record = {
      id: `favorite-${this.sequence}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.records.push(record);
    return record;
  }

  async rename(userId: string, id: string, name: string): Promise<FavoriteRecord | null> {
    const record = this.records.find((favorite) => favorite.id === id && favorite.userId === userId);
    if (!record) return null;

    record.name = name;
    record.updatedAt = new Date("2026-01-02T00:00:00.000Z");
    return record;
  }

  async deleteById(userId: string, id: string): Promise<boolean> {
    const before = this.records.length;
    this.records = this.records.filter((record) => record.userId !== userId || record.id !== id);
    return this.records.length !== before;
  }

  async clearByUser(userId: string): Promise<number> {
    const before = this.records.length;
    this.records = this.records.filter((record) => record.userId !== userId);
    return before - this.records.length;
  }
}

describe("favorite service", () => {
  it("validates create input and defaults the name to the calculator title", () => {
    expect(validateCreateFavoriteInput({ calculatorId: "juros-compostos", search: "?vi=1000" })).toEqual({
      calculatorId: "juros-compostos",
      search: "?vi=1000",
      name: "Juros Compostos",
    });

    expect(
      validateCreateFavoriteInput({
        calculatorId: "financiamento",
        search: "?valor=500000",
        name: "  Meu cenário  ",
      }).name
    ).toBe("Meu cenário");
  });

  it("rejects invalid calculator ids, search strings, and names", () => {
    expect(() => validateCreateFavoriteInput({ calculatorId: "unknown", search: "?x=1" })).toThrow(
      new FavoriteValidationError("invalid_calculator")
    );
    expect(() => validateCreateFavoriteInput({ calculatorId: "financiamento", search: "x=1" })).toThrow(
      new FavoriteValidationError("invalid_search")
    );
    expect(() => validateRenameFavoriteInput("   ")).toThrow(new FavoriteValidationError("invalid_name"));
  });

  it("creates favorites newest first and returns duplicates without creating another row", async () => {
    const repository = new InMemoryFavoriteRepository();

    const first = await createFavorite(repository, "user-1", {
      calculatorId: "juros-compostos",
      search: "?first=1",
    });
    const second = await createFavorite(repository, "user-1", {
      calculatorId: "financiamento",
      search: "?second=2",
    });
    const duplicate = await createFavorite(repository, "user-1", {
      calculatorId: "juros-compostos",
      search: "?first=1",
    });

    expect(first.status).toBe("created");
    expect(second.status).toBe("created");
    expect(duplicate.status).toBe("duplicate");
    expect(duplicate.favorite.id).toBe(first.favorite.id);
    expect(await listFavorites(repository, "user-1")).toMatchObject([
      { id: second.favorite.id },
      { id: first.favorite.id },
    ]);
  });

  it("scopes duplicate detection, renames, deletes, and clear-all by user", async () => {
    const repository = new InMemoryFavoriteRepository();

    const userOne = await createFavorite(repository, "user-1", {
      calculatorId: "financiamento",
      search: "?valor=500000",
    });
    const userTwo = await createFavorite(repository, "user-2", {
      calculatorId: "financiamento",
      search: "?valor=500000",
    });

    expect(userOne.status).toBe("created");
    expect(userTwo.status).toBe("created");
    expect(await renameFavorite(repository, "user-2", userOne.favorite.id, "Outro nome")).toBeNull();

    const renamed = await renameFavorite(repository, "user-1", userOne.favorite.id, "Casa principal");
    expect(renamed?.name).toBe("Casa principal");

    expect(await deleteFavorite(repository, "user-2", userOne.favorite.id)).toBe(false);
    expect(await deleteFavorite(repository, "user-1", userOne.favorite.id)).toBe(true);
    expect(await listFavorites(repository, "user-1")).toHaveLength(0);
    expect(await listFavorites(repository, "user-2")).toHaveLength(1);

    expect(await clearFavorites(repository, "user-2")).toBe(1);
    expect(await listFavorites(repository, "user-2")).toHaveLength(0);
  });
});
