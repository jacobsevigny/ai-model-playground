"use client";
import { useState, useRef } from "react";
import { createSession } from "@/lib/api";

type RunState = {
  id: string;
  title: string;         // "openai:gpt-4o" etc
  status: "idle"|"typing"|"streaming"|"complete"|"error";
  text: string;
  tokens?: number;
  costUsd?: number;
  latencyMs?: number;
  error?: string;
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [runs, setRuns] = useState<RunState[]>([
    { id:"m1", title:"openai:gpt-4o-mini", status:"idle", text:"" },
    { id:"m2", title:"openai:gpt-4o",       status:"idle", text:"" },
    { id:"m3", title:"(reserved)",          status:"idle", text:"" }, // for later (e.g., Anthropic)
  ]);
  const sessionIdRef = useRef<string>();

  const start = async () => {
    const session = await createSession(prompt);
    sessionIdRef.current = session.id;

    // reset UI
    setRuns(runs.map((r,i)=> ({...r, status: i<2 ? "typing":"idle", text:""} )));

    const es = new EventSource(`/api/stream/${session.id}`);
    es.onmessage = (e) => {
      const evt = JSON.parse(e.data);
      const title = evt.provider;

      setRuns(prev => prev.map(r => {
        if (!title || !r.title.includes(title)) return r;
        if (evt.type === "status") {
          return { ...r, status: evt.status, error: evt.error };
        } else if (evt.type === "delta") {
          return { ...r, status:"streaming", text: r.text + evt.text };
        } else if (evt.type === "done") {
          return { ...r, status:"complete", tokens:(evt.usage?.prompt ?? 0)+(evt.usage?.completion ?? 0), costUsd:evt.costUsd, latencyMs:evt.latencyMs };
        }
        return r;
      }));
    };
    es.onerror = () => {
      setRuns(prev => prev.map(r => r.status === "streaming" ? { ...r, status:"error", error:"stream error" } : r));
      es.close();
    };
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Model Playground</h1>

      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 flex-1" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Type a prompt..." />
        <button className="bg-black text-white rounded px-4" onClick={start}>Run</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {runs.map((r) => (
          <div key={r.id} className="border rounded-lg p-4">
            <header className="flex justify-between">
              <span className="font-semibold">{r.title}</span>
              <span className="text-xs opacity-70">{r.status}</span>
            </header>
            <article className="mt-3 whitespace-pre-wrap text-sm">
              {r.text || (r.status === "error" ? `⚠️ ${r.error ?? "error"}` : (r.status==="typing"?"…":""))}
            </article>
            {r.status === "complete" && (
              <footer className="mt-3 text-xs opacity-70">
                tokens: {r.tokens ?? 0} • {r.latencyMs ?? 0} ms • ${r.costUsd?.toFixed(4) ?? "0.0000"}
              </footer>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
