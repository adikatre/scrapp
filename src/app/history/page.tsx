import { HistoryManager } from "@/components/HistoryManager";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "History - Scrapp" };

export default function HistoryPage() {
  return (
    <PageShell
      title="Saved decisions"
      description="Your recent disposal guidance stays on this device. Opening a saved item never runs the classifier again.">
      <HistoryManager />
    </PageShell>
  );
}
