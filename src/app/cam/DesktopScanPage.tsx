"use client";

import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import Webcam from "react-webcam";

import {
  Camera as CameraIcon,
  History,
  Loader2,
  RotateCcw,
  ScanLine,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ImageDetectionViewer } from "@/components/ImageDetectionViewer";
import { DisposalTicket } from "@/components/DisposalTicket";
import { ScanHistory } from "@/components/ScanHistory";
import { predict } from "@/lib/backend";
import { BaseStates } from "@/lib/states";
import { ScanTicket } from "@/lib/types";
import { dataURLtoFile, summarizePrediction } from "@/lib/utils";
import {
  getDominantItemName,
  getDominantRoute,
  getDominantSearchQueries
} from "@/lib/locationCategories";

interface DesktopScanPageProps {
  activeTicket: ScanTicket | null;
  pastTickets: ScanTicket[];
  onScanComplete: (payload: {
    image: string | null;
    note?: string;
    guidance: string;
    disposalRoute: string;
    itemName: string;
    searchQueries?: string[];
  }) => void;
  onSelectTicket: (id: string) => void;
  onScanAgain: () => void;
}

export default function DesktopScanPage({
  activeTicket,
  pastTickets,
  onScanComplete,
  onSelectTicket,
  onScanAgain
}: DesktopScanPageProps) {
  const [note, setNote] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<
    string | null
  >(null);

  const handleTextareaKeypress = function (
    e: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (e.shiftKey) return;

    if (e.key === "Enter") {
      e.preventDefault();

      handleScan();
    }
  };

  const handleCaptureImage = function () {
    if (cameraRef.current) {
      setIsCapturing(true);
      setTimeout(() => {
        const image = cameraRef.current?.getScreenshot();
        setCapturedImage(image || null);
        setIsCapturing(false);
      }, 200);
    }
  };

  const handleRetake = function () {
    setCapturedImage(null);
  };

  const handleUploadImage = function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCapturedImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    input.remove();
  };

  const handleModifyNote = function (e: ChangeEvent<HTMLTextAreaElement>) {
    setNote(e.target.value);
  };

  const handleOpenActiveTicketViewer = function () {
    if (!activeTicket?.image) return;
    setSelectedImageForViewer(activeTicket.image);
    setViewerOpen(true);
  };

  const handleScan = async function () {
    if (!capturedImage) {
      toast.error("Capture or upload a photo first");
      return;
    }

    const trimmedNote = note.trim();
    const file = dataURLtoFile(capturedImage, `capture-${Date.now()}.png`);
    if (!file) {
      toast.error("Failed to process image");
      return;
    }

    const fd = new FormData();
    if (trimmedNote) fd.append("text", trimmedNote);
    fd.append("file", file);

    setIsAnalyzing(true);
    try {
      const [state, res] = await predict(fd);
      if (state === BaseStates.ERROR || !res) {
        toast.error("Prediction failed");
        return;
      }
      onScanComplete({
        image: capturedImage,
        note: trimmedNote || undefined,
        guidance: summarizePrediction(res),
        disposalRoute: getDominantRoute(res),
        itemName: getDominantItemName(res),
        searchQueries: getDominantSearchQueries(res)
      });
      setCapturedImage(null);
      setNote("");
    } catch (e) {
      toast.error("Prediction error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-screen flex p-4 gap-4 bg-gradient-to-br from-background to-muted/20">
      {/* Camera stage - the main focus of the page */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-muted/40 bg-black shadow-lg">
        {activeTicket ? (
          <>
            <img
              src={activeTicket.image ?? undefined}
              alt={activeTicket.itemName || "Scanned item"}
              onClick={handleOpenActiveTicketViewer}
              className="absolute inset-0 h-full w-full cursor-pointer object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[65%] overflow-y-auto">
              <DisposalTicket
                ticket={activeTicket}
                hideImage
                onScanAgain={onScanAgain}
                className="flex-none rounded-b-none rounded-t-2xl border-x-0 border-b-0 bg-card/95 shadow-2xl backdrop-blur-xl"
              />
            </div>
          </>
        ) : (
          <>
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Webcam
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${
                  isCapturing ? "brightness-150 scale-105" : ""
                }`}
                ref={cameraRef}
                mirrored={true}
                videoConstraints={{
                  facingMode: "user"
                }}
              />
            )}

            {!capturedImage && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white/70"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white/70"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white/70"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white/70"></div>
              </div>
            )}

            {/* Bottom gradient for control legibility */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

            {isAnalyzing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="text-sm">Analyzing your item...</p>
                </div>
              </div>
            ) : capturedImage ? (
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
                <Textarea
                  onKeyDown={handleTextareaKeypress}
                  enterKeyHint="send"
                  name="note"
                  value={note}
                  onChange={handleModifyNote}
                  placeholder="Add a note (optional)..."
                  className="w-full resize-none border-white/20 bg-black/40 text-white placeholder:text-white/60 focus-visible:ring-white/30"
                  rows={1}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleRetake}
                    type="button"
                    variant="secondary"
                    className="bg-white/15 text-white hover:bg-white/25">
                    <RotateCcw className="size-4" />
                    Retake
                  </Button>
                  <Button onClick={handleScan} className="flex-1">
                    <ScanLine className="size-4" />
                    Analyze
                  </Button>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-6">
                <Button
                  onClick={handleUploadImage}
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-11 rounded-full bg-white/15 text-white hover:bg-white/25">
                  <Upload className="size-5" />
                </Button>
                <button
                  onClick={handleCaptureImage}
                  disabled={isCapturing}
                  className={`
                    relative rounded-full bg-white/90 hover:bg-white
                    border-4 border-white/50 hover:border-white/70
                    transition-all duration-200
                    ${
                      isCapturing
                        ? "scale-95 bg-primary animate-pulse"
                        : "hover:scale-110 active:scale-95"
                    }
                    shadow-lg hover:shadow-xl
                    disabled:cursor-not-allowed
                  `}>
                  <div className="size-16 flex items-center justify-center">
                    <CameraIcon
                      className={`size-8 transition-colors ${
                        isCapturing ? "text-white" : "text-gray-700"
                      }`}
                    />
                  </div>
                </button>
                <div className="size-11" />
              </div>
            )}

            {isCapturing && (
              <div className="pointer-events-none absolute inset-0 bg-white/50 animate-pulse"></div>
            )}
          </>
        )}
      </div>

      {/* Past scans - small, secondary sidebar */}
      <div className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-muted/40 bg-card/40 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <History className="size-4" />
          Past scans
          {pastTickets.length > 0 && <span>({pastTickets.length})</span>}
        </div>
        <div className="flex-1 overflow-y-auto">
          <ScanHistory tickets={pastTickets} onSelect={onSelectTicket} />
        </div>
      </div>

      {/* Detection viewer modal */}
      <ImageDetectionViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageSrc={selectedImageForViewer}
      />
    </div>
  );
}
