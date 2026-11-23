import Link from "next/link";
import { ArrowRight, Camera, Github, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialShortcuts } from "@/components/MaterialShortcuts";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border">
        <video autoPlay loop muted playsInline aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden"
          src="/hero-video-loop-2k.mp4" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/95 via-black/80 to-black/45" />
        <div className="mx-auto max-w-5xl px-6 pb-14 pt-28 sm:px-10 sm:pb-24 sm:pt-36">
          <p className="mb-5 flex items-center gap-2 text-sm font-medium text-emerald-300"><MapPin size={16} /> San Diego, California</p>
          <p className="mb-2 text-xl font-semibold tracking-tight text-white">scrapp</p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-7xl">Where does this go?</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-200">Take a photo or describe an item to find the right bin, a reuse option, or a local drop-off.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/cam"><Camera /> Scan or describe an item</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/locations">Browse disposal guide <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Look up a household item</h2>
        <MaterialShortcuts />
      </section>
      <footer className="mx-auto flex max-w-5xl flex-wrap items-center gap-5 border-t px-6 py-5 text-sm text-muted-foreground sm:px-10">
        <a href="https://www.sandiego.gov/environmental-services/recycling/residential/curbside/list" className="hover:text-foreground">City collection guide ↗</a>
        <a href="https://github.com/adikatre/scrapp" className="inline-flex items-center gap-1.5 hover:text-foreground"><Github size={14} /> Frontend</a>
        <a href="https://github.com/adikatre/scrapp-backend" className="inline-flex items-center gap-1.5 hover:text-foreground"><Github size={14} /> Backend</a>
      </footer>
    </div>
  );
}
