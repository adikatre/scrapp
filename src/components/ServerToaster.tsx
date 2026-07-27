"use client";

import {useEffect} from "react";
import {toast} from "sonner";

type Props = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function ServerToaster({message, type = "info", duration, action}: Props) {
  useEffect(() => {
    toast[type](message, {
      duration,
      action
    });
  }, [message, type, duration]);

  return <div className="absolute -top-20 -left-20 w-0 h-0 -z-10"></div>;
}
