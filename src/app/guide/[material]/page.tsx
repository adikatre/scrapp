import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { buildLocationsHref } from "@/lib/locationCategories";
import { getMaterialRule, listMaterialRules } from "@/lib/rules/engine";
import { SAN_DIEGO_SOURCES } from "@/lib/rules/san-diego";

export function generateStaticParams() {
  return listMaterialRules().map((rule) => ({ material: rule.slug }));
}

export default async function MaterialGuidePage({
  params
}: {
  params: Promise<{ material: string }>;
}) {
  const rule = getMaterialRule((await params).material);
  if (!rule) notFound();
  const source = SAN_DIEGO_SOURCES.find((entry) => entry.id === rule.sourceId);
  if (!source) notFound();

  const legacyRoute =
    rule.route === "recycle"
      ? "Recycle"
      : rule.route === "compost"
        ? "Compost"
        : rule.route === "trash"
          ? "General Trash"
          : rule.route === "e-waste"
            ? "E-Waste"
            : rule.route === "hazardous-waste"
              ? "Hazardous Waste"
              : "Bulky Items (Donate)";

  return (
    <PageShell
      title={rule.materialName}
      description={rule.instruction}
      actions={
        <Button asChild variant="outline">
          <Link href="/guide">
            <ArrowLeft className="size-4" /> All materials
          </Link>
        </Button>
      }>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-9">
          <section>
            <h2 className="font-display text-xl font-semibold">Prepare it</h2>
            <ol className="mt-4 space-y-3">
              {rule.preparation.map((step, index) => (
                <li key={step} className="flex gap-4 border-b border-border/70 pb-3">
                  <span className="font-semibold text-primary">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
          {!!rule.safety?.length && (
            <section>
              <h2 className="font-display text-xl font-semibold">Safety</h2>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                {rule.safety.map((item) => (
                  <li key={item}> {item}</li>
                ))}
              </ul>
            </section>
          )}
          {!!rule.exceptions?.length && (
            <section>
              <h2 className="font-display text-xl font-semibold">Exceptions</h2>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                {rule.exceptions.map((item) => (
                  <li key={item}> {item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-[16px] bg-secondary p-5">
          <p className="text-sm font-semibold">City-serviced San Diego homes</p>
          <p className="font-display mt-2 text-2xl font-semibold">{rule.bin}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Rule version</dt>
              <dd className="font-medium">{rule.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Effective</dt>
              <dd className="font-medium">{rule.effectiveFrom}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last checked</dt>
              <dd className="font-medium">{source.lastChecked}</dd>
            </div>
          </dl>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
            Official source <ExternalLink className="size-4" />
          </a>
          {rule.locationEligible && (
            <Button asChild className="mt-6 w-full">
              <Link
                href={buildLocationsHref(
                  legacyRoute,
                  rule.materialName,
                  rule.searchQueries,
                  rule.bin
                )}>
                <MapPin className="size-4" /> Find a verified option
              </Link>
            </Button>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
