/* Route Label: specimen -> inspection -> route -> physical answer label. */
import { ArrowRight, Camera, MapPin, MessageSquareText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const routeSteps = [
  ["Show it", "Take a photo or upload one."],
  ["Confirm it", "Choose the item when more than one is visible."],
  ["Match it", "Scrapp applies the rule for your local service."],
  ["Sort it", "See the bin, preparation, source, or drop-off route."]
] as const;

const binFields = [
  {
    name: "Blue bin",
    items: ["Cardboard", "Metal cans", "Rigid containers"],
    href: "/guide?route=recycling",
    image: "/route-label/blue-bin-specimen.webp",
    tone: "route-bin-blue"
  },
  {
    name: "Green bin",
    items: ["Food scraps", "Yard trimmings", "Food-soiled paper"],
    href: "/guide?route=organics",
    image: "/route-label/green-bin-specimen.webp",
    tone: "route-bin-green"
  },
  {
    name: "Trash",
    items: ["Plastic film", "Broken ceramics", "Mixed materials"],
    href: "/guide?route=trash",
    image: "/route-label/gray-bin-specimen.webp",
    tone: "route-bin-gray"
  }
] as const;

export default function HomePage() {
  return (
    <div className="route-page overflow-x-clip pb-24 sm:pb-0">
      <section className="route-hero mx-auto grid min-h-[100dvh] max-w-[96rem] items-center gap-10 px-5 pb-14 pt-24 sm:px-8 sm:pt-28 lg:grid-cols-[0.72fr_1.28fr] lg:px-12 lg:pb-12">
        <div className="relative z-10 max-w-[38rem]">
          <h1 className="route-display text-[clamp(3.55rem,7vw,6rem)] font-semibold leading-[0.88] tracking-[-0.04em]">
            Snap it.
            <br />
            Sort it right.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-7 text-muted-foreground sm:text-xl">
            A photo becomes the right local action.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="route-action route-action-primary" href="/cam" prefetch={false}>
              <Camera className="size-5" aria-hidden />
              Scan an item
            </Link>
            <Link
              className="route-action route-action-secondary"
              href="/cam?mode=describe"
              prefetch={false}>
              <MessageSquareText className="size-5" aria-hidden />
              Describe it
            </Link>
          </div>
        </div>

        <section className="route-hero-instrument" aria-label="Example Scrapp result">
          <div className="route-specimen-frame">
            <Image
              src="/route-label/cup-specimen.webp"
              alt="Example clear plastic cup photographed from above"
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 58vw"
              className="object-cover"
            />
          </div>
          <div className="route-path" aria-hidden />
          <div className="route-answer route-answer-blue">
            <span className="route-example">Example</span>
            <strong>Blue bin</strong>
            <span>Empty it. Keep it loose.</span>
          </div>
        </section>
      </section>

      <section className="route-section mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <h2 className="route-display text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
            One item. One clear route.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-7 text-muted-foreground">
            Scrapp separates what the camera sees from the local rule that decides what to do.
          </p>
        </div>
        <ol className="route-journey mt-14 grid gap-0 md:grid-cols-4">
          {routeSteps.map(([title, detail]) => (
            <li key={title} className="route-journey-step">
              <span className="route-journey-node" aria-hidden />
              <h3 className="route-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-6 text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="route-section mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <h2 className="route-display text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
            The curbside guide, at a glance.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-7 text-muted-foreground">
            Color means disposal here. It is never decoration.
          </p>
        </div>
        <div className="route-bin-grid mt-12">
          {binFields.map((bin) => (
            <Link key={bin.name} href={bin.href} className={`route-bin-field ${bin.tone}`}>
              <Image
                src={bin.image}
                alt=""
                fill
                sizes="(max-width: 768px) 92vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="route-bin-content">
                <strong>{bin.name}</strong>
                <span>{bin.items.join("\n")}</span>
                <ArrowRight className="size-6" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="route-section mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12">
        <div className="route-special-grid">
          <div className="max-w-lg py-3">
            <h2 className="route-display text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
              Some things need a special route.
            </h2>
            <p className="mt-5 text-lg leading-7 text-muted-foreground">
              Scrapp carries the item into a nearby search, with verified programs shown first.
            </p>
            <Link className="route-text-link mt-7" href="/locations" prefetch={false}>
              <MapPin className="size-5" aria-hidden />
              Find a drop-off
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="route-special-strip">
            <Image
              src="/route-label/special-route-specimens.webp"
              alt="Batteries, electronics, paint, and a bulky chair"
              fill
              sizes="(max-width: 1024px) 92vw, 58vw"
              className="object-cover"
            />
            <div className="route-special-labels" aria-hidden>
              <span>Batteries</span>
              <span>Electronics</span>
              <span>Paint</span>
              <span>Bulky items</span>
            </div>
          </div>
        </div>
      </section>

      <section className="route-close px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto flex max-w-[90rem] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <h2 className="route-display max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
            Hold it up.
            <br />
            Know where it goes.
          </h2>
          <Link className="route-action route-action-paper" href="/cam" prefetch={false}>
            <Camera className="size-5" aria-hidden />
            Scan an item
          </Link>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[90rem] gap-8 border-t border-border pt-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="route-display text-2xl font-semibold">Scrapp</p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Independent disposal guidance. City resources remain the source of truth.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link href="/guide">Guide</Link>
            <Link href="/history">History</Link>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a
              href="https://www.sandiego.gov/environmental-services/recycling"
              target="_blank"
              rel="noreferrer">
              City resources
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
