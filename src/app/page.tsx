"use client";

import { ArrowDown, ArrowRight, Camera, Github, Globe, Recycle, Trash2 } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recyclables } from "@/data/recyclables";
import { cn } from "@/lib/utils";

const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isVisible] as const;
};

const AnimatedStatistic = ({
  icon: Icon,
  value,
  label,
  suffix = ""
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  useEffect(() => {
    if (!isVisible) return;
    if (value <= 0) {
      setCount(0);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(value);
      return;
    }

    const durationMs = 1500;
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.min(value, Math.round(eased * value));
      setCount(current);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isVisible, value]);

  return (
    <div
      ref={ref}
      className={cn(
        "transform transition-all duration-1000 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
      <Card className="bg-card/50 text-center p-6 h-full">
        <Icon className="mx-auto h-12 w-12 text-primary mb-4" />
        <p className="text-4xl font-bold text-foreground">
          {count.toLocaleString()}
          {suffix}
        </p>
        <p className="text-muted-foreground mt-2">{label}</p>
      </Card>
    </div>
  );
};

export default function HomePage() {
  const [mainCardRef, isMainCardVisible] = useOnScreen({ threshold: 0.1 });
  const [recyclablesRef, isRecyclablesVisible] = useOnScreen({ threshold: 0.15 });
  const statsSectionRef = useRef<HTMLElement>(null);

  const handleScrollDown = () => {
    statsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <section className="flex flex-col items-center justify-center h-screen p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-0 video-container">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/hero-video-loop-2k.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          <div
            ref={mainCardRef}
            className={cn(
              "transform transition-all duration-1000 ease-out",
              isMainCardVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}>
            <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-xl border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-primary tracking-tight">
                  scrapp
                </CardTitle>
                <p className="text-muted-foreground text-lg">Your Smart Waste Disposal Helper</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xl text-foreground/90">
                  Confused about recycling? Scrapp makes it simple. Just snap a photo, and
                  we&apos;ll tell you exactly how to dispose of your items properly. Then,
                  we&apos;ll tell you where you can dispose of the item.
                </p>
                <Button asChild size="lg" className="mt-4">
                  <Link href="/cam">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <button
          type="button"
          onClick={handleScrollDown}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer animate-bob z-30"
          aria-label="Scroll down to statistics">
          <ArrowDown className="w-8 h-8 text-muted-foreground" />
        </button>
      </section>

      <section ref={statsSectionRef} className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Why It Matters</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Improper waste disposal has a huge impact on our planet. Your choices make a difference,
            and Scrapp is here to empower them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedStatistic
              icon={Recycle}
              value={79}
              suffix="%"
              label="of plastic waste ends up in landfills or nature because it's not recycled."
            />
            <AnimatedStatistic
              icon={Trash2}
              value={220}
              suffix="M"
              label="tons of plastic waste will be generated this year alone."
            />
            <AnimatedStatistic
              icon={Globe}
              value={82}
              suffix="M"
              label="tons of e-waste are projected for 2030, a 32% increase from 2022."
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/67">
        <div
          ref={recyclablesRef}
          className={cn(
            "transform transition-all duration-1000 ease-out",
            isRecyclablesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
          <h2 className="text-3xl font-bold text-center mb-4">Lesser Known Recyclables</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Did you know how to handle these waste items? Scrapp is here to help you learn and make
            informed decisions about recycling and waste disposal.
          </p>
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
              {recyclables.map((it) => (
                <Card
                  key={it.item_name}
                  className="group relative overflow-hidden border-none bg-card/70 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl font-semibold leading-tight">
                        {it.item_name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div>
                      <p className="text-base font-medium">Prep steps</p>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-base text-foreground/90">
                        {it.prep_steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-muted/40 p-4 text-base flex items-start gap-2">
                      <div>
                        <p>{it.impact_note}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center pt-8">
            <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Camera className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Still Confused?</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Don&apos;t worry about memorizing all these rules. Just snap a photo of your item,
                  and Scrapp will tell you exactly how to dispose of it properly!
                </p>
                <Button asChild size="lg">
                  <Link href="/cam">
                    Try Scrapp Now <Camera className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-muted-foreground text-sm">
        <p>Making waste disposal less confusing, one photo at a time.</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <a
            href="https://github.com/adikatre/scrapp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Github className="h-4 w-4" />
            Frontend
          </a>
          <a
            href="https://github.com/adikatre/scrapp-backend"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Github className="h-4 w-4" />
            Backend
          </a>
        </div>
      </footer>
    </div>
  );
}
