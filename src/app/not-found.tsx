import { Home, ScanLine } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell
      title="That page is not in the sorting guide."
      description="The link may have moved. Your local scan history is unchanged."
      actions={
        <Button asChild>
          <Link href="/cam">
            <ScanLine className="size-4" /> Scan an item
          </Link>
        </Button>
      }>
      <div className="grid gap-5 rounded-[20px] border border-border/70 bg-card p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            404 - No route
          </p>
          <h2 className="font-display mt-3 text-2xl font-semibold">Choose a useful next move.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Return home, search the material guide, or go back to the page you came from.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" /> Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide">Material guide</Link>
          </Button>
          <BackButton />
        </div>
      </div>
    </PageShell>
  );
}
