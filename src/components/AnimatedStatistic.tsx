"use client";

import { useEffect, useState } from "react";
import { useOnScreen } from "@/hooks/useOnScreen";
import { cn } from "@/lib/utils";

interface AnimatedStatisticProps {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  increment?: number;
  className?: string;
}

export function AnimatedStatistic({
  icon: Icon,
  value,
  label,
  suffix = "",
  increment = 1,
  className
}: AnimatedStatisticProps) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = value;
      if (start === end) return;

      let duration = 2000 / (end / increment);
      if (end > 1000) duration = 0.1;
      if (end < 100) duration = 25;

      const timer = setInterval(() => {
        start += increment;
        if (start > end) start = end;
        setCount(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, duration);

      return () => clearInterval(timer);
    }
  }, [isVisible, value, increment]);

  return (
    <div ref={ref} className={cn("flex flex-col items-center", className)}>
      <Icon className="h-8 w-8 text-primary mb-2" />
      <p className="text-3xl font-bold tabular-nums">
        {count}
        {suffix}
      </p>
      <p className="text-sm text-muted-foreground text-center">{label}</p>
    </div>
  );
}
