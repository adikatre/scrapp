"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Home, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cam", label: "Scan", icon: Camera },
  { href: "/locations", label: "Locations", icon: MapPin }
] as const;

export function PillNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/50 bg-background/70 p-1 shadow-lg backdrop-blur-xl"
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {/* On small screens only the active label shows, keeping the pill compact */}
            <span className={cn(!isActive && "hidden sm:inline")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
