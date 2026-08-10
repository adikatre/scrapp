import { PageShell } from "@/components/PageShell";

export default function PartnersPage() {
  return (
    <PageShell
      title="Verified local knowledge scales through accountable partners."
      description="Scrapp is preparing tools for municipalities and haulers to review sources and propose updates. Partner access is not open yet.">
      <div className="max-w-3xl divide-y divide-border/70 border-y border-border/70">
        {[
          [
            "Source-controlled rules",
            "Every published answer traces to a reviewed source, effective interval, and jurisdiction or service profile."
          ],
          [
            "Correction operations",
            "Resident reports inform review queues; they never publish a rule automatically."
          ],
          [
            "Privacy-respecting insight",
            "Aggregate confusion and coverage trends matter. Photos, notes, addresses, and precise coordinates do not belong in partner analytics."
          ]
        ].map(([title, text]) => (
          <section key={title} className="py-7">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
