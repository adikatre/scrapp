"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 pb-28">
      <AlertTriangle className="size-10 text-amber-600" />
      <h1 className="font-display mt-6 text-3xl font-semibold">
        This page did not finish loading.
      </h1>
      <p className="mt-3 leading-7 text-muted-foreground">
        Your saved history is still on this device. Retry the page or return home.
      </p>
      <div className="mt-7 flex gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" /> Retry
        </Button>
        <Button asChild variant="outline">
          <a href="/">Home</a>
        </Button>
      </div>
    </div>
  );
}
