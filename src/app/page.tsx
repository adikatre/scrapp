import {
  ArrowRight,
  BatteryCharging,
  CircleCheck,
  Github,
  MapPin,
  Recycle,
  ScanLine,
  ShieldCheck,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { LandingScanDemo } from "@/components/LandingScanDemo";
import { Button } from "@/components/ui/button";
import { recyclables } from "@/data/recyclables";

const journey = [
  { eyebrow: "01 · Photo", title: "Show the item", detail: "Use the camera or upload a photo." },
  {
    eyebrow: "02 · Local rule",
    title: "Match San Diego guidance",
    detail: "Translate the result into a local disposal route."
  },
  {
    eyebrow: "03 · Exact answer",
    title: "See the right bin",
    detail: "Blue, green, gray, or a special drop-off route."
  },
  {
    eyebrow: "04 · Handoff",
    title: "Find the destination",
    detail: "Open nearby options only when a trip is actually needed."
  }
];

const curbside = [
  {
    color: "blue",
    label: "Blue bin",
    title: "Clean recyclables",
    copy: "Paper, cardboard, metal cans, glass bottles, and accepted rigid plastics."
  },
  {
    color: "green",
    label: "Green bin",
    title: "Food and yard organics",
    copy: "Food scraps, food-soiled paper, and yard trimmings accepted by the local program."
  },
  {
    color: "gray",
    label: "Gray bin",
    title: "Trash",
    copy: "Items that cannot be recycled or composted curbside—never batteries or electronics."
  }
] as const;

export default function HomePage() {
  return (
    <div className="overflow-x-clip pb-28 sm:pb-0">
      <section className="relative min-h-[min(52rem,100svh)] border-b border-border/70 px-5 pb-16 pt-24 sm:px-8 sm:pt-28 lg:px-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
              <span className="size-2 rounded-full bg-primary" /> San Diego disposal assistant
            </p>
            <h1 className="font-display text-[clamp(3.2rem,8.8vw,7.6rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-balance">
              Snap it. <span className="text-primary">Sort it right.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Take a photo and get San Diego disposal guidance, the right bin, and nearby drop-off
              options.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/cam" prefetch={false}>
                  <ScanLine className="size-5" /> Scan an item
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/locations" prefetch={false}>
                  <MapPin className="size-5" /> Find a drop-off
                </Link>
              </Button>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Independent helper—not
              an official City of San Diego service.
            </p>
          </div>
          <LandingScanDemo />
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28" aria-labelledby="journey-title">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                One short journey
              </p>
              <h2
                id="journey-title"
                className="font-display mt-3 max-w-lg text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                From an object in your hand to a local answer.
              </h2>
              <a
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                href="https://www.sandiego.gov/environmental-services/recycling"
                target="_blank"
                rel="noreferrer">
                City recycling resources <ArrowRight className="size-4" />
              </a>
            </div>
            <ol className="divide-y divide-border border-y border-border">
              {journey.map((step) => (
                <li
                  key={step.eyebrow}
                  className="grid gap-2 py-5 sm:grid-cols-[8rem_1fr_1.1fr] sm:items-baseline">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    {step.eyebrow}
                  </span>
                  <span className="font-display text-xl font-semibold">{step.title}</span>
                  <span className="text-sm leading-6 text-muted-foreground">{step.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        className="bg-[#101817] px-5 py-20 text-white sm:px-8 lg:px-12 lg:py-28"
        aria-labelledby="curbside-title">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
              Curbside, decoded
            </p>
            <h2
              id="curbside-title"
              className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Three colors. Three different jobs.
            </h2>
          </div>
          <div className="mt-12 grid overflow-hidden rounded-[22px] border border-white/10 lg:grid-cols-[1.2fr_1fr_0.85fr]">
            {curbside.map((bin, index) => (
              <article
                key={bin.color}
                className="relative min-h-64 border-b border-white/10 p-7 last:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0">
                <div
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 ${bin.color === "blue" ? "bg-blue-500" : bin.color === "green" ? "bg-green-500" : "bg-zinc-400"}`}
                />
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                  0{index + 1} · {bin.label}
                </span>
                <h3 className="font-display mt-12 text-2xl font-semibold">{bin.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/62">{bin.copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-5 text-white/45">
            Always confirm current local rules. Scrapp uses classification guidance to help you
            decide; City resources remain the source of truth.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28" aria-labelledby="surprise-title">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Worth a second look
              </p>
              <h2
                id="surprise-title"
                className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Items that surprise people.
              </h2>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:block">Swipe on mobile →</span>
          </div>
          <section
            aria-label="Items that surprise people"
            className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
            {recyclables.slice(0, 6).map((item, index) => (
              <article
                key={item.item_name}
                className="min-w-[82vw] snap-start rounded-[20px] border border-border bg-card p-6 sm:min-w-0">
                <div className="flex items-center justify-between">
                  {index % 2 === 0 ? (
                    <Recycle className="size-5 text-primary" />
                  ) : (
                    <Trash2 className="size-5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Guide {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display mt-8 text-2xl font-semibold">{item.item_name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {item.prep_steps.join(" ")}
                </p>
                <Link
                  prefetch={false}
                  href="/cam"
                  className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  Scan a similar item <ArrowRight className="ml-2 size-4" />
                </Link>
              </article>
            ))}
          </section>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[24px] border border-border bg-card lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-10 lg:p-14">
            <BatteryCharging className="size-8 text-primary" strokeWidth={1.8} />
            <h2 className="font-display mt-8 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Some items need more than a curbside bin.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
              Electronics, batteries, paint, and hazardous materials often need a dedicated
              destination. Scrapp carries the item context into the locations search so you do not
              have to start over.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/locations" prefetch={false}>
                <MapPin className="size-5" /> Explore drop-off options
              </Link>
            </Button>
          </div>
          <div className="relative min-h-72 border-t border-border bg-muted/60 p-8 lg:border-t-0 lg:border-l">
            <div
              aria-hidden
              className="absolute inset-0 opacity-70 [background-image:linear-gradient(135deg,transparent_46%,var(--border)_47%,var(--border)_49%,transparent_50%)] [background-size:32px_32px]"
            />
            <div className="relative flex h-full flex-col justify-between rounded-[18px] border border-border bg-background/90 p-6 backdrop-blur">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Location handoff
              </span>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CircleCheck className="size-5 text-primary" />
                  <span className="font-semibold">Item context preserved</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-primary" />
                  <span className="font-semibold">Manual city or ZIP always available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-primary px-5 py-14 text-primary-foreground sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-3xl font-semibold tracking-[-0.03em]">
              One photo. A clearer next move.
            </p>
            <p className="mt-2 text-sm text-primary-foreground/90">
              Review the result before you act, and check local rules for final confirmation.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/cam" prefetch={false}>
              <ScanLine className="size-5" /> Scan an item
            </Link>
          </Button>
        </div>
      </section>

      <footer className="px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-b border-border pb-24 sm:flex-row sm:items-end sm:justify-between sm:pb-8">
          <div>
            <p className="font-display text-2xl font-semibold">scrapp</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Independent photo-first disposal guidance for San Diego.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link href="/cam" prefetch={false}>
              Scan
            </Link>
            <Link href="/locations" prefetch={false}>
              Locations
            </Link>
            <a
              href="https://www.sandiego.gov/environmental-services/recycling"
              target="_blank"
              rel="noreferrer">
              City resources
            </a>
            <a
              href="https://github.com/adikatre/scrapp"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5">
              <Github className="size-4" /> Frontend
            </a>
            <a
              href="https://github.com/adikatre/scrapp-backend"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5">
              <Github className="size-4" /> Backend
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
