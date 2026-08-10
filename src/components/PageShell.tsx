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
    <div className={cn("min-h-[100dvh] pb-24 pt-6 sm:pb-14 sm:pt-24", className)}>
      <div className="mx-auto grid w-full max-w-[96rem] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(16rem,0.62fr)_minmax(0,1.38fr)] lg:gap-16 lg:px-12">
        <header className="lg:sticky lg:top-24 lg:self-start">
          <Link
            href="/"
            className="route-display inline-flex min-h-11 items-center text-lg font-semibold tracking-[-0.03em] text-foreground sm:hidden">
            Scrapp
          </Link>
          <h1 className="route-display mt-8 max-w-xl text-4xl font-semibold leading-[0.96] tracking-[-0.04em] sm:mt-0 sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">{description}</p>
          {actions ? <div className="mt-7 flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        <div className="min-w-0 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pl-12 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
