import OpenAI from "openai";
import { LlmProvider } from "./llm-provider";

export class OpenAIProvider implements LlmProvider {
  name = "openai";
  constructor(public model: string, private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })) {}

  async stream(prompt: string, onDelta: (chunk: string) => void) {
    const started = Date.now();
    const res = await this.client.chat.completions.create({
      model: this.model,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    });

    let promptTokens = 0, completionTokens = 0;
    for await (const part of res) {
      const delta = part.choices?.[0]?.delta?.content ?? "";
      if (delta) onDelta(delta);
      if (part.usage) {
        promptTokens = part.usage.prompt_tokens ?? promptTokens;
        completionTokens = part.usage.completion_tokens ?? completionTokens;
      }
    }
    const latencyMs = Date.now() - started;

    // quick cost estimate (adjust with actual pricing if you like)
    const inCost = 0.00015/1000;    // $/token
    const outCost = 0.0006/1000;
    const costUsd = promptTokens*inCost + completionTokens*outCost;

    return { usage:{prompt:promptTokens, completion:completionTokens}, costUsd, latencyMs };
  }
}
