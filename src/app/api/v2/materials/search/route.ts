import { NextResponse } from "next/server";
import { searchMaterials } from "@/lib/rules/engine";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2) return NextResponse.json({ materials: [] });
  const materials = searchMaterials(query).map((rule) => ({
    id: rule.slug,
    name: rule.materialName,
    aliases: rule.aliases,
    route: rule.route
  }));
  return NextResponse.json({ materials });
}
