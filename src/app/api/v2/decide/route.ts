import { createDecideHandler } from "@/lib/api/decide-handler";
import { decisionEngine } from "@/lib/rules/system";

export const runtime = "nodejs";
export const POST = createDecideHandler(decisionEngine);
