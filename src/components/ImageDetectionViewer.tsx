"use client";

import {Loader2} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {predict} from "@/lib/backend";
import {BaseStates} from "@/lib/states";
import type {PredictionResult} from "@/lib/types";
import {cn, dataURLtoFile} from "@/lib/utils";

function useImageNaturalSize(src?: string | null) {
  const [size, setSize] = useState<{w: number; h: number} | null>(null);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setSize({w: img.naturalWidth, h: img.naturalHeight});
    img.src = src;
  }, [src]);
  return size;
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(initialPrediction ?? null);

  const natural = useImageNaturalSize(imageSrc);
  const containerRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<{w: number; h: number}>({
    w: 0,
    h: 0
  });

  useEffect(() => {
    if (!open) return;
    if (!imageSrc) return;

    // If we already have a prediction, do nothing
    if (prediction) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      const file = dataURLtoFile(imageSrc, `capture-${Date.now()}.png`);
      if (!file) {
        setError("Invalid image data");
        setLoading(false);
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      const [state, res] = await predict(fd);
      if (state === BaseStates.ERROR || !res) {
        setError("Prediction failed");
        setLoading(false);
        return;
      }
      const p = res as unknown as PredictionResult;
      setPrediction(p);
      setLoading(false);
    };

    run();
  }, [open, imageSrc, prediction]);

  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;

    const onResize = () => setContainer({w: el.clientWidth, h: el.clientHeight});
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const scale = useMemo(() => {
    if (!natural || !container.w || !container.h) return {x: 1, y: 1};
    // Image will be contained; compute aspect-fit scale
    const imgAspect = natural.w / natural.h;
    const boxAspect = container.w / container.h;
    if (imgAspect > boxAspect) {
      // Width fills
      const displayedW = container.w;
      const displayedH = displayedW / imgAspect;
      return {x: displayedW / natural.w, y: displayedH / natural.h};
    } else {
      // Height fills
      const displayedH = container.h;
      const displayedW = displayedH * imgAspect;
      return {x: displayedW / natural.w, y: displayedH / natural.h};
    }
  }, [natural, container]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detections</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {prediction?.bin_totals && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(prediction.bin_totals).map(([route, count]) => (
                <Badge key={route} variant="outline" className="text-xs">
                  {route}: {count}
                </Badge>
              ))}
            </div>
          )}
          <div
            ref={containerRef}
            className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
            {imageSrc && (
              <img
                src={imageSrc}
                alt="uploaded"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {/* overlays */}
            {prediction?.detections?.map((d, i) => {
              const [x1, y1, x2, y2] = d.bbox;
              const left = x1 * scale.x;
              const top = y1 * scale.y;
              const width = (x2 - x1) * scale.x;
              const height = (y2 - y1) * scale.y;
              return (
                <div
                  key={i}
                  className={cn("absolute border-2 rounded-md", "border-emerald-400/90")}
                  style={{left, top, width, height}}>
                  <div className="absolute -top-6 left-0 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {d.class_name} • {(d.confidence * 100).toFixed(0)}% • {d.route}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="absolute inset-0 grid place-items-center bg-background/60">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
            {error && !loading && (
              <div className="absolute inset-0 grid place-items-center text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
