"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PredictionResult } from "@/lib/types";

export function ImageDetectionViewer({
  open,
  onOpenChange,
  imageSrc,
  initialPrediction
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  initialPrediction?: PredictionResult | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Saved scan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {initialPrediction?.bin_totals && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(initialPrediction.bin_totals).map(([route, count]) => (
                <Badge key={route} variant="outline" className="text-xs">
                  {route}: {count}
                </Badge>
              ))}
            </div>
          )}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Saved scan"
                className="absolute inset-0 size-full object-contain"
              />
            ) : (
              <div className="grid size-full place-items-center text-sm text-muted-foreground">
                No image was saved for this scan.
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Viewing a saved image never sends it for classification again.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
