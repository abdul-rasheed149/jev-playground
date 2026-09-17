"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { QuestionEditor } from "@/components/QuestionEditor";
import {
  DEFAULT_MODEL,
  SAMPLE_STATE,
  looksLikeJson,
  sampleQuestions,
  uniqueId,
} from "@/lib/playground";
import type { EvaluateResult, QuestionSpec } from "@/lib/playground";

const STORAGE_KEY = "jev-playground-v1";

const inputClass =
  "rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none";

type ResultsTab = "answers" | "request" | "response";

type Draft = {
  stateText: string;
  model: string;
  questions: QuestionSpec[];
};

const initialDraft: Draft = {
  stateText: SAMPLE_STATE,
  model: DEFAULT_MODEL,
  questions: sampleQuestions(),
};

export default function PlaygroundPage() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [lastRequestBody, setLastRequestBody] = useState<string | null>(null);
  const [lastResponseBody, setLastResponseBody] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [tab, setTab] = useState<ResultsTab>("answers");
  const restoredRef = useRef(false);

  const { stateText, model, questions } = draft;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Draft>;
        if (
          (typeof saved.stateText === "string" && saved.stateText) ||
          (typeof saved.model === "string" && saved.model) ||
          Array.isArray(saved.questions)
        ) {
          const next: Draft = { ...initialDraft };
          if (typeof saved.stateText === "string" && saved.stateText) {
            next.stateText = saved.stateText;
          }
          if (typeof saved.model === "string" && saved.model) next.model = saved.model;
          if (Array.isArray(saved.questions) && saved.questions.length > 0) {
            next.questions = saved.questions;
          }
          // One-time restore of the persisted playground after hydration.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDraft(next);
        }
      }
    } catch {
      // ignore malformed saved state
    }
    restoredRef.current = true;
  }, []);

  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // storage full or unavailable; the playground still works
    }
  }, [draft]);

  const run = useCallback(async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    const payload = { state: stateText, model, questions };
    const prettyBody = JSON.stringify(payload, null, 2);
    const started = performance.now();
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLastRequestBody(prettyBody);
      setLastResponseBody(JSON.stringify(data, null, 2));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}.`);
      }
      setResult(data as EvaluateResult);
      setLatencyMs(Math.round(performance.now() - started));
      setTab("answers");
    } catch (e) {
      setResult(null);
      setLatencyMs(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }, [pending, stateText, model, questions]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  const addQuestion = (type: QuestionSpec["type"]) => {
    setDraft((prev) => {
      const ids = prev.questions.map((q) => q.id);
      if (type === "noul") {
        return {
          ...prev,
          questions: [
            ...prev.questions,
            {
              id: uniqueId(ids, "is_true"),
              type: "noul",
              instructions: "",
              yesMeaning: "",
              noMeaning: "",
            },
          ],
        };
      }
      if (type === "choice") {
        return {
          ...prev,
          questions: [
            ...prev.questions,
            {
              id: uniqueId(ids, "category"),
              type: "choice",
              instructions: "",
              options: [
                { label: "option_a", description: "" },
                { label: "option_b", description: "" },
              ],
            },
          ],
        };
      }
      return {
        ...prev,
        questions: [
          ...prev.questions,
          {
            id: uniqueId(ids, "rating"),
            type: "score",
            instructions: "",
            levels: ["Level 0 description", "Level 1 description"],
          },
        ],
      };
    });
  };

  const loadSample = () => setDraft(initialDraft);

  const canRun = stateText.trim().length > 0 && questions.length > 0 && !pending;
  const stateIsJson = looksLikeJson(stateText);
  const answerOrder = questions.map((q) => q.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-6 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Jev Playground</h1>
          <span className="rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500">
            TypeSafe System One
          </span>
          <div className="ml-auto flex items-center gap-2">
            <input
              className={`${inputClass} w-40 font-mono text-xs`}
              value={model}
              onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="model"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={loadSample}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Load sample
            </button>
            <button
              type="button"
              onClick={() => void run()}
              disabled={!canRun}
              className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Running…" : "Run ⌘↵"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] items-start gap-6 p-6 lg:grid-cols-[minmax(430px,1fr)_minmax(430px,1fr)]">
        <section className="min-w-0 space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                State
              </h2>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                  stateIsJson
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {stateIsJson ? "json" : "text"}
              </span>
            </div>
            <textarea
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none"
              rows={7}
              value={stateText}
              placeholder="Paste text or a JSON object as the state…"
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, stateText: e.target.value }))
              }
            />
            <p className="mt-2 text-xs text-zinc-600">
              Text is sent as-is; valid JSON is sent as structured state. Every
              question below is evaluated against this in one parallel request.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Questions
              </h2>
              <span className="text-xs text-zinc-600">
                ({questions.length} — evaluated in parallel, in isolation)
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion("noul")}
                  className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20"
                >
                  + noul
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("choice")}
                  className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-400 hover:bg-sky-500/20"
                >
                  + choice
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("score")}
                  className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400 hover:bg-amber-500/20"
                >
                  + score
                </button>
              </div>
            </div>

            {questions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    questions: prev.questions.map((q, i) => (i === index ? next : q)),
                  }))
                }
                onRemove={() =>
                  setDraft((prev) => ({
                    ...prev,
                    questions: prev.questions.filter((_, i) => i !== index),
                  }))
                }
              />
            ))}

            {questions.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-600">
                No questions yet. Add a noul, choice, or score question.
              </p>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-3 lg:sticky lg:top-20">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Results
            </h2>
            {result && (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                <span
                  className="max-w-40 truncate rounded bg-zinc-900 px-1.5 py-0.5"
                  title={result.model}
                >
                  {result.model}
                </span>
                {latencyMs !== null && (
                  <span className="rounded bg-zinc-900 px-1.5 py-0.5">{latencyMs} ms</span>
                )}
                <span className="rounded bg-zinc-900 px-1.5 py-0.5">
                  ↑{result.usage.input_tokens} ↓{result.usage.output_tokens} tok
                </span>
              </div>
            )}
            {(lastRequestBody || lastResponseBody) && (
              <div className="ml-auto flex gap-1 rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
                {(["answers", "request", "response"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded px-2 py-0.5 text-xs ${
                      tab === t
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          {tab === "answers" &&
            (result ? (
              <div className="space-y-3">
                {Object.keys(result.answers)
                  .sort((a, b) => {
                    const ia = answerOrder.indexOf(a);
                    const ib = answerOrder.indexOf(b);
                    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
                  })
                  .map((id) => (
                    <AnswerCard key={id} id={id} answer={result.answers[id]} />
                  ))}
              </div>
            ) : (
              !error && (
                <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-600">
                  Set a state, add questions, then hit Run (or ⌘↵).
                  <br />
                  Needs{" "}
                  <code className="font-mono text-zinc-500">TYPESAFE_API_KEY</code> in{" "}
                  <code className="font-mono text-zinc-500">.env.local</code>.
                </div>
              )
            ))}

          {tab === "request" && lastRequestBody && (
            <pre className="max-h-[70vh] overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 font-mono text-xs leading-relaxed text-zinc-400">
              {lastRequestBody}
            </pre>
          )}

          {tab === "response" && lastResponseBody && (
            <pre className="max-h-[70vh] overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 font-mono text-xs leading-relaxed text-zinc-400">
              {lastResponseBody}
            </pre>
          )}

          <p className="text-[11px] text-zinc-700">
            Your playground persists locally; “Load sample” resets it.
          </p>
        </section>
      </main>
    </div>
  );
}
