import { PageShell } from "@/components/PageShell";

export default function TermsPage() {
  return (
    <PageShell
      title="Terms and product limits."
      description="Scrapp helps interpret disposal guidance; it does not replace instructions from your property manager, hauler, facility, or local authority.">
      <div className="max-w-3xl space-y-9 leading-7">
        <section>
          <h2 className="font-display text-xl font-semibold">Check your service</h2>
          <p className="mt-3 text-muted-foreground">
            A City of San Diego curbside rule applies only when the City provides that collection
            service. Multifamily and privately serviced properties may follow different programs.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">Safety comes first</h2>
          <p className="mt-3 text-muted-foreground">
            Do not handle damaged batteries, chemicals, sharps, or unknown substances based only on
            an app result. Follow emergency and facility instructions.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">Destinations change</h2>
          <p className="mt-3 text-muted-foreground">
            Hours, eligibility, fees, and accepted materials can change. Verified entries include a
            checked date; general discovery results should be called before visiting.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
