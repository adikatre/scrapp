import { PageShell } from "@/components/PageShell";
import { SettingsManager } from "@/components/SettingsManager";

export const metadata = { title: "Settings - Scrapp" };

export default function SettingsPage() {
  return (
    <PageShell
      title="Your local Scrapp."
      description="Set the service context that determines which rules Scrapp may present as confirmed.">
      <SettingsManager />
    </PageShell>
  );
}
