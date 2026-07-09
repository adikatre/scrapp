"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavbar } from "@/hooks/useNavbar";

import {
  Camera as CameraIcon,
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
import { ScanHistorySheet } from "@/components/ScanHistorySheet";
import { predict } from "@/lib/backend";
import { BaseStates } from "@/lib/states";
import { ScanTicket } from "@/lib/types";
import { dataURLtoFile, summarizePrediction } from "@/lib/utils";
import {
  getDominantItemName,
  getDominantRoute
} from "@/lib/locationCategories";

interface MobileScanPageProps {
  activeTicket: ScanTicket | null;
  pastTickets: ScanTicket[];
  onScanComplete: (payload: {
    image: string | null;
    note?: string;
    guidance: string;
    disposalRoute: string;
    itemName: string;
  }) => void;
  onSelectTicket: (id: string) => void;
  onScanAgain: () => void;
  isMobile: boolean;
}

export default function MobileScanPage({
  activeTicket,
  pastTickets,
  onScanComplete,
  onSelectTicket,
  onScanAgain,
  isMobile
}: MobileScanPageProps) {
  const [note, setNote] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Webcam>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<
    string | null
  >(null);

  const { setDefaultShown } = useNavbar();

  useEffect(() => {
    setDefaultShown(false);
  }, [setDefaultShown]);

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

  const handleSwitchCamera = function () {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
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
        itemName: getDominantItemName(res)
      });
      setCapturedImage(null);
      setNote("");
    } catch (e) {
      toast.error("Prediction error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenActiveTicketViewer = function () {
    if (!activeTicket?.image) return;
    setSelectedImageForViewer(activeTicket.image);
    setViewerOpen(true);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Camera stage - fills the screen; this is the main focus */}
      {activeTicket ? (
        <>
          <img
            src={activeTicket.image ?? undefined}
            alt={activeTicket.itemName || "Scanned item"}
            onClick={handleOpenActiveTicketViewer}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto">
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
              className={`absolute inset-0 h-full w-full object-cover ${
                isCapturing ? "brightness-150" : ""
              }`}
              ref={cameraRef}
              mirrored={cameraFacingMode === "user"}
              videoConstraints={{
                facingMode: cameraFacingMode
              }}
            />
          )}

          {!capturedImage && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-20 left-6 w-7 h-7 border-l-2 border-t-2 border-white/70"></div>
              <div className="absolute top-20 right-6 w-7 h-7 border-r-2 border-t-2 border-white/70"></div>
              <div className="absolute bottom-40 left-6 w-7 h-7 border-l-2 border-b-2 border-white/70"></div>
              <div className="absolute bottom-40 right-6 w-7 h-7 border-r-2 border-b-2 border-white/70"></div>
            </div>
          )}

          {/* Bottom gradient for control legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 to-transparent" />

          {isAnalyzing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 className="size-8 animate-spin" />
                <p className="text-sm">Analyzing your item...</p>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 pb-8">
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
                  Scan
                </Button>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-8">
              <Button
                onClick={handleUploadImage}
                type="button"
                variant="secondary"
                size="icon"
                className="size-12 rounded-full bg-white/15 text-white hover:bg-white/25">
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
                <div className="size-20 flex items-center justify-center">
                  <CameraIcon
                    className={`size-10 transition-colors ${
                      isCapturing ? "text-white" : "text-gray-700"
                    }`}
                  />
                </div>
              </button>
              <div className="size-12" />
            </div>
          )}

          {isCapturing && (
            <div className="pointer-events-none absolute inset-0 bg-white/30 animate-pulse"></div>
          )}
        </>
      )}

      {/* Top overlay bar - history + camera switch, kept out of the way */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <ScanHistorySheet
          tickets={pastTickets}
          onSelect={onSelectTicket}
          side="left"
        />
        {!activeTicket && !capturedImage && isMobile && (
          <Button
            onClick={handleSwitchCamera}
            variant="secondary"
            size="icon"
            className="rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
            <RotateCcw className="size-5" />
            <span className="sr-only">Switch camera</span>
          </Button>
        )}
      </div>

      {/* Detection viewer modal */}
      <ImageDetectionViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageSrc={selectedImageForViewer}
      />
    </section>
  );
}
