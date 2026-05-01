import { calculators } from "../constants";

export const FAVORITE_NAME_MAX_LENGTH = 80;
export const FAVORITE_SEARCH_MAX_LENGTH = 2000;

export type FavoriteValidationCode = "invalid_calculator" | "invalid_search" | "invalid_name";

export class FavoriteValidationError extends Error {
  constructor(public readonly code: FavoriteValidationCode) {
    super(code);
    this.name = "FavoriteValidationError";
  }
}

export class DuplicateFavoriteError extends Error {
  constructor() {
    super("duplicate_favorite");
    this.name = "DuplicateFavoriteError";
  }
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  calculatorId: string;
  search: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteDto {
  id: string;
  calculatorId: string;
  search: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFavoriteInput {
  calculatorId: unknown;
  search: unknown;
  name?: unknown;
}

export interface FavoriteRepository {
  listByUser(userId: string): Promise<FavoriteRecord[]>;
  findBySimulation(userId: string, calculatorId: string, search: string): Promise<FavoriteRecord | null>;
  create(data: {
    userId: string;
    calculatorId: string;
    search: string;
    name: string;
  }): Promise<FavoriteRecord>;
  rename(userId: string, id: string, name: string): Promise<FavoriteRecord | null>;
  deleteById(userId: string, id: string): Promise<boolean>;
  clearByUser(userId: string): Promise<number>;
}

export type CreateFavoriteResult =
  | { status: "created"; favorite: FavoriteRecord }
  | { status: "duplicate"; favorite: FavoriteRecord };

export function serializeFavorite(favorite: FavoriteRecord): FavoriteDto {
  return {
    id: favorite.id,
    calculatorId: favorite.calculatorId,
    search: favorite.search,
    name: favorite.name,
    createdAt: favorite.createdAt.toISOString(),
    updatedAt: favorite.updatedAt.toISOString(),
  };
}

export function getDefaultFavoriteName(calculatorId: string): string {
  return calculators.find((calculator) => calculator.id === calculatorId)?.title ?? calculatorId;
}

export function validateCalculatorId(calculatorId: unknown): string {
  if (typeof calculatorId !== "string" || !calculators.some((calculator) => calculator.id === calculatorId)) {
    throw new FavoriteValidationError("invalid_calculator");
  }

  return calculatorId;
}

export function validateFavoriteSearch(search: unknown): string {
  if (
    typeof search !== "string" ||
    search.length < 2 ||
    search.length > FAVORITE_SEARCH_MAX_LENGTH ||
    !search.startsWith("?") ||
    search.includes("#")
  ) {
    throw new FavoriteValidationError("invalid_search");
  }

  try {
    const params = new URLSearchParams(search);
    if ([...params.keys()].length === 0) {
      throw new FavoriteValidationError("invalid_search");
    }
  } catch {
    throw new FavoriteValidationError("invalid_search");
  }

  return search;
}

export function normalizeFavoriteName(name: unknown, fallback?: string): string {
  const candidate = typeof name === "string" ? name.trim() : "";
  const normalized = candidate || fallback?.trim() || "";

  if (!normalized || normalized.length > FAVORITE_NAME_MAX_LENGTH) {
    throw new FavoriteValidationError("invalid_name");
  }

  return normalized;
}

export function validateCreateFavoriteInput(input: CreateFavoriteInput) {
  const calculatorId = validateCalculatorId(input.calculatorId);
  const search = validateFavoriteSearch(input.search);
  const name = normalizeFavoriteName(input.name, getDefaultFavoriteName(calculatorId));

  return { calculatorId, search, name };
}

export function validateRenameFavoriteInput(name: unknown): string {
  return normalizeFavoriteName(name);
}

export async function listFavorites(repository: FavoriteRepository, userId: string): Promise<FavoriteRecord[]> {
  return repository.listByUser(userId);
}

export async function createFavorite(
  repository: FavoriteRepository,
  userId: string,
  input: CreateFavoriteInput
): Promise<CreateFavoriteResult> {
  const data = validateCreateFavoriteInput(input);
  const existing = await repository.findBySimulation(userId, data.calculatorId, data.search);

  if (existing) {
    return { status: "duplicate", favorite: existing };
  }

  try {
    const favorite = await repository.create({ userId, ...data });
    return { status: "created", favorite };
  } catch (error) {
    if (!(error instanceof DuplicateFavoriteError)) {
      throw error;
    }

    const duplicate = await repository.findBySimulation(userId, data.calculatorId, data.search);
    if (!duplicate) throw error;

    return { status: "duplicate", favorite: duplicate };
  }
}

export async function renameFavorite(
  repository: FavoriteRepository,
  userId: string,
  id: string,
  name: unknown
): Promise<FavoriteRecord | null> {
  return repository.rename(userId, id, validateRenameFavoriteInput(name));
}

export async function deleteFavorite(repository: FavoriteRepository, userId: string, id: string): Promise<boolean> {
  return repository.deleteById(userId, id);
}

export async function clearFavorites(repository: FavoriteRepository, userId: string): Promise<number> {
  return repository.clearByUser(userId);
}
