import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic?: Anthropic };

// Reused across invocations in the same serverless instance, same pattern as src/lib/db.ts.
export const anthropic = globalForAnthropic.anthropic ?? new Anthropic();

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;
