"use client";

import { BookOpen, Camera, History, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/cam", label: "Scan", icon: Camera },
  { href: "/guide", label: "Guide", icon: BookOpen },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/history", label: "History", icon: History }
] as const;

function isActiveLink(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PillNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/cam")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-border bg-background/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b sm:pb-0">
      <div className="mx-auto grid max-w-[96rem] grid-cols-4 items-center px-2 sm:flex sm:min-h-16 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="Scrapp home"
          className="route-display mr-auto hidden min-h-11 items-center text-xl font-semibold tracking-[-0.03em] sm:flex">
          Scrapp
        </Link>
        <div className="contents sm:flex sm:items-center sm:gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = isActiveLink(pathname, href);
            return (
              <Link
                key={href}
                prefetch={false}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold transition-colors duration-200 sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                  isActive
                    ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary sm:after:inset-x-3"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="size-[18px] sm:size-4" strokeWidth={2} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
