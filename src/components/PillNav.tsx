"use client";

import { Camera, Home, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cam", label: "Scan", icon: Camera },
  { href: "/locations", label: "Locations", icon: MapPin }
] as const;

function isActiveLink(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PillNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/cam")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[var(--z-nav)] grid grid-cols-3 rounded-2xl border border-border/80 bg-background/92 p-1.5 shadow-[0_18px_55px_rgba(15,35,32,0.2)] backdrop-blur-xl sm:inset-x-auto sm:top-4 sm:bottom-auto sm:left-1/2 sm:flex sm:-translate-x-1/2 sm:rounded-full sm:p-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = isActiveLink(pathname, href);
        return (
          <Link
            key={href}
            prefetch={false}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200 sm:rounded-full sm:text-sm",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}>
            <Icon className="size-[18px]" strokeWidth={2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
