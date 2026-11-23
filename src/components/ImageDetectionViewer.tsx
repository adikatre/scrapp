"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PredictionResult } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  prediction: PredictionResult;
};

export function ImageDetectionViewer({ open, onOpenChange, imageSrc, prediction }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Scanned photo</DialogTitle></DialogHeader>
        <div className="relative mx-auto max-w-full">
          <img src={imageSrc} alt="Photo used for this scan" className="max-h-[65vh] max-w-full"
            onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
          {size.width > 0 && prediction.detections.map((d, i) => {
            const [x1, y1, x2, y2] = d.bbox;
            return <div key={i} className="pointer-events-none absolute border-2 border-emerald-400 text-[10px] text-white"
              style={{ left: `${100*x1/size.width}%`, top: `${100*y1/size.height}%`,
                width: `${100*(x2-x1)/size.width}%`, height: `${100*(y2-y1)/size.height}%` }}>
              <span className="bg-emerald-900/90 px-1">{d.class_name}</span>
            </div>;
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
