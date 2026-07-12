// To make this a client component, we add this directive at the top.
// This allows us to use React hooks like useState, useEffect, and useRef.
"use client";

// Import necessary React hooks and components.
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Trash2, ArrowDown, Camera, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// This is a custom hook to detect if an element is visible on the screen.
// It uses the Intersection Observer API for performance.
const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Set visibility state based on whether the element is intersecting the viewport.
      if (entry.isIntersecting) {
        setIsVisible(true);
        // We can unobserve after it becomes visible to prevent re-triggering.
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
  }, [ref, options]);

  return [ref, isVisible] as const;
};

// A component for an animated statistic card.
// It uses the useOnScreen hook to trigger a count-up animation.
const AnimatedStatistic = ({
  icon: Icon,
  value,
  label,
  suffix = "",
  increment = 1,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  increment?: number;
}) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = value;
      if (start === end) return;

      // Adjust duration based on value and increment speed
      let duration = 2000 / (end / increment);
      if (end > 1000) duration = 0.1;
      if (end < 100) duration = 25;

      const timer = setInterval(() => {
        start += increment;
        if (start > end) start = end; // Prevent overshoot
        setCount(start);
        if (start === end) {
          clearInterval(timer);
        }
      }, duration);

      return () => clearInterval(timer);
    }
  }, [isVisible, value, increment]);

  return (
    <div
      ref={ref}
      className={cn(
        "transform transition-all duration-1000 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
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


// The main component for your home page.
export default function HomePage() {
  const [mainCardRef, isMainCardVisible] = useOnScreen({ threshold: 0.1 });
  const [recyclablesRef, isRecyclablesVisible] = useOnScreen({ threshold: 0.15 });
  // Create a ref for the statistics section
  const statsSectionRef = useRef<HTMLElement>(null);

  // Function to handle smooth scrolling
  const handleScrollDown = () => {
    statsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center h-screen p-6 text-center relative overflow-hidden">
        {/* Video Background Container */}
        <div className="absolute top-0 left-0 w-full h-full z-0 video-container">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://www.pexels.com/download/video/9056204/?fps=29.97&h=2160&w=3840" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Hero Content Wrapper */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          <div
            ref={mainCardRef}
            className={cn(
              "transform transition-all duration-1000 ease-out",
              isMainCardVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
          >
            <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-xl border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-primary tracking-tight">
                  scrapp
                </CardTitle>
                <p className="text-muted-foreground text-lg">
                  Your Smart Waste Disposal Helper
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xl text-foreground/90">
                  Confused about recycling? Scrapp makes it simple. Just snap a photo, and we&apos;ll tell you exactly how to dispose of your items properly. Then, we&apos;ll tell you where you can dispose of the item.
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

        {/* Scroll Down Arrow */}
        <div
          onClick={handleScrollDown}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer animate-bob z-30"
        >
          <ArrowDown className="w-8 h-8 text-muted-foreground" />
        </div>
      </section>

      {/* Statistics Section */}
      <section ref={statsSectionRef} className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Why It Matters</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Improper waste disposal has a huge impact on our planet. Your choices make a difference, and Scrapp is here to empower them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedStatistic
              icon={Recycle}
              value={79}
              suffix="%"
              label="of plastic waste ends up in landfills or nature because it's not recycled."
              increment={1}
            />
            <AnimatedStatistic
              icon={Trash2}
              value={220}
              suffix="M"
              label="tons of plastic waste will be generated this year alone."
              increment={5}
            />
            <AnimatedStatistic
              icon={Globe}
              value={82}
              suffix="M"
              label="tons of e-waste are projected for 2030, a 32% increase from 2022."
              increment={2}
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/67">
        {/* Fade-in animation for "lesser known recyclables" section */}
        <div
          ref={recyclablesRef}
          className={cn(
            "transform transition-all duration-1000 ease-out",
            isRecyclablesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
              <h2 className="text-3xl font-bold text-center mb-4">Lesser Known Recyclables</h2>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                Did you know how to handle these waste items? Scrapp is here to help you learn and make informed decisions about recycling and waste disposal.
              </p>
              <div className="container mx-auto px-6">
                {/*Convert JSON data to a  Ad</div>here to styling in the previous div, and follow UI best practices and good strategies to create sections for each of the six records. The UI should look very appealing and look quite good to users.*/}
                {/* 3x2 Educational Cards – hardcoded data + UI */}
                {(() => {
                  type Item = {
                    item_name: string;
                    category: "Curbside Recyclable" | "Curbside Recyclable + Organics" | "Store Drop-Off" | "Scrap/Buy-Back" | "Household Hazardous Waste";
                    misconception_summary: string;
                    the_truth: string;
                    prep_steps: string[];
                    where_to_take: string;
                    impact_note: string;
                    last_verified: string;
                    short_user_tip: string;
                  };

                  const items: Item[] = [
                    {
                      "item_name": "Empty aerosol cans (non-hazardous contents)",
                      "category": "Curbside Recyclable",
                      "misconception_summary": "People often toss aerosol cans in the trash or avoid recycling them altogether.",
                      "the_truth": "In San Diego County, EMPTY aerosol cans are accepted in curbside recycling as metal; non-empty or hazardous-product cans are HHW.",
                      "prep_steps": ["Use up contents completely until no spray or hiss", "Do NOT puncture", "Place loose in blue bin (not bagged)"],
                      "where_to_take": "If not empty or hazardous: City of San Diego HHW Transfer Facility (appointment required)",
                      "impact_note": "Recycling metal saves significant energy and reduces the need for virgin ore.",
                      "last_verified": "2025-09-13",
                      "short_user_tip": "If it's truly empty, recycle it with metals; if not, book HHW."
                    },
                    {
                      "item_name": "Plastic film & bags (grocery, bread, bubble wrap)",
                      "category": "Store Drop-Off",
                      "misconception_summary": "Many residents put film plastic in the blue bin, where it tangles sorting machinery.",
                      "the_truth": "Not accepted curbside in San Diego—take clean/dry film plastic to participating retail store drop-off locations.",
                      "prep_steps": ["Remove receipts/labels", "Ensure clean and dry", "Stuff smaller bags into one bag (bag-your-bags)"],
                      "where_to_take": "Participating retailers listed via WasteFreeSD or PlasticFilmRecycling.org",
                      "impact_note": "Keeping film out of curbside prevents MRF jams and improves recycling quality.",
                      "last_verified": "2025-09-13",
                      "short_user_tip": "Never in blue bin—bring clean, dry bags to store drop-off."
                    },
                    {
                      "item_name": "Pizza boxes (clean lid vs. greasy bottom)",
                      "category": "Curbside Recyclable + Organics",
                      "misconception_summary": "People think all pizza boxes are trash because of grease.",
                      "the_truth": "Recycle the clean cardboard portion; food-soiled paper belongs in your green organics bin.",
                      "prep_steps": ["Tear off clean lid for blue bin", "Put greasy bottom in green organics", "Remove liners/food"],
                      "where_to_take": "Curbside (blue for clean cardboard; green for food-soiled paper)",
                      "impact_note": "Diverts cardboard to recycling and food-soiled paper to compost, reducing landfill methane.",
                      "last_verified": "2025-09-13",
                      "short_user_tip": "Clean lid = blue; greasy bottom = green."
                    },
                    {
                      "item_name": "Rigid plastic plant pots, buckets & toys",
                      "category": "Curbside Recyclable",
                      "misconception_summary": "Residents often trash bulky rigid plastics like pots and buckets.",
                      "the_truth": "The City accepts rigid plastics—including clean pots, buckets, trays and toys—in curbside recycling.",
                      "prep_steps": ["Empty soil/debris", "Quickly rinse if needed", "Place items empty, dry, and loose in blue bin"],
                      "where_to_take": "Curbside blue bin",
                      "impact_note": "Recycling rigid plastics reduces landfill volume and supports recycled resin markets.",
                      "last_verified": "2025-09-13",
                      "short_user_tip": "Rigid, empty & dry plastic pots and buckets go in blue."
                    },
                    {
                      "item_name": "Scrap metal & metal clothing hangers",
                      "category": "Scrap/Buy-Back",
                      "misconception_summary": "Many try to toss hangers/scrap metal in the blue bin or trash them.",
                      "the_truth": "Scrap metal is NOT accepted in curbside recycling; take to a scrap recycler or find locations via WasteFreeSD.",
                      "prep_steps": ["Remove non-metal parts", "Bundle small pieces safely", "Transport to local recycler"],
                      "where_to_take": "Scrap metal recycler; search WasteFreeSD.org for locations",
                      "impact_note": "Recycling metal recovers high-value material and prevents equipment jams at MRFs.",
                      "last_verified": "2025-09-13",
                      "short_user_tip": "Not blue-bin—take metal hangers/scrap to a recycler (see WasteFreeSD)."
                    },
                    {
                      "item_name": "Household batteries (AA/AAA, button, lithium-ion)",
                      "category": "Household Hazardous Waste",
                      "misconception_summary": "People still put batteries in trash or blue bins.",
                      "the_truth": "Universal wastes like batteries are illegal in the trash; City residents must use the HHW Transfer Facility or other approved options.",
                      "prep_steps": ["Store in a safe container", "Tape terminals (especially lithium/button types)", "Make HHW appointment"],
                      "where_to_take": "City of San Diego HHW Transfer Facility (Miramar) by appointment",
                      "impact_note": "Proper handling prevents fires in collection trucks and facilities and avoids toxic releases.",
                      "last_verified": "2025-09-13",
                      "short_user_tip": "Never curbside—tape terminals and book HHW."
                    }
                  ];

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                      {items.map((it, idx) => (
                        <Card
                          key={idx}
                          className="group relative overflow-hidden border-none bg-card/70 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                        >
                          {/* soft gradient halo */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-70" />
                          <CardHeader className="relative">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-xl font-semibold leading-tight">{it.item_name}</CardTitle>
                              {/* {categoryPill(it.category)} */}
                            </div>
                            {/* <p className="text-sm text-muted-foreground mt-2">{it.misconception_summary}</p> */}
                          </CardHeader>
                          <CardContent className="relative space-y-4">
                            {/* <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                              <p className="text-sm"><span className="font-medium">The truth:</span> {it.the_truth}</p>
                            </div> */}

                            <div>
                              <p className="text-base font-medium">Prep steps</p>
                              <ul className="mt-2 list-disc pl-5 space-y-1 text-base text-foreground/90">
                                {it.prep_steps.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>

                            <div className="flex items-center gap-2 text-base">
                              <MapPin className="h-5 w-5 opacity-70" />
                              <span><span className="font-medium">Where to take:</span> {it.where_to_take}</span>
                            </div>

                            <div className="rounded-md bg-muted/40 p-4 text-base flex items-start gap-2">
                              <div>
                                <p className="">{it.impact_note}</p>
                                <p className="text-xs text-muted-foreground mt-1">Verified {it.last_verified}</p>
                              </div>
                            </div>

                            {/* <div className="pt-1">
                              <p className="text-sm font-medium">Quick tip</p>
                              <p className="text-sm text-muted-foreground">{it.short_user_tip}</p>
                            </div> */}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}

              </div>

              {/* Add a call-to-action at the bottom */}
              <div className="text-center pt-8">
                <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Camera className="h-8 w-8 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">Still Confused?</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Don&apos;t worry about memorizing all these rules. Just snap a photo of your item, and Scrapp will tell you exactly how to dispose of it properly!
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

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm">
        <p>Making waste disposal less confusing, one photo at a time.</p>
        <p>Data from the <a href='https://blogs.worldbank.org/en/sustainablecities/how-the-world-bank-is-tackling-the-growing-global-waste-crisis'>The World Bank</a>.</p>
      </footer>
    </div>
  );
}

