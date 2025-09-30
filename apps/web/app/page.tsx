"use client";
import { useState, useRef, useEffect } from "react";

type RunState = {
  id: string;
  title: string;
  status: "idle" | "typing" | "streaming" | "complete" | "error";
  text: string;
  tokens?: number;
  costUsd?: number;
  latencyMs?: number;
  error?: string;
};

type Session = {
  id: string;
  createdAt: string;
  prompt: string;
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [runs, setRuns] = useState<RunState[]>([
    { id: "m1", title: "openai:gpt-4o-mini", status: "idle", text: "" },
    { id: "m2", title: "openai:gpt-4o", status: "idle", text: "" },
    { id: "m3", title: "(reserved)", status: "idle", text: "" },
  ]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const sessionIdRef = useRef<string>();

  // Fetch all sessions on load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("http://localhost:3001/sessions");
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    };
    fetchSessions();
  }, []);

  const start = async () => {
    // create session in API
    const res = await fetch("http://localhost:3001/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const session = await res.json();
    sessionIdRef.current = session.id;

    // reset UI
    setRuns(runs.map((r, i) => ({ ...r, status: i < 2 ? "typing" : "idle", text: "" })));

    // connect to stream (NestJS endpoint)
    const es = new EventSource(`http://localhost:3001/stream/${session.id}`);
    es.onmessage = (e) => {
      const evt = JSON.parse(e.data);
      const title = evt.provider;

      setRuns((prev) =>
        prev.map((r) => {
          if (!title || !r.title.includes(title)) return r;
          if (evt.type === "status") {
            return { ...r, status: evt.status, error: evt.error };
          } else if (evt.type === "delta") {
            return { ...r, status: "streaming", text: r.text + evt.text };
          } else if (evt.type === "done") {
            return {
              ...r,
              status: "complete",
              tokens: (evt.usage?.prompt ?? 0) + (evt.usage?.completion ?? 0),
              costUsd: evt.costUsd,
              latencyMs: evt.latencyMs,
            };
          }
          return r;
        })
      );
    };
    es.onerror = () => {
      setRuns((prev) =>
        prev.map((r) =>
          r.status === "streaming"
            ? { ...r, status: "error", error: "stream error" }
            : r
        )
      );
      es.close();
    };

    // refresh sessions list
    const allRes = await fetch("http://localhost:3001/sessions");
    setSessions(await allRes.json());
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Model Playground</h1>

      {/* Prompt input */}
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type a prompt..."
        />
        <button className="bg-black text-white rounded px-4" onClick={start}>
          Run
        </button>
      </div>

      {/* Model runs */}
      <div className="grid gap-4 md:grid-cols-3">
        {runs.map((r) => (
          <div key={r.id} className="border rounded-lg p-4">
            <header className="flex justify-between">
              <span className="font-semibold">{r.title}</span>
              <span className="text-xs opacity-70">{r.status}</span>
            </header>
            <article className="mt-3 whitespace-pre-wrap text-sm">
              {r.text ||
                (r.status === "error"
                  ? `⚠️ ${r.error ?? "error"}`
                  : r.status === "typing"
                  ? "…"
                  : "")}
            </article>
            {r.status === "complete" && (
              <footer className="mt-3 text-xs opacity-70">
                tokens: {r.tokens ?? 0} • {r.latencyMs ?? 0} ms • $
                {r.costUsd?.toFixed(4) ?? "0.0000"}
              </footer>
            )}
          </div>
        ))}
      </div>

      {/* Stored sessions list */}
      <section>
        <h2 className="text-xl font-semibold mt-8">Stored Sessions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="border rounded px-3 py-2">
              <span className="font-mono">{s.id}</span> —{" "}
              <span>{s.prompt}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
