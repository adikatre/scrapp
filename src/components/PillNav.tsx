"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Home, MapPin } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cam", label: "Scan", icon: Camera },
  { href: "/locations", label: "Locations", icon: MapPin }
] as const;

type IndicatorRect = { left: number; top: number; width: number; height: number };

export function PillNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const activeHref = LINKS.find((link) => link.href === pathname)?.href ?? LINKS[0].href;
      const nav = navRef.current;
      const el = linkRefs.current.get(activeHref);
      if (!nav || !el) return;

      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - navRect.left,
        top: elRect.top - navRect.top,
        width: elRect.width,
        height: elRect.height
      });
      // Defer enabling the transition by a frame so the very first render
      // (before we know the real position) never animates from the corner.
      requestAnimationFrame(() => setReady(true));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/50 bg-background/70 p-1 shadow-lg backdrop-blur-xl"
    >
      {indicator && (
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full bg-primary",
            ready && "transition-[left,top,width,height] duration-300 ease-out"
          )}
          style={{
            left: indicator.left,
            top: indicator.top,
            width: indicator.width,
            height: indicator.height
          }}
        />
      )}
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            ref={(el) => {
              if (el) linkRefs.current.set(href, el);
              else linkRefs.current.delete(href);
            }}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
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
