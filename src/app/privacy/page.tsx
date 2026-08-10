import { PageShell } from "@/components/PageShell";

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy, in plain language."
      description="Use Scrapp without an account. We minimize what leaves your device and keep analytics away from sensitive input.">
      <div className="max-w-3xl space-y-9 leading-7">
        <section>
          <h2 className="font-display text-xl font-semibold">Photos and descriptions</h2>
          <p className="mt-3 text-muted-foreground">
            A photo or description is sent only when you ask Scrapp to identify an item. Scrapp does
            not add photos to cloud history. The identification provider may process request data
            under its API data-use and retention terms.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">History</h2>
          <p className="mt-3 text-muted-foreground">
            Recent decisions and optional thumbnails are stored in your browser. You can delete
            individual items, clear all history, or export metadata from the History page.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">Analytics and errors</h2>
          <p className="mt-3 text-muted-foreground">
            Scrapp must not send scan images, raw notes, barcode values, exact addresses, or precise
            coordinates to analytics or error-reporting tools.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">Accounts</h2>
          <p className="mt-3 text-muted-foreground">
            Account sync is not enabled in this deployment. When introduced, it will be optional and
            will sync decision metadata rather than photos.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
