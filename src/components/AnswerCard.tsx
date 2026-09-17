"use client";

import { ProbabilityBar } from "@/components/ProbabilityBar";
import type { Answer } from "@/lib/playground";

const TYPE_STYLES: Record<Answer["type"], string> = {
  noul: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  choice: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  score: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

function fmt(n: number): string {
  return Number(n).toFixed(3);
}

function noulVerdict(value: number): { label: string; tone: "emerald" | "amber" | "rose" } {
  if (value >= 0.9) return { label: "Strong yes", tone: "emerald" };
  if (value >= 0.65) return { label: "Leans yes", tone: "emerald" };
  if (value > 0.35) return { label: "Uncertain", tone: "amber" };
  if (value > 0.1) return { label: "Leans no", tone: "rose" };
  return { label: "Strong no", tone: "rose" };
}

function Confidence({ value }: { value: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">
          confidence
        </span>
        <span className="font-mono text-xs text-zinc-400">{fmt(value)}</span>
      </div>
      <ProbabilityBar value={value} tone="violet" />
    </div>
  );
}

export function AnswerCard({ id, answer }: { id: string; answer: Answer }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide ${TYPE_STYLES[answer.type]}`}
        >
          {answer.type}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-300" title={id}>
          {id}
        </span>
      </div>

      {answer.type === "noul" && <NoulResult answer={answer} />}
      {answer.type === "choice" && <ChoiceResult answer={answer} />}
      {answer.type === "score" && <ScoreResult answer={answer} />}
    </div>
  );
}

function NoulResult({ answer }: { answer: Extract<Answer, { type: "noul" }> }) {
  const verdict = noulVerdict(answer.noul);
  const pct = answer.noul * 100;
  const barTone =
    verdict.tone === "emerald"
      ? "bg-emerald-400"
      : verdict.tone === "amber"
        ? "bg-amber-400"
        : "bg-rose-400";

  return (
    <div className="mt-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-3xl font-semibold text-zinc-50">
          {fmt(answer.noul)}
        </span>
        <span className="text-xs text-zinc-500">probability of yes</span>
        <span
          className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${
            verdict.tone === "emerald"
              ? "bg-emerald-500/10 text-emerald-400"
              : verdict.tone === "amber"
                ? "bg-amber-500/10 text-amber-400"
                : "bg-rose-500/10 text-rose-400"
          }`}
        >
          {verdict.label}
        </span>
      </div>
      <div className="relative mt-3">
        <div className="h-2 w-full rounded-full bg-zinc-800" />
        <div
          className={`absolute top-0 h-2 rounded-full ${barTone}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
        <div className="absolute -top-1 left-1/2 h-4 w-px bg-zinc-600" />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
        <span>0 · no</span>
        <span>0.5</span>
        <span>1 · yes</span>
      </div>
    </div>
  );
}

function ChoiceResult({ answer }: { answer: Extract<Answer, { type: "choice" }> }) {
  const ranked = Object.entries(answer.probabilities).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="mt-3">
      <div className="mt-3 flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 text-xs text-zinc-500">selected</span>
        <span
          className="min-w-0 flex-1 truncate rounded bg-sky-500/10 px-2 py-0.5 font-mono text-lg font-semibold text-sky-300"
          title={answer.choice}
        >
          {answer.choice}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {ranked.map(([label, probability]) => {
          const selected = label === answer.choice;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`w-28 shrink-0 truncate font-mono text-xs ${selected ? "text-sky-300" : "text-zinc-500"}`}
                title={label}
              >
                {selected ? "▸ " : ""}
                {label}
              </span>
              <ProbabilityBar value={probability} tone={selected ? "sky" : "zinc"} />
              <span className="w-12 shrink-0 text-right font-mono text-xs text-zinc-400">
                {(probability * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <Confidence value={answer.confidence} />
    </div>
  );
}

function ScoreResult({ answer }: { answer: Extract<Answer, { type: "score" }> }) {
  const entries = Object.entries(answer.legend).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  );
  const max = Math.max(...entries.map(([k]) => Number(k)));
  const pos = max > 0 ? (answer.score / max) * 100 : 0;

  return (
    <div className="mt-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-3xl font-semibold text-zinc-50">
          {answer.score.toFixed(2)}
        </span>
        <span className="text-xs text-zinc-500">of {max}</span>
      </div>

      <div className="relative mt-4 mb-2 h-2">
        <div className="absolute top-0 h-2 w-full rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-rose-500/40" />
        <div
          className="absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-amber-300 bg-zinc-950 shadow"
          style={{ left: `${Math.min(100, Math.max(0, pos))}%` }}
          title={answer.score.toFixed(2)}
        />
      </div>
      <div className="relative mb-3 h-8">
        {entries.map(([key, text], index) => {
          const isFirst = index === 0;
          const isLast = index === entries.length - 1;
          const left = max > 0 ? (Number(key) / max) * 100 : 50;
          return (
            <div
              key={key}
              className="absolute overflow-hidden"
              style={{
                left: `${left}%`,
                width: 130,
                maxWidth: isFirst || isLast ? "50%" : 130,
                transform: isFirst ? "none" : isLast ? "translateX(-100%)" : "translateX(-50%)",
                textAlign: isFirst ? "left" : isLast ? "right" : "center",
              }}
              title={text}
            >
              <div className="font-mono text-[10px] text-zinc-500">{key}</div>
              <div className="truncate text-[10px] text-zinc-600">{text}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-1.5">
        {entries.map(([key]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-36 shrink-0 truncate font-mono text-xs text-zinc-500" title={answer.legend[key]}>
              {key} · {answer.legend[key]}
            </span>
            <ProbabilityBar value={answer.probabilities[key] ?? 0} tone="amber" />
            <span className="w-12 shrink-0 text-right font-mono text-xs text-zinc-400">
              {((answer.probabilities[key] ?? 0) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <Confidence value={answer.confidence} />
    </div>
  );
}
