"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileChatPage from "@/app/cam/MobileChatPage";
import DesktopChatPage from "@/app/cam/DesktopChatPage";
import useMediaQuery from "@/hooks/useMediaQuery";

interface Message {
  id: string;
  message: string;
  image?: string | null;
  isUser: boolean;
  timestamp: Date;
  disposalRoute?: string;
  itemName?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const isMobile = useIsMobile();

  const meetsQuery = useMediaQuery(1100);

  const handleSendMessage = function (payload: {
    text?: string;
    image?: string | null;
  }) {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `${Date.now()}-${Math.random()}`,
        isUser: true,
        message: payload.text ?? "",
        image: payload.image ?? null,
        timestamp: new Date()
      }
    ]);
  };

  const handleAssistantMessage = function (payload: {
    message: string;
    disposalRoute?: string;
    itemName?: string;
  }) {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `${Date.now()}-${Math.random()}`,
        isUser: false,
        message: payload.message,
        disposalRoute: payload.disposalRoute,
        itemName: payload.itemName,
        timestamp: new Date()
      }
    ]);
  };

  if (!meetsQuery) {
    return (
      <MobileChatPage
        messages={messages}
        onSendMessage={handleSendMessage}
        onAssistantMessage={handleAssistantMessage}
        isMobile={isMobile ?? true}
      />
    );
  }

  return (
    <DesktopChatPage
      messages={messages}
      onSendMessage={handleSendMessage}
      onAssistantMessage={handleAssistantMessage}
    />
  );
}
