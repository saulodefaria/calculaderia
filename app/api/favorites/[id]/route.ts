import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prismaFavoriteRepository } from "@/lib/favorites/prisma-repository";
import {
  deleteFavorite,
  FavoriteValidationError,
  renameFavorite,
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await readJson(request);

  if (!body || typeof body !== "object" || !("name" in body)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const favorite = await renameFavorite(prismaFavoriteRepository, userId, id, body.name);

    if (!favorite) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ favorite: serializeFavorite(favorite) });
  } catch (error) {
    if (error instanceof FavoriteValidationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return unauthorized();

  const { id } = await params;
  const deleted = await deleteFavorite(prismaFavoriteRepository, userId, id);

  if (!deleted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
