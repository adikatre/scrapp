"use client";

import {ComponentProps, useRef, useState} from "react";
import Webcam, {type WebcamProps} from "react-webcam";

export default function useCamera() {
  const webcamRef = useRef<Webcam>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const getCaptureImage = () => {
    if (webcamRef.current) {
      const imageData = webcamRef.current.getScreenshot();
      return imageData;
    }
  };

  const switchDirection = (facingMode?: "environment" | "user") => {
    if (facingMode) return setFacingMode(facingMode);

    if (webcamRef.current) {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      setFacingMode(newFacingMode);
    }
  };

  const Component = ({...props}: Partial<WebcamProps>) => {
    const propsToAssign = {
      ref: webcamRef,
      screenshotFormat: "image/png" as const,
      videoConstraints: {facingMode},

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
