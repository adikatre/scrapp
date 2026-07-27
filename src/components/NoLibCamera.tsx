"use client";

import {Camera as CameraIcon, X} from "lucide-react";
import {useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

interface CameraProps {
  onCapture?: (imageData: string) => void;
  onClose?: () => void;
  className?: string;
}

export function ManualCamera({onCapture, onClose, className}: CameraProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    if (isActive) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: "environment"}
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        setStream(mediaStream);
        setIsActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg");
        onCapture?.(imageData);
        stopCamera();
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CameraIcon className="h-5 w-5" />
              Camera
            </h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="relative">
            {isActive ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                  style={{aspectRatio: "4/3"}}
                />
                <div className="flex gap-2 justify-center">
                  <Button onClick={captureImage}>Capture Photo</Button>
                  <Button variant="outline" onClick={stopCamera}>
                    Stop Camera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div
                  className="w-full bg-gray-100 rounded-lg flex items-center justify-center"
                  style={{aspectRatio: "4/3"}}>
                  <CameraIcon className="h-12 w-12 text-gray-400" />
                </div>
                <Button onClick={startCamera}>Start Camera</Button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
    </Card>
  );
}
