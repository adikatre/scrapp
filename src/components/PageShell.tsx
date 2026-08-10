import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  children,
  actions,
  className
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen pb-28 pt-6 sm:pb-16 sm:pt-24", className)}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <header className="flex flex-col gap-6 border-b border-border/70 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                S
              </span>
              Scrapp
            </Link>
            <h1 className="font-display mt-7 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
        <div className="py-8 sm:py-12">{children}</div>
      </div>
    </div>
  );
}
