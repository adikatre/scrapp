"use client";

import {
  AlertCircle,
  Camera as CameraIcon,
  Home,
  ImagePlus,
  Loader2,
  MessageSquareText,
  RotateCcw,
  ScanLine,
  SwitchCamera,
  Upload
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from "react";
import Webcam from "react-webcam";
import { DisposalTicket } from "@/components/DisposalTicket";
import { ImageDetectionViewer } from "@/components/ImageDetectionViewer";
import { ScanHistory } from "@/components/ScanHistory";
import { ScanHistorySheet } from "@/components/ScanHistorySheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackProductEvent } from "@/lib/analytics";
import { decideCandidate, predict } from "@/lib/backend";
import { getOrCreateDeviceId } from "@/lib/device-id";
import {
  getDominantBin,
  getDominantItemName,
  getDominantRoute,
  getDominantSearchQueries
} from "@/lib/locationCategories";
import type { IdentificationCandidate } from "@/lib/rules/types";
import { BaseStates } from "@/lib/states";
import type { ScanTicket, ScanTicketPayload } from "@/lib/types";
import { dataURLtoFile, summarizePrediction } from "@/lib/utils";

type CameraErrorCode =
  | "denied"
  | "unavailable"
  | "insecure"
  | "busy"
  | "invalid"
  | "request"
  | "timeout";

type ScanUiState =
  | { kind: "permission" }
  | { kind: "ready" }
  | { kind: "review"; image: string }
  | { kind: "analyzing"; image: string }
  | {
      kind: "choice";
      image: string | null;
      note?: string;
      inputMode: "photo" | "describe";
      candidates: IdentificationCandidate[];
    }
  | { kind: "error"; code: CameraErrorCode; title: string; message: string; image?: string };

export interface ScanViewProps {
  activeTicket: ScanTicket | null;
  pastTickets: ScanTicket[];
  onScanComplete: (payload: ScanTicketPayload) => void;
  onSelectTicket: (id: string) => void;
  onScanAgain: () => void;
  isMobile?: boolean;
}

function cameraFailure(error: unknown): Extract<ScanUiState, { kind: "error" }> {
  if (!window.isSecureContext) {
    return {
      kind: "error",
      code: "insecure",
      title: "Camera needs a secure connection",
      message: "Open Scrapp over HTTPS, or upload a photo instead."
    };
  }
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return {
      kind: "error",
      code: "denied",
      title: "Camera access is blocked",
      message:
        "Allow camera access in your browser settings, then try again. Upload still works without permission."
    };
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return {
      kind: "error",
      code: "unavailable",
      title: "No camera was found",
      message: "Connect or enable a camera, or choose a photo from this device."
    };
  }
  if (error instanceof DOMException && error.name === "NotReadableError") {
    return {
      kind: "error",
      code: "busy",
      title: "The camera is unavailable",
      message: "Another app may be using it. Close that app and retry, or upload a photo."
    };
  }
  return {
    kind: "error",
    code: "unavailable",
    title: "Camera could not start",
    message: "Retry camera access or upload a photo instead."
  };
}

