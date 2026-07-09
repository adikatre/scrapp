"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { ScanHistory } from "@/components/ScanHistory";
import { ScanTicket } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ScanHistorySheetProps {
  tickets: ScanTicket[];
  onSelect: (id: string) => void;
  side?: "left" | "right";
  className?: string;
}

/** Floating icon button that reveals past scans in a slide-out sheet, for narrow screens. */
export function ScanHistorySheet({
  tickets,
  onSelect,
  side = "left",
  className
}: ScanHistorySheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "relative rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60",
            className
          )}>
          <History className="size-5" />
          {tickets.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {tickets.length}
            </span>
          )}
          <span className="sr-only">Past scans</span>
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-[300px] sm:w-[340px]">
        <SheetHeader>
          <SheetTitle>Past scans</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <ScanHistory
            tickets={tickets}
            onSelect={(id) => {
              onSelect(id);
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
