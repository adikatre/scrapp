import { ArrowRight, Camera, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Camera,
    title: "Identify",
    text: "Use a photo, upload, or description. The model suggests item and material candidates only."
  },
  {
    icon: ShieldCheck,
    title: "Verify locally",
    text: "Scrapp resolves your jurisdiction and applies a versioned rule from an official or verified source."
  },
  {
    icon: CheckCircle2,
    title: "Act with context",
    text: "See the exact bin, preparation, safety notes, uncertainty, and source dates."
  },
  {
    icon: MapPin,
    title: "Hand off safely",
    text: "When curbside is wrong, verified programs come before general discovery results."
  }
];

export default function HowItWorksPage() {
  return (
    <PageShell
      title="Identification is a clue. The local rule is the answer."
      description="Scrapp keeps probabilistic item recognition separate from verified disposal policy so uncertainty never looks like authority."
      actions={
        <Button asChild>
          <Link href="/cam">
            Try Scrapp <ArrowRight className="size-4" />
          </Link>
        </Button>
      }>
      <div className="divide-y divide-border/70 border-y border-border/70">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <section
            key={title}
            className="grid gap-4 py-7 sm:grid-cols-[4rem_12rem_1fr] sm:items-start">
            <span className="text-sm font-semibold tabular-nums text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="flex items-center gap-3 font-display text-xl font-semibold">
              <Icon className="size-5" />
              {title}
            </h2>
            <p className="max-w-2xl leading-7 text-muted-foreground">{text}</p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
