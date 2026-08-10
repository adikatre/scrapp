import { PageShell } from "@/components/PageShell";

export default function AccountPage() {
  return (
    <PageShell
      title="Accounts are optional-and not enabled here yet."
      description="Scanning, the Guide, Locations, and local History remain available without signing in.">
      <div className="max-w-2xl rounded-[16px] bg-secondary p-6">
        <h2 className="font-display text-xl font-semibold">Local-first by default</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          When account sync is configured, Scrapp will offer an explicit one-time metadata import.
          Photos will stay on this device, and account deletion will remove user-owned server
          metadata.
        </p>
      </div>
    </PageShell>
  );
}
