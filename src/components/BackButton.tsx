"use client";

import {ArrowLeft} from "lucide-react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Button variant="outline" onClick={handleBack} className="w-full">
      <ArrowLeft className="h-4 w-4 mr-2" />
      Go Back
    </Button>
  );
}
