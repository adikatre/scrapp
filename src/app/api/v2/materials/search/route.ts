import { NextResponse } from "next/server";
import { materialCatalog } from "@/lib/rules/catalog";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ materials: [] });
  const materials = materialCatalog.search(query).map((material) => ({
    id: material.id,
    name: material.name,
    aliases: material.aliases
  }));
  return NextResponse.json({ materials });
}
