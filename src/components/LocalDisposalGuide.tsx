"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SanDiegoGuidance } from "@/lib/sanDiegoDisposal";

type Props = {
  guidance: SanDiegoGuidance;
  choice?: string;
  onChoice: (value: string) => void;
};

export function LocalDisposalGuide({ guidance, choice, onChoice }: Props) {
  const { title, steps, question, source } = guidance;
  return (
    <section aria-label="Local disposal guidance" className="rounded-xl border border-primary/25 bg-primary/[0.06] p-5 text-left">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
        <MapPin size={15} aria-hidden /> City of San Diego households
      </p>
      <div aria-live="polite">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90 marker:text-primary">
          {steps.map((step) => <li key={step}>{step}</li>)}
        </ul>
      </div>
      {question && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold">{question.label}</legend>
          <div className="flex flex-wrap gap-2">
            {question.options.map(({ value, label }) => (
              <Button key={value} type="button" size="sm"
                className="h-auto min-h-9 whitespace-normal text-left"
                aria-pressed={choice === value} variant={choice === value ? "default" : "outline"}
                onClick={() => onChoice(value)}>{label}</Button>
            ))}
          </div>
        </fieldset>
      )}
      <a className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4"
        href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={13} aria-hidden /></a>
    </section>
  );
}
