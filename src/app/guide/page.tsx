import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { listMaterialRules, searchMaterials } from "@/lib/rules/engine";
import { cn } from "@/lib/utils";

const binColor: Record<string, string> = {
  "Blue Bin (Recycling)": "bg-blue-600",
  "Green Bin (Organics)": "bg-emerald-600",
  "Gray Bin (Trash)": "bg-slate-600",
  "Special Drop-off": "bg-primary"
};

export const metadata = { title: "San Diego disposal guide - Scrapp" };

export default async function GuidePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim() || "";
  const rules = query ? searchMaterials(query, 20) : listMaterialRules();

  return (
    <PageShell
      title="Know before you throw."
      description="Browse verified City of San Diego guidance without taking a photo. Confirm your service provider before relying on a curbside answer.">
      <form action="/guide" className="relative max-w-2xl">
        <label htmlFor="guide-search" className="sr-only">
          Search materials
        </label>
        <Search className="pointer-events-none absolute left-4 top-4 size-5 text-muted-foreground" />
        <input
          id="guide-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Try battery, pizza box, plastic bag."
          className="min-h-13 w-full rounded-xl border bg-card pl-12 pr-4 text-base shadow-sm"
        />
      </form>

      <div className="mt-10 border-y border-border/70">
        {rules.map((rule) => (
          <Link
            key={rule.id}
            href={`/guide/${rule.slug}`}
            className="group grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border/70 py-4 last:border-b-0 hover:bg-accent/45">
            <span className={cn("size-3 rounded-full", binColor[rule.bin])} aria-hidden="true" />
            <span>
              <span className="block font-semibold">{rule.materialName}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{rule.bin}</span>
            </span>
            <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
      {!rules.length && (
        <div className="max-w-xl py-14">
          <h2 className="font-display text-2xl font-semibold">No verified match yet.</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Try the material rather than the brand name, or use a photo so Scrapp can suggest
            candidates.
          </p>
          <Link
            href="/cam"
            className="mt-5 inline-flex font-semibold text-primary underline underline-offset-4">
            Scan the item
          </Link>
        </div>
      )}
    </PageShell>
  );
}
