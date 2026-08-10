import { ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { listMaterialRules, searchMaterials } from "@/lib/rules/engine";

const guides = [
  {
    title: "Blue bin",
    bin: "Blue Bin (Recycling)",
    image: "/route-label/blue-bin-specimen.webp",
    className: "route-guide-blue",
    examples: ["Cardboard", "Metal cans", "Rigid containers"]
  },
  {
    title: "Green bin",
    bin: "Green Bin (Organics)",
    image: "/route-label/green-bin-specimen.webp",
    className: "route-guide-green",
    examples: ["Food scraps", "Yard trimmings", "Food-soiled paper"]
  },
  {
    title: "Trash",
    bin: "Gray Bin (Trash)",
    image: "/route-label/gray-bin-specimen.webp",
    className: "route-guide-gray",
    examples: ["Plastic film", "Broken ceramics", "Mixed materials"]
  }
] as const;

export const metadata = { title: "San Diego disposal guide - Scrapp" };

export default async function GuidePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; route?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const route = params.route?.trim().toLowerCase() || "";
  const allRules = query ? searchMaterials(query, 20) : listMaterialRules();
  const rules = route
    ? allRules.filter((rule) => {
        if (route === "recycling") return rule.bin === "Blue Bin (Recycling)";
        if (route === "organics") return rule.bin === "Green Bin (Organics)";
        if (route === "trash") return rule.bin === "Gray Bin (Trash)";
        return true;
      })
    : allRules;
  const showingResults = Boolean(query || route);

  return (
    <div className="min-h-[100dvh] pb-28 pt-8 sm:pb-16 sm:pt-24">
      <div className="mx-auto grid max-w-[96rem] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(17rem,0.58fr)_minmax(0,1.72fr)] lg:gap-8 lg:px-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Link
            href="/"
            className="route-display inline-flex min-h-11 items-center text-xl font-semibold tracking-[-0.03em] sm:hidden">
            Scrapp
          </Link>
          <h1 className="route-display mt-8 max-w-sm text-4xl font-semibold leading-[0.96] tracking-[-0.04em] sm:mt-0 sm:text-6xl">
            What are you getting rid of?
          </h1>
          <form
            action="/guide"
            className="relative mt-10 max-w-md border-b-2 border-foreground pb-2">
            <label htmlFor="guide-search" className="sr-only">
              Search an item or material
            </label>
            <Search
              className="pointer-events-none absolute left-0 top-3 size-6 text-foreground"
              aria-hidden
            />
            <input
              id="guide-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search an item or material"
              className="min-h-12 w-full border-0 bg-transparent pl-10 pr-2 text-base shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </form>
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
            Browse verified City of San Diego guidance. Confirm your service provider before using a
            curbside answer.
          </p>
        </aside>

        <main className="min-w-0 lg:border-l lg:border-border lg:pl-8">
          {showingResults ? (
            <section aria-labelledby="guide-results-title">
              <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
                <div>
                  <h2 id="guide-results-title" className="route-display text-3xl font-semibold">
                    {query ? `Matches for "${query}"` : `${route} guidance`}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rules.length} {rules.length === 1 ? "verified material" : "verified materials"}
                  </p>
                </div>
                <Link href="/guide" className="route-text-link">
                  View the full guide
                </Link>
              </div>
              <div className="route-result-list">
                {rules.map((rule) => (
                  <Link
                    key={rule.id}
                    href={`/guide/${rule.slug}`}
                    className="group grid min-h-20 grid-cols-[1fr_auto] items-center gap-5 border-b border-border py-5">
                    <span>
                      <span className="route-display block text-xl font-semibold">
                        {rule.materialName}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{rule.bin}</span>
                    </span>
                    <ArrowRight
                      className="size-5 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
              {!rules.length ? (
                <div className="py-14">
                  <h2 className="route-display text-3xl font-semibold">No verified match yet.</h2>
                  <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
                    Try the material instead of the brand name, or show Scrapp a photo.
                  </p>
                  <Link href="/cam" className="route-text-link mt-6">
                    Scan the item <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </section>
          ) : (
            <>
              <section className="route-guide-fields" aria-label="Curbside guide">
                {guides.map((guide) => (
                  <Link
                    key={guide.title}
                    href={`/guide?route=${guide.title === "Blue bin" ? "recycling" : guide.title === "Green bin" ? "organics" : "trash"}`}
                    className={`route-guide-field ${guide.className}`}>
                    <Image
                      src={guide.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 92vw, 31vw"
                      className="object-cover"
                    />
                    <span className="route-guide-copy">
                      <strong>{guide.title}</strong>
                      <span>{guide.examples.join("\n")}</span>
                      <ArrowRight className="mt-auto size-6" aria-hidden />
                    </span>
                  </Link>
                ))}
              </section>
              <section className="mt-12" aria-labelledby="special-route-title">
                <div className="mb-6 max-w-xl">
                  <h2
                    id="special-route-title"
                    className="route-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                    Needs a special route
                  </h2>
                </div>
                <Link href="/locations" className="route-guide-special">
                  <Image
                    src="/route-label/special-route-specimens.webp"
                    alt="Batteries, electronics, paint, and bulky furniture"
                    fill
                    sizes="(max-width: 1024px) 92vw, 68vw"
                    className="object-cover"
                  />
                  <span className="route-guide-special-labels">
                    <strong>Batteries</strong>
                    <strong>Electronics</strong>
                    <strong>Paint</strong>
                    <strong>Bulky items</strong>
                  </span>
                </Link>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
