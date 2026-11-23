import Link from "next/link";
import { ArrowUpRight, BatteryMedium, Flame, Shirt, Apple, type LucideIcon } from "lucide-react";

const materials: { label: string; item: string; icon: LucideIcon }[] = [
  { label: "Clothing & fabric", item: "shirt", icon: Shirt },
  { label: "Propane cylinders", item: "propane canister", icon: Flame },
  { label: "Batteries", item: "battery", icon: BatteryMedium },
  { label: "Food scraps", item: "banana peel", icon: Apple }
];

export function MaterialShortcuts() {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {materials.map(({ label, item, icon: Icon }) => (
        <li key={item}>
          <Link href={`/locations?item=${encodeURIComponent(item)}`}
            className="group flex min-h-12 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/60">
            <Icon size={19} className="text-primary" aria-hidden />
            <span className="font-medium">{label}</span>
            <ArrowUpRight size={16} className="ml-auto text-muted-foreground group-hover:text-primary" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
