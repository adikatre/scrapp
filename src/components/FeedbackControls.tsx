"use client";

import { Check, Flag, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackProductEvent } from "@/lib/analytics";
import type { DisposalDecision } from "@/lib/rules/types";

const FEEDBACK_KEY = "scrapp-feedback-v1";
const issues = [
  ["wrong_item", "Wrong item"],
  ["wrong_rule", "Right item, wrong local rule"],
  ["unclear", "Instructions unclear"],
  ["bad_place", "Suggested place does not accept it"]
] as const;

export function FeedbackControls({ decision }: { decision: DisposalDecision }) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState<(typeof issues)[number][0] | null>(null);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = () => {
    if (!issue) return;
    const record = {
      id: crypto.randomUUID(),
      decisionId: decision.id,
      materialId: decision.materialId,
      ruleVersion: decision.ruleVersion,
      issue,
      comment: comment.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
      reviewStatus: "pending"
    };
    try {
      const previous = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]") as unknown[];
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify([record, ...previous].slice(0, 50)));
    } catch {
      return;
    }
    trackProductEvent("feedback_submitted", { issue, jurisdiction: decision.jurisdiction.id });
    setSaved(true);
  };

  if (saved) {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm">
        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
        Saved on this device for review export. Server feedback sync is not configured yet.
      </p>
    );
  }

  return (
    <div className="border-t border-border/70 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Was this right?</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              trackProductEvent("feedback_submitted", {
                issue: "confirmed",
                jurisdiction: decision.jurisdiction.id
              });
              setSaved(true);
            }}>
            <Check className="size-4" /> Yes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen((value) => !value)}>
            <Flag className="size-4" /> Report
          </Button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-2">
          {issues.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setIssue(value)}
              className={`min-h-11 w-full rounded-xl border px-3 text-left text-sm font-medium ${
                issue === value ? "border-primary bg-accent" : "bg-card hover:bg-accent/50"
              }`}>
              {label}
            </button>
          ))}
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            placeholder="Optional detail. Keep personal information out."
            className="mt-2"
          />
          <Button onClick={submit} disabled={!issue} className="w-full">
            <Send className="size-4" /> Save report
          </Button>
        </div>
      )}
    </div>
  );
}
