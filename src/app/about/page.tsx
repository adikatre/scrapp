import { PageShell } from "@/components/PageShell";

export default function AboutPage() {
  return (
    <PageShell
      title="A clearer local decision at the moment it matters."
      description="Scrapp is an independent disposal assistant, beginning with City of San Diego guidance. It is not an official City service.">
      <div className="max-w-3xl space-y-10 text-base leading-8">
        <section>
          <h2 className="font-display text-2xl font-semibold">Why this exists</h2>
          <p className="mt-3 text-muted-foreground">
            Disposal labels are inconsistent, local programs differ, and the right answer often
            depends on material, condition, property service, and location. Scrapp brings those
            facts into one short decision.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold">What earns trust</h2>
          <p className="mt-3 text-muted-foreground">
            Confirmed answers cite a versioned source. Unknown coverage stays unknown. Community
            corrections enter review rather than publishing automatically, and photos are not added
            to cloud history.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
