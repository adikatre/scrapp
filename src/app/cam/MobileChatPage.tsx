"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavbar } from "@/hooks/useNavbar";

import {
  MessageCircleMore,
  Camera as CameraIcon,
  Send,
  Trash,
  X,
  RotateCcw,
  Download,
  ImageIcon
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/MessageBubble";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import { ImageDetectionViewer } from "@/components/ImageDetectionViewer";
import { predict } from "@/lib/backend";
import { BaseStates } from "@/lib/states";
import { PredictionResult } from "@/lib/types";
import { dataURLtoFile, summarizePrediction } from "@/lib/utils";
import {
  getDominantItemName,
  getDominantRoute
} from "@/lib/locationCategories";

interface Message {
  id: string;
  message: string;
  image?: string | null;
  isUser: boolean;
  timestamp: Date;
  disposalRoute?: string;
  itemName?: string;
}

interface MobileChatPageProps {
  messages: Message[];
  onSendMessage: (payload: { text?: string; image?: string | null }) => void;
  onAssistantMessage: (payload: {
    message: string;
    disposalRoute?: string;
    itemName?: string;
  }) => void;
  isMobile: boolean;
}

export default function MobileChatPage({
  messages,
  onSendMessage,
  onAssistantMessage,
  isMobile
}: MobileChatPageProps) {
  const [chatPrompt, setChatPrompt] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Webcam>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("environment");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
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

      handleFormSubmit();
    }
  };

  const handleCaptureImage = function () {
    if (cameraRef.current) {
      setIsCapturing(true);
      setTimeout(() => {
        const image = cameraRef.current?.getScreenshot();
        setCapturedImage(image || null);
        setIsCapturing(false);
        setShowCamera(false); // Hide camera after capture on mobile
      }, 200);
    }
  };

  const handleSwitchCamera = function () {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleDownloadImage = function () {
    if (capturedImage) {
      const link = document.createElement("a");
      link.download = `capture-${Date.now()}.png`;
      link.href = capturedImage;
      link.click();
      link.remove();
    }
  };

  const handleCameraButton = function () {
    if (!isMobile) return setShowCamera(!showCamera);

    handleUploadImage();
  };

  const handleUploadImage = function () {
    setIsCapturing(true);
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
    setIsCapturing(false);
  };

  const handleModifyChatPrompt = function (
    e: ChangeEvent<HTMLTextAreaElement>
  ) {
    setChatPrompt(e.target.value);
  };

  const handleFormSubmit = async function () {
    const prompt = chatPrompt;

    if (prompt.trim() || capturedImage) {
      setChatPrompt("");
      onSendMessage({ text: prompt.trim() || undefined, image: capturedImage });

      const fd = new FormData();
      if (prompt.trim()) fd.append("text", prompt.trim());
      if (capturedImage) {
        const file = dataURLtoFile(capturedImage, `capture-${Date.now()}.png`);
        if (file) fd.append("file", file);
      }

      try {
        if (fd.has("text") || fd.has("file")) {
          const [state, res] = await predict(fd);
          if (state === BaseStates.ERROR || !res) return;
          onAssistantMessage({
            message: summarizePrediction(res),
            disposalRoute: getDominantRoute(res),
            itemName: getDominantItemName(res)
          });
        }
      } catch (e) {
        // ignore for now
      }
    }
  };

  const handleClearImage = function () {
    setCapturedImage(null);
  };

  const getCameraFacingMode = function () {
    if (!isMobile) return "Camera";

    return cameraFacingMode === "user" ? "Front Camera" : "Back Camera";
  };

  return (
    <section className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Chat Section */}
      <Card className="flex-1 m-3 shadow-lg border-muted/40 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircleMore />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-scroll px-4">
          {messages.map((message) => (
            <MessageBubble
              {...message}
              key={message.id}
              onImageClick={(src) => {
                setSelectedImageForViewer(src);
                setViewerOpen(true);
              }}
            />
          ))}
        </CardContent>
        <CardFooter className="flex-col gap-3 p-4">
          {capturedImage && (
            <div className="flex gap-2 justify-start items-start w-full">
              <div className="relative group max-w-[200px]">
                <img
                  src={capturedImage}
                  alt="Captured"
                  onClick={() => {
                    setSelectedImageForViewer(capturedImage);
                    setViewerOpen(true);
                  }}
                  className="h-24 w-auto rounded-lg border-2 border-muted shadow-md cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                  <Button
                    onClick={handleDownloadImage}
                    size="sm"
                    variant="secondary"
                    className="p-1.5">
                    <Download className="size-3" />
                  </Button>
                  <Button
                    onClick={handleClearImage}
                    size="sm"
                    variant="destructive"
                    className="p-1.5">
                    <X className="size-3" />
                  </Button>
                </div>
                <div className="absolute top-1 left-1 bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded text-xs font-medium">
                  <ImageIcon className="size-2 inline mr-1" />
                  Photo
                </div>
              </div>
            </div>
          )}
          <div className="w-full flex items-end gap-2 p-0">
            <div className="flex-1">
              <Textarea
                enterKeyHint="send"
                name="prompt"
                value={chatPrompt}
                onChange={handleModifyChatPrompt}
                onKeyDown={handleTextareaKeypress}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-32 border outline-none resize-none"
                rows={1}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCameraButton}
                type="button"
                variant="outline"
                className="size-11 p-0">
                <CameraIcon className="size-5" />
              </Button>
              <Button
                onClick={handleFormSubmit}
                variant="default"
                className="size-11 p-0">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Camera Section - Fullscreen overlay on mobile */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <Button
              onClick={() => setShowCamera(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20">
              <X className="size-5 mr-1" />
              Close
            </Button>
            <div className="text-sm font-medium absolute left-1/2 -translate-x-1/2">
              {getCameraFacingMode()}
            </div>
            {isMobile && (
              <Button
                onClick={handleSwitchCamera}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20">
                <RotateCcw className="size-4 mr-1" />
                Switch
              </Button>
            )}
          </div>

          <div className="flex-1 relative">
            <Webcam
              className={`w-full h-full object-cover ${
                isCapturing ? "brightness-150" : ""
              }`}
              ref={cameraRef}
              mirrored={cameraFacingMode === "user"}
              videoConstraints={{
                facingMode: cameraFacingMode
              }}
            />

            {/* Camera overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Viewfinder corners */}
              <div className="absolute top-8 left-8 w-8 h-8 border-l-3 border-t-3 border-white/70"></div>
              <div className="absolute top-8 right-8 w-8 h-8 border-r-3 border-t-3 border-white/70"></div>
              <div className="absolute bottom-32 left-8 w-8 h-8 border-l-3 border-b-3 border-white/70"></div>
              <div className="absolute bottom-32 right-8 w-8 h-8 border-r-3 border-b-3 border-white/70"></div>
            </div>

            {/* Capture button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
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
            </div>

            {isCapturing && (
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            )}
          </div>
        </div>
      )}

      {/* Detection viewer modal */}
      <ImageDetectionViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageSrc={selectedImageForViewer}
      />
    </section>
  );
}
