"use client";

import { useCallback, useRef, useState } from "react";
import type Webcam from "react-webcam";
import { toast } from "sonner";
import { predict } from "@/lib/backend";
import {
  getDominantBin,
  getDominantItemName,
  getDominantRoute,
  getDominantSearchQueries
} from "@/lib/locationCategories";
import { BaseStates } from "@/lib/states";
import { dataURLtoFile, summarizePrediction } from "@/lib/utils";

export interface UseScanViewOptions {
  onScanComplete: (payload: {
    image: string | null;
    note?: string;
    guidance: string;
    disposalRoute: string;
    bin?: string;
    itemName: string;
    searchQueries?: string[];
  }) => void;
}

export interface UseScanViewReturn {
  note: string;
  setNote: (note: string) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  cameraRef: React.RefObject<Webcam | null>;
  cameraFacingMode: "user" | "environment";
  setCameraFacingMode: (mode: "user" | "environment") => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
  isAnalyzing: boolean;
  handleCaptureImage: () => void;
  handleSwitchCamera: () => void;
  handleRetake: () => void;
  handleUploadImage: () => void;
  handleModifyNote: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleScan: () => Promise<void>;
  handleTextareaKeypress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function useScanView({ onScanComplete }: UseScanViewOptions): UseScanViewReturn {
  const [note, setNote] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Webcam>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCaptureImage = useCallback(() => {
    if (cameraRef.current) {
      setIsCapturing(true);
      setTimeout(() => {
        const image = cameraRef.current?.getScreenshot();
        setCapturedImage(image || null);
        setIsCapturing(false);
      }, 200);
    }
  }, []);

  const handleSwitchCamera = useCallback(() => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const handleUploadImage = useCallback(() => {
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
  }, []);

  const handleModifyNote = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  }, []);

  const handleScan = useCallback(async () => {
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
        bin: getDominantBin(res) || undefined,
        itemName: getDominantItemName(res),
        searchQueries: getDominantSearchQueries(res)
      });
      setCapturedImage(null);
      setNote("");
    } catch (_e) {
      toast.error("Prediction error");
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedImage, note, onScanComplete]);

  const handleTextareaKeypress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.shiftKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleScan();
      }
    },
    [handleScan]
  );

  return {
    note,
    setNote,
    capturedImage,
    setCapturedImage,
    cameraRef,
    cameraFacingMode,
    setCameraFacingMode,
    isCapturing,
    setIsCapturing,
    isAnalyzing,
    handleCaptureImage,
    handleSwitchCamera,
    handleRetake,
    handleUploadImage,
    handleModifyNote,
    handleScan,
    handleTextareaKeypress
  };
}
