"use client";

import { useRef, useState } from "react";
import Webcam, { type WebcamProps } from "react-webcam";

export default function useCamera() {
  const webcamRef = useRef<Webcam>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("user");

  const getCaptureImage = () => {
    if (webcamRef.current) {
      const imageData = webcamRef.current.getScreenshot();
      return imageData;
    }
  };

  const switchDirection = (newFacingMode?: "environment" | "user") => {
    if (newFacingMode) return setFacingMode(newFacingMode);

    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const Component = ({ ...props }: Partial<WebcamProps>) => {
    const propsToAssign = {
      ref: webcamRef,
      screenshotFormat: "image/png" as const,
      videoConstraints: { facingMode },
      mirrored: facingMode === "user",

      ...props
    };

    return <Webcam {...propsToAssign} />;
  };

  return {
    getCaptureImage,
    switchDirection,
    Component
  };
}
