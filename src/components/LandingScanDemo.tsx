import { Cable, MapPin, ScanLine } from "lucide-react";
import { DisposalTicket } from "@/components/DisposalTicket";
import type { ScanTicket } from "@/lib/types";

const exampleTicket: ScanTicket = {
  id: "landing-example",
  timestamp: new Date("2026-01-01T12:00:00"),
  image: null,
  itemName: "USB charging cable",
  disposalRoute: "E-Waste",
  bin: "Special Drop-off",
  guidance: "Keep it out of curbside bins. Bring it to an electronics recycling drop-off.",
  searchQueries: ["electronics recycling"]
};

export function LandingScanDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0 lg:ml-auto">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#101817] p-3 shadow-[0_28px_80px_rgba(8,25,22,0.28)] sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
          <span className="inline-flex items-center gap-2">
            <ScanLine className="size-3.5 text-teal-300" /> Example scan
          </span>
          <span>San Diego guidance</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[0.82fr_1.18fr]">
          <div className="relative flex min-h-44 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_30%_20%,#325d57_0,transparent_45%),linear-gradient(145deg,#172220,#0d1312)]">
            <div className="absolute inset-4 rounded-2xl border border-dashed border-white/15" />
            <Cable className="size-20 rotate-[-12deg] text-teal-100/90" strokeWidth={1.2} />
            <span className="absolute bottom-3 left-3 rounded-lg bg-black/45 px-2 py-1 text-xs text-white/80 backdrop-blur">
              Photo review
            </span>
          </div>
          <DisposalTicket
            ticket={exampleTicket}
            hideImage
            demo
            className="border-white/10 bg-white text-[#172220] shadow-none [--muted-foreground:oklch(0.38_0.02_174)] dark:bg-white dark:text-[#172220]"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/65">
          <MapPin className="size-4 shrink-0 text-teal-300" />
          Nearby drop-off options appear when a special route is needed.
        </div>
      </div>
    </div>
  );
}
