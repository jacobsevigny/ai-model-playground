export type StreamEvent =
  | { type: 'status'; provider: string; status: 'typing'|'streaming'|'complete'|'error'; error?: string }
  | { type: 'delta'; provider: string; text: string }
  | { type: 'done'; provider: string; usage?: { prompt: number; completion: number }; costUsd?: number; latencyMs?: number };

export interface LlmProvider {
  name: string;
  model: string;
  stream(prompt: string, onDelta: (chunk: string) => void): Promise<{usage:{prompt:number;completion:number}; costUsd:number; latencyMs:number}>;
}
