"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavbar } from "@/hooks/useNavbar";

import {
  MessageCircleMore,
  Camera as CameraIcon,
  Send,
  X,
  Download,
  ImageIcon,
  Upload
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
import { ImageDetectionViewer } from "@/components/ImageDetectionViewer";
import { predict } from "@/lib/backend";
import { BaseStates } from "@/lib/states";
import { toast } from "sonner";
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

interface DesktopChatPageProps {
  messages: Message[];
  onSendMessage: (payload: { text?: string; image?: string | null }) => void;
  onAssistantMessage: (payload: {
    message: string;
    disposalRoute?: string;
    itemName?: string;
  }) => void;
}

export default function DesktopChatPage({
  messages,
  onSendMessage,
  onAssistantMessage
}: DesktopChatPageProps) {
  const [chatPrompt, setChatPrompt] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
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
      }, 200);
    }
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

      // Build FormData with text and optional file
      const fd = new FormData();
      if (prompt.trim()) fd.append("text", prompt.trim());
      if (capturedImage) {
        const file = dataURLtoFile(capturedImage, `capture-${Date.now()}.png`);
        if (file) {
          fd.append("file", file);
        } else {
          toast.error("Failed to process image");
        }
      }

      try {
        if (fd.has("text") || fd.has("file")) {
          const [state, res] = await predict(fd);
          if (state === BaseStates.ERROR || !res)
            return toast.error("Prediction failed");
          onAssistantMessage({
            message: summarizePrediction(res),
            disposalRoute: getDominantRoute(res),
            itemName: getDominantItemName(res)
          });
        }
      } catch (e) {
        toast.error("Prediction error");
      }
    }
  };

  const handleClearImage = function () {
    setCapturedImage(null);
  };

  return (
    <div className="h-screen flex p-6 gap-6 bg-gradient-to-br from-background to-muted/20">
      {/* Chat Section */}
      <Card className="shadow-lg border-muted/40 flex flex-col flex-3/5 max-w-[900px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageCircleMore />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-3 h-full overflow-y-scroll">
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
        <CardFooter className="flex-col gap-4">
          {capturedImage && (
            <div className="flex gap-2 justify-start items-start w-full">
              <div className="relative group max-w-xs">
                <img
                  src={capturedImage}
                  alt="Captured"
                  onClick={() => {
                    setSelectedImageForViewer(capturedImage);
                    setViewerOpen(true);
                  }}
                  className="h-32 w-auto rounded-lg border-2 border-muted shadow-md cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
                  <Button
                    onClick={handleDownloadImage}
                    size="sm"
                    variant="secondary"
                    className="p-2">
                    <Download className="size-4" />
                  </Button>
                  <Button
                    onClick={handleClearImage}
                    size="sm"
                    variant="destructive"
                    className="p-2">
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                  <ImageIcon className="size-3 inline mr-1" />
                  Captured
                </div>
              </div>
            </div>
          )}
          <div className="w-full flex items-center gap-2 p-0">
            <Textarea
              onKeyDown={handleTextareaKeypress}
              enterKeyHint="send"
              name="prompt"
              value={chatPrompt}
              onChange={handleModifyChatPrompt}
              placeholder="Type your message here..."
              className="flex-1 border outline-none resize-none h-22"
              rows={2}
            />
            <div className="h-full flex flex-col gap-2">
              <Button
                onClick={handleUploadImage}
                type="button"
                variant="outline"
                className="size-10">
                <Upload className="size-4" />
              </Button>
              <Button
                onClick={handleFormSubmit}
                variant="outline"
                className="size-10">
                <Send className="size-4 text-primary" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Camera Section */}
      <Card
        className={`shadow-lg border-muted/40 transition-all duration-300 flex-2/5 min-w-[650px]`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CameraIcon />
            Camera
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div className="relative rounded-xl overflow-hidden bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex-1">
            {cameraRef ? (
              <>
                <Webcam
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isCapturing ? "brightness-150 scale-105" : ""
                  }`}
                  ref={cameraRef}
                  mirrored={true}
                  videoConstraints={{
                    facingMode: "user"
                  }}
                />

                {/* Camera overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Viewfinder corners */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white/70"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white/70"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white/70"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white/70"></div>

                  {/* Camera info */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Front Camera
                  </div>
                </div>

                {/* Capture button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
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
                </div>

                {/* Capturing effect */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white/50 animate-pulse"></div>
                )}
              </>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center">
                <Loader />
              </div>
            )}
          </div>

          {capturedImage && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Photo captured! Add it to your message.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={handleDownloadImage}
                  variant="outline"
                  size="sm">
                  <Download className="size-4 mr-1" />
                  Save
                </Button>
                <Button onClick={handleClearImage} variant="outline" size="sm">
                  <Upload className="size-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection viewer modal */}
      <ImageDetectionViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageSrc={selectedImageForViewer}
      />
    </div>
  );
}
