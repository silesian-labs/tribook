import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import type { AgentDecision, VaultSnapshot } from "../domain.js";

const systemInstruction = `You are the narration layer of Tribook, an autonomous vault agent on Sui.
A deterministic rule engine has already MADE the decision. Your only job is to explain it
in one or two short, confident sentences for a live activity log shown to users.
Do not invent numbers, prices or facts beyond what is given. Do not second-guess the decision.
Keep it concise and human. Return plain text, no markdown.`;

export async function narrate(
  decision: AgentDecision,
  vault: VaultSnapshot,
): Promise<string> {
  if (!config.GEMINI_API_KEY || decision.action === "hold") {
    return decision.thesis;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    const prompt = JSON.stringify({
      decision,
      vault: {
        idleUsdc: vault.idleUsdc,
        spotAllocatedUsdc: vault.spotAllocatedUsdc,
        totalUsdc: vault.totalUsdc,
      },
      deterministicThesis: decision.thesis,
    });
    const response = await ai.models.generateContent({
      model: config.GEMINI_MODEL,
      contents: prompt,
      config: { systemInstruction, temperature: 0.4 },
    });
    return response.text?.trim() || decision.thesis;
  } catch (error) {
    console.warn(
      "[narrator] Gemini unavailable; using deterministic thesis",
      error instanceof Error ? error.message : error,
    );
    return decision.thesis;
  }
}
