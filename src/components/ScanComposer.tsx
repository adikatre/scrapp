"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Webcam from "react-webcam";
import { Camera, FlipHorizontal2, Loader2, ScanLine, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { predict } from "@/lib/backend";
import { BaseStates } from "@/lib/states";
import { createScanTicket } from "@/lib/scanHistory";
import { getSanDiegoGuidance } from "@/lib/sanDiegoDisposal";
import type { PredictionResult, ScanTicket } from "@/lib/types";

export type ScanPreview = { url: string; prediction: PredictionResult };

// Crop neither labels nor safety markings. Re-encoding strips metadata and keeps
// phone photos below Next's 1 MiB Server Action request limit.
async function preparePhoto(src: string): Promise<{ file: File; preview: string }> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image conversion unavailable");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
  if (!blob || blob.size > 900 * 1024) throw new Error("Image conversion exceeded limit");
  return { file: new File([blob], "item.jpg", { type: "image/jpeg" }), preview: canvas.toDataURL("image/jpeg", 0.78) };
}

type Props = { onComplete: (ticket: ScanTicket, preview?: ScanPreview) => void };

export function ScanComposer({ onComplete }: Props) {
  const camera = useRef<Webcam>(null);
  const upload = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [front, setFront] = useState(false);
  const [photo, setPhoto] = useState<Awaited<ReturnType<typeof preparePhoto>> | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function loadPhoto(src: string) {
    setError("");
    setPreparing(true);
    try {
      const prepared = await preparePhoto(src);
      if (!mounted.current) return;
      setPhoto(prepared);
      setCameraOpen(false);
    } catch {
      if (mounted.current) setError("This photo could not be opened. Try a JPEG or PNG, or type the item below.");
    } finally {
      if (mounted.current) setPreparing(false);
    }
  }

  const typedName = note.trim();
  // An explicit, single-item lookup remains available with no model service.
  const localMatch = (!photo || !!error) && typedName.length <= 100 && !/[\n,;]/.test(typedName)
    && !/\b(and|plus|with)\b/i.test(typedName)
    ? getSanDiegoGuidance({ name: typedName }) : undefined;

  function useLocalGuide() {
    if (!localMatch) return;
    const ticket = createScanTicket({
      objects: [], detections: [], bin_totals: {}, text: "",
      classifier: { source: "local", basis: "note", model: "", fallback_used: false },
      items: [{ name: typedName, material: "", confidence: 0, caveats: "", route: localMatch.route,
        bin: localMatch.bin, search_queries: localMatch.searchQueries }]
    });
    if (ticket) onComplete(ticket);
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (busy.current || (!photo && !typedName)) return;
    busy.current = true;
    setAnalyzing(true);
    setError("");
    const form = new FormData();
    if (photo) form.set("file", photo.file);
    if (typedName) form.set("text", typedName);
    try {
      const [state, result, message] = await predict(form);
      if (!mounted.current) return;
      if (state === BaseStates.ERROR) {
        setError(message);
        return;
      }
      const ticket = createScanTicket(result, typedName);
      if (!ticket) {
        setError(result.text || "We couldn’t identify an item. Add a description or try a closer photo.");
        return;
      }
      onComplete(ticket, photo ? { url: photo.preview, prediction: result } : undefined);
    } catch {
      if (mounted.current) setError("Analysis was interrupted. Your input is still here to retry.");
    } finally {
      busy.current = false;
      if (mounted.current) setAnalyzing(false);
    }
  }

  return (
    <form onSubmit={analyze} aria-busy={analyzing || preparing}
      className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <fieldset disabled={analyzing || preparing} className="min-w-0">
        <div className="relative grid min-h-52 place-items-center overflow-hidden bg-gradient-to-br from-emerald-950 via-zinc-950 to-zinc-900 text-white sm:min-h-64">
          {photo ? (
            <>
              <img src={photo.preview} alt="Photo to analyze" className="h-56 w-full object-contain sm:h-72" />
              <Button type="button" size="sm" variant="secondary" className="absolute top-3 right-3"
                onClick={() => { setPhoto(null); setError(""); }}><X /> Remove photo</Button>
            </>
          ) : cameraOpen ? (
            <>
              <Webcam ref={camera} audio={false} mirrored={front} screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: front ? "user" : "environment" }}
                className="h-56 w-full object-contain sm:h-72"
                onUserMediaError={() => {
                  setCameraOpen(false);
                  setError("Camera access is unavailable. Upload a photo or type a description.");
                }} />
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                <Button variant="secondary" type="button" aria-label="Close camera" size="icon" onClick={() => setCameraOpen(false)}><X /></Button>
                <Button type="button" onClick={() => {
                  const capture = camera.current?.getScreenshot();
                  if (capture) void loadPhoto(capture);
                  else setError("The camera is still starting. Try again in a moment.");
                }}><Camera /> Take photo</Button>
                <Button variant="secondary" type="button" aria-label="Switch camera" size="icon" onClick={() => setFront(!front)}><FlipHorizontal2 /></Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-5 px-4 py-8">
              <ScanLine className="size-14 text-emerald-300" strokeWidth={1.25} aria-hidden />
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" onClick={() => { setError(""); setCameraOpen(true); }}><Camera /> Open camera</Button>
                <Button type="button" variant="secondary" onClick={() => upload.current?.click()}><Upload /> Upload photo</Button>
              </div>
            </div>
          )}
          {preparing && <div role="status" className="absolute inset-0 grid place-items-center bg-black/60">Preparing photo…</div>}
        </div>
        <input ref={upload} type="file" accept="image/*" aria-label="Upload an item photo" className="sr-only" tabIndex={-1}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            if (file.size > 32 * 1024 * 1024) { setError("Choose a photo smaller than 32 MB."); return; }
            const src = URL.createObjectURL(file);
            try { await loadPhoto(src); } finally { URL.revokeObjectURL(src); }
          }} />
        <div className="space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <label htmlFor="scan-note" className="text-sm font-medium">{photo ? "Add a detail (optional)" : "Or describe your item"}</label>
            <Textarea id="scan-note" name="text" value={note} maxLength={1000} rows={2}
              onChange={(event) => { setNote(event.target.value); setError(""); }}
              placeholder={photo ? "What should we know about its label or condition?" : "e.g. a small propane cylinder for a camping stove"} />
          </div>
          {error && <p role="alert" className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!photo && !typedName}>{analyzing ? <Loader2 className="animate-spin" /> : <ScanLine />}
              {analyzing ? "Analyzing…" : "Analyze item"}</Button>
            {localMatch && <Button type="button" variant="outline" onClick={useLocalGuide}>Use local guide</Button>}
          </div>
        </div>
      </fieldset>
    </form>
  );
}