export function ScanView({
  activeTicket,
  pastTickets,
  onScanComplete,
  onSelectTicket,
  onScanAgain,
  isMobile = false
}: ScanViewProps) {
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [inputMode, setInputMode] = useState<"photo" | "describe">("photo");
  const [uiState, setUiState] = useState<ScanUiState>({ kind: "permission" });
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<string | null>(null);
  const cameraRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reviewImage =
    uiState.kind === "review" || uiState.kind === "analyzing"
      ? uiState.image
      : uiState.kind === "error"
        ? uiState.image
        : undefined;

  const handleTextareaKeypress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      if (inputMode === "describe") void handleDescribe();
      else void handleScan();
    }
  };

  const getLocalContext = () => {
    try {
      const raw = localStorage.getItem("scrapp-service-profile-v1");
      const profile = raw
        ? (JSON.parse(raw) as { jurisdictionId?: string; serviceProfileId?: string })
        : null;
      return {
        jurisdictionId: profile?.jurisdictionId || "us-ca-san-diego",
        serviceProfileId: profile?.serviceProfileId || "sd-city-serviced-home"
      };
    } catch {
      return {
        jurisdictionId: "us-ca-san-diego",
        serviceProfileId: "sd-city-serviced-home"
      };
    }
  };

  const appendLocalContext = (formData: FormData) => {
    const context = getLocalContext();
    formData.append("clientId", getOrCreateDeviceId());
    formData.append("jurisdictionId", context.jurisdictionId);
    formData.append("serviceProfileId", context.serviceProfileId);
  };

  const requestCamera = async () => {
    if (!window.isSecureContext) {
      setUiState(cameraFailure(new Error("insecure")));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setUiState({
        kind: "error",
        code: "unavailable",
        title: "Camera is not supported here",
        message: "Use a current browser or upload a photo from this device."
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: false
      });
      for (const track of stream.getTracks()) track.stop();
      setUiState({ kind: "ready" });
    } catch (error) {
      setUiState(cameraFailure(error));
    }
  };

  const handleCaptureImage = () => {
    setIsCapturing(true);
    window.setTimeout(() => {
      const image = cameraRef.current?.getScreenshot();
      if (image) setUiState({ kind: "review", image });
      else
        setUiState({
          kind: "error",
          code: "invalid",
          title: "Photo was not captured",
          message: "Hold the device steady and try again."
        });
      setIsCapturing(false);
    }, 120);
  };

  const handleRetake = () => setUiState({ kind: "ready" });
  const handleUploadImage = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUiState({
        kind: "error",
        code: "invalid",
        title: "That file is not an image",
        message: "Choose a JPG, PNG, HEIC, or another image file."
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const image = loadEvent.target?.result;
      if (typeof image === "string") setUiState({ kind: "review", image });
      else
        setUiState({
          kind: "error",
          code: "invalid",
          title: "Photo could not be read",
          message: "Choose a different image and try again."
        });
    };
    reader.onerror = () =>
      setUiState({
        kind: "error",
        code: "invalid",
        title: "Photo could not be read",
        message: "Choose a different image and try again."
      });
    reader.readAsDataURL(file);
  };

  const handleOpenActiveTicketViewer = () => {
    if (!activeTicket?.image) return;
    setSelectedImageForViewer(activeTicket.image);
    setViewerOpen(true);
  };

  const handleScanAgain = () => {
    setNote("");
    setUiState({ kind: "ready" });
    onScanAgain();
  };

  const handleScan = async () => {
    if (uiState.kind !== "review") return;
    const image = uiState.image;
    const trimmedNote = note.trim();
    const file = dataURLtoFile(image, `capture-${Date.now()}.png`);
    if (!file) {
      setUiState({
        kind: "error",
        code: "invalid",
        title: "Photo could not be processed",
        message: "Retake the photo or upload a different image.",
        image
      });
      return;
    }

    const formData = new FormData();
    if (trimmedNote) formData.append("text", trimmedNote);
    formData.append("file", file);
    appendLocalContext(formData);
    trackProductEvent("analysis_started", { input_mode: "photo" });
    setUiState({ kind: "analyzing", image });

    try {
      const timeout = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("timeout")), 20_000)
      );
      const [state, result] = await Promise.race([predict(formData), timeout]);
      if (state === BaseStates.ERROR || !result) {
        setUiState({
          kind: "error",
          code: "request",
          title: "We could not classify this item",
          message: "Check your connection and try this photo again, or retake it in clearer light.",
          image
        });
        return;
      }
      if (result.requiresChoice && result.identificationCandidates?.length) {
        setUiState({
          kind: "choice",
          image,
          note: trimmedNote || undefined,
          inputMode: "photo",
          candidates: result.identificationCandidates
        });
        return;
      }
      onScanComplete({
        image,
        note: trimmedNote || undefined,
        guidance: summarizePrediction(result),
        disposalRoute: getDominantRoute(result),
        bin: getDominantBin(result) || undefined,
        itemName: getDominantItemName(result),
        searchQueries: result.decision?.searchQueries ?? getDominantSearchQueries(result),
        inputMode: "photo",
        decision: result.decision
      });
      trackProductEvent("analysis_succeeded", { input_mode: "photo" });
      setNote("");
      setUiState({ kind: "ready" });
    } catch (error) {
      trackProductEvent("analysis_failed", { input_mode: "photo" });
      const timedOut = error instanceof Error && error.message === "timeout";
      setUiState({
        kind: "error",
        code: timedOut ? "timeout" : "request",
        title: timedOut ? "Analysis took too long" : "The request did not finish",
        message: timedOut
          ? "The 20-second wait ended. Try this photo again or retake it."
          : "Check your connection and retry without losing the photo.",
        image
      });
    }
  };

  const handleDescribe = async () => {
    const text = description.trim();
    if (text.length < 2) return;
    setUiState({ kind: "analyzing", image: "" });
    const formData = new FormData();
    formData.append("text", text);
    appendLocalContext(formData);
    trackProductEvent("analysis_started", { input_mode: "describe" });
    try {
      const [state, result] = await predict(formData);
      if (state === BaseStates.ERROR || !result) throw new Error("unavailable");
      if (result.requiresChoice && result.identificationCandidates?.length) {
        setUiState({
          kind: "choice",
          image: null,
          note: text,
          inputMode: "describe",
          candidates: result.identificationCandidates
        });
        return;
      }
      onScanComplete({
        image: null,
        note: text,
        guidance: summarizePrediction(result),
        disposalRoute: getDominantRoute(result),
        bin: result.decision?.bin ?? getDominantBin(result) ?? undefined,
        itemName: result.decision?.itemName ?? getDominantItemName(result),
        searchQueries: result.decision?.searchQueries ?? getDominantSearchQueries(result),
        inputMode: "describe",
        decision: result.decision
      });
      setDescription("");
      setUiState({ kind: "permission" });
      trackProductEvent("analysis_succeeded", { input_mode: "describe" });
    } catch {
      trackProductEvent("analysis_failed", { input_mode: "describe" });
      setUiState({
        kind: "error",
        code: "request",
        title: "We need a little more detail",
        message:
          "Try a more specific item or material, such as plastic film, battery, or food-soiled paper."
      });
    }
  };

  const handleCandidateChoice = async (candidate: IdentificationCandidate) => {
    if (uiState.kind !== "choice") return;
    const choice = uiState;
    setUiState({ kind: "analyzing", image: choice.image || "" });
    const context = getLocalContext();
    const decision = await decideCandidate(
      candidate,
      context.jurisdictionId,
      context.serviceProfileId
    );
    if (!decision) {
      setUiState({
        kind: "error",
        code: "request",
        title: "Local rule not confirmed",
        message:
          "Choose your collection service in Settings, or check the material guide and official source."
      });
      return;
    }
    onScanComplete({
      image: choice.image,
      note: choice.note,
      guidance: [decision.instruction, ...decision.preparation].join("\n"),
      disposalRoute: decision.route,
      bin: decision.bin,
      itemName: candidate.name,
      searchQueries: decision.searchQueries,
      inputMode: choice.inputMode,
      decision
    });
    setUiState({ kind: choice.inputMode === "photo" ? "ready" : "permission" });
    trackProductEvent("analysis_succeeded", { input_mode: choice.inputMode });
  };

  const renderChoice = (state: Extract<ScanUiState, { kind: "choice" }>) => (
    <div className="absolute inset-0 overflow-y-auto bg-[#0a0f0e] px-5 pb-24 pt-28 text-white">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-teal-200">
          Confirm the item
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Which item did you mean?
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Scrapp found more than one plausible match. Choose one before a local rule is applied.
        </p>
        <div className="mt-7 space-y-3">
          {state.candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => void handleCandidateChoice(candidate)}
              className="flex min-h-16 w-full items-center justify-between gap-4 rounded-[14px] border border-white/12 bg-white/[0.05] p-4 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200">
              <span>
                <span className="block font-semibold">{candidate.name}</span>
                <span className="mt-1 block text-sm text-white/55">{candidate.material}</span>
              </span>
              <span className="text-xs font-semibold text-teal-200">
                {Math.round(candidate.confidence * 100)}% match
              </span>
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          className="mt-5 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={() =>
            setUiState(
              state.inputMode === "photo" && state.image
                ? { kind: "review", image: state.image }
                : { kind: "permission" }
            )
          }>
          Back
        </Button>
      </div>
    </div>
  );

  const renderDescribe = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_18%,#244640_0,transparent_34%),#0a0f0e] px-5 text-white">
      <div className="w-full max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-teal-200">
          Describe an item
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          What are you trying to sort?
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
          Name the item, material, and condition. This searches Scrapp's verified local material
          index without using vision.
        </p>
        <Textarea
          autoFocus
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onKeyDown={handleTextareaKeypress}
          placeholder="Example: greasy pizza box"
          className="mt-7 min-h-28 border-white/20 bg-white/[0.06] text-base text-white placeholder:text-white/45"
        />
        <Button
          size="lg"
          className="mt-3 w-full"
          onClick={() => void handleDescribe()}
          disabled={description.trim().length < 2}>
          <ScanLine className="size-5" /> Check local guidance
        </Button>
      </div>
    </div>
  );

  const renderPermission = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_22%,#244640_0,transparent_36%),#0a0f0e] px-5 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.06]">
          <CameraIcon className="size-7 text-teal-200" />
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.17em] text-teal-200">
          Start a scan
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Show Scrapp what you are sorting.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/60">
          Camera access is requested only after you choose it. Uploading a photo works without
          camera permission.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={() => void requestCamera()}>
            <CameraIcon className="size-5" /> Use camera
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleUploadImage}
            className="border-white/20 bg-white/[0.04] text-white hover:bg-white/10">
            <Upload className="size-5" /> Upload a photo
          </Button>
        </div>
      </div>
    </div>
  );

  const renderError = (state: Extract<ScanUiState, { kind: "error" }>) => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f0e] px-5 text-white">
      {state.image && (
        <img
          src={state.image}
          alt="Item ready to retry"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}
      <div className="relative w-full max-w-md rounded-[20px] border border-white/10 bg-black/65 p-6 text-center backdrop-blur-xl">
        <AlertCircle className="mx-auto size-7 text-amber-300" />
        <h2 className="font-display mt-4 text-2xl font-semibold">{state.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">{state.message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {state.image ? (
            <Button onClick={() => setUiState({ kind: "review", image: state.image as string })}>
              <RotateCcw className="size-4" /> Try this photo again
            </Button>
          ) : (
            <Button onClick={() => void requestCamera()}>
              <CameraIcon className="size-4" /> Retry camera
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleUploadImage}
            className="border-white/20 bg-white/[0.04] text-white hover:bg-white/10">
            <ImagePlus className="size-4" /> Choose a photo
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCameraView = () => {
    if (activeTicket) {
      return (
        <>
          {activeTicket.image && (
            <button
              type="button"
              onClick={handleOpenActiveTicketViewer}
              aria-label="Open scanned item image"
              className="absolute inset-0">
              <img
                src={activeTicket.image}
                alt={activeTicket.itemName || "Scanned item"}
                className="h-full w-full object-cover"
              />
            </button>
          )}
          <div className="absolute inset-x-0 bottom-0 max-h-[78%] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <DisposalTicket
              ticket={activeTicket}
              hideImage
              onScanAgain={handleScanAgain}
              className="flex-none rounded-b-none rounded-t-[22px] border-x-0 border-b-0 bg-card/96 shadow-2xl backdrop-blur-xl"
            />
          </div>
        </>
      );
    }
    if (uiState.kind === "choice") return renderChoice(uiState);
    if (inputMode === "describe" && uiState.kind === "analyzing")
      return <div className="absolute inset-0 bg-[#0a0f0e]" />;
    if (inputMode === "describe" && uiState.kind !== "error") return renderDescribe();
    if (uiState.kind === "permission") return renderPermission();
    if (uiState.kind === "error") return renderError(uiState);
    if (reviewImage)
      return (
        <img
          src={reviewImage}
          alt="Item ready for review"
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
    return (
      <Webcam
        className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-120 ${isCapturing ? "brightness-150" : ""}`}
        ref={cameraRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.88}
        mirrored={cameraFacingMode === "user"}
        onUserMediaError={(error) => setUiState(cameraFailure(error))}
        videoConstraints={{ facingMode: cameraFacingMode }}
      />
    );
  };

  const renderControls = () => {
    if (
      activeTicket ||
      (inputMode === "describe" && uiState.kind !== "analyzing") ||
      uiState.kind === "choice" ||
      uiState.kind === "permission" ||
      uiState.kind === "error"
    )
      return null;
    if (uiState.kind === "analyzing") {
      return (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/58 px-5"
          role="status"
          aria-live="polite">
          <div className="rounded-[18px] border border-white/12 bg-black/55 p-6 text-center text-white backdrop-blur-xl">
            <Loader2 className="mx-auto size-7 animate-spin text-teal-200" />
            <p className="font-display mt-4 text-lg font-semibold">Analyzing the item</p>
            <p className="mt-2 text-sm text-white/60">This can take up to 20 seconds.</p>
          </div>
        </div>
      );
    }
    if (uiState.kind === "review") {
      return (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/78 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-20 sm:px-6 sm:pb-6">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-3 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-200">
                  Photo review
                </p>
                <p className="mt-1 text-sm text-white/65">
                  Make sure the item is clear before analysis.
                </p>
              </div>
            </div>
            <Textarea
              onKeyDown={handleTextareaKeypress}
              enterKeyHint="send"
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note, like the material or condition (optional)"
              className="min-h-12 resize-none border-white/20 bg-black/45 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              rows={1}
            />
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
              <Button
                onClick={handleRetake}
                type="button"
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25">
                <RotateCcw className="size-4" /> Retake
              </Button>
              <Button onClick={() => void handleScan()}>
                <ScanLine className="size-4" /> Analyze item
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 landscape:py-3">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Button
            onClick={handleUploadImage}
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Upload a photo"
            className="size-12 justify-self-start rounded-full bg-white/15 text-white hover:bg-white/25">
            <Upload className="size-5" />
          </Button>
          <button
            type="button"
            onClick={handleCaptureImage}
            disabled={isCapturing}
            aria-label="Take photo"
            className="flex size-[76px] items-center justify-center rounded-full border-[5px] border-white/45 bg-white text-[#172220] shadow-xl transition-transform duration-120 active:scale-95 disabled:opacity-60">
            <CameraIcon className="size-8" />
          </button>
          <Button
            onClick={() =>
              setCameraFacingMode((value) => (value === "user" ? "environment" : "user"))
            }
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Switch camera"
            className="size-12 justify-self-end rounded-full bg-white/15 text-white hover:bg-white/25">
            <SwitchCamera className="size-5" />
          </Button>
        </div>
      </div>
    );
  };

  const stage = (
    <div className="relative h-full w-full">
      {renderCameraView()}
      {renderControls()}
      {isCapturing && <div className="pointer-events-none absolute inset-0 bg-white/30" />}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        aria-label="Item scanner"
        className="relative h-[100dvh] w-full overflow-hidden bg-black">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
        {isMobile ? (
          stage
        ) : (
          <div className="flex h-full w-full">
            <aside className="flex w-[min(23rem,28vw)] min-w-72 flex-none flex-col border-r border-white/10 bg-[#0a0f0e] text-white">
              <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-4">
                <h2 className="font-display text-sm font-semibold">Past scans</h2>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:bg-white/10 hover:text-white">
                  <Link href="/">
                    <Home className="size-4" /> Home
                  </Link>
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ScanHistory tickets={pastTickets} onSelect={onSelectTicket} />
              </div>
            </aside>
            <div className="relative min-w-0 flex-1">{stage}</div>
          </div>
        )}
        {!activeTicket && uiState.kind !== "analyzing" && uiState.kind !== "choice" && (
          <div className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex -translate-x-1/2 rounded-xl border border-white/12 bg-black/55 p-1 text-white backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                setInputMode("photo");
                setUiState({ kind: "permission" });
              }}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${inputMode === "photo" ? "bg-white text-black" : "text-white/70"}`}>
              <CameraIcon className="mr-2 inline size-4" /> Photo
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("describe");
                setUiState({ kind: "permission" });
              }}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${inputMode === "describe" ? "bg-white text-black" : "text-white/70"}`}>
              <MessageSquareText className="mr-2 inline size-4" /> Describe
            </button>
          </div>
        )}
        {isMobile && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Button
              asChild
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full border border-white/15 bg-black/40 text-white backdrop-blur hover:bg-black/60">
              <Link href="/" aria-label="Home">
                <Home className="size-5" />
              </Link>
            </Button>
            <ScanHistorySheet
              tickets={pastTickets}
              onSelect={onSelectTicket}
              side="right"
              className="pointer-events-auto"
            />
          </div>
        )}
        <ImageDetectionViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          imageSrc={selectedImageForViewer}
        />
      </motion.section>
    </MotionConfig>
  );
}
