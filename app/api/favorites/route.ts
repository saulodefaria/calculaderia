import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prismaFavoriteRepository } from "@/lib/favorites/prisma-repository";
import {
  clearFavorites,
  createFavorite,
  FavoriteValidationError,
  listFavorites,
  serializeFavorite,
} from "@/lib/favorites/service";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return unauthorized();

  const favorites = await listFavorites(prismaFavoriteRepository, userId);
  return NextResponse.json({ favorites: favorites.map(serializeFavorite) });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return unauthorized();

  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await createFavorite(prismaFavoriteRepository, userId, body);
    const status = result.status === "created" ? 201 : 200;

    return NextResponse.json(
      {
        status: result.status,
        favorite: serializeFavorite(result.favorite),
      },
      { status }
    );
  } catch (error) {
    if (error instanceof FavoriteValidationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return unauthorized();

  const deletedCount = await clearFavorites(prismaFavoriteRepository, userId);
  return NextResponse.json({ deletedCount });
}
