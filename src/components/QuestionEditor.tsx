"use client";

import type {
  ChoiceQuestionSpec,
  NoulQuestionSpec,
  QuestionSpec,
  ScoreQuestionSpec,
} from "@/lib/playground";

const TYPE_STYLES: Record<QuestionSpec["type"], string> = {
  noul: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  choice: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  score: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const inputClass =
  "w-full min-w-0 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none";

export function QuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: QuestionSpec;
  onChange: (next: QuestionSpec) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide ${TYPE_STYLES[question.type]}`}
        >
          {question.type}
        </span>
        <input
          className={`${inputClass} flex-1 font-mono text-xs`}
          value={question.id}
          placeholder="question_id"
          spellCheck={false}
          onChange={(e) => onChange({ ...question, id: e.target.value })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:border-rose-500/40 hover:text-rose-400"
          aria-label="Remove question"
        >
          ✕
        </button>
      </div>

      <textarea
        className={`${inputClass} mt-3 resize-y`}
        rows={2}
        value={question.instructions}
        placeholder="Instructions — the exact question to judge"
        onChange={(e) => onChange({ ...question, instructions: e.target.value })}
      />

      {question.type === "noul" && <NoulFields question={question} onChange={onChange} />}
      {question.type === "choice" && <ChoiceFields question={question} onChange={onChange} />}
      {question.type === "score" && <ScoreFields question={question} onChange={onChange} />}
    </div>
  );
}

function NoulFields({
  question,
  onChange,
}: {
  question: NoulQuestionSpec;
  onChange: (next: NoulQuestionSpec) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <input
        className={inputClass}
        value={question.yesMeaning}
        placeholder="Yes means… (optional)"
        onChange={(e) => onChange({ ...question, yesMeaning: e.target.value })}
      />
      <input
        className={inputClass}
        value={question.noMeaning}
        placeholder="No means… (optional)"
        onChange={(e) => onChange({ ...question, noMeaning: e.target.value })}
      />
    </div>
  );
}

function ChoiceFields({
  question,
  onChange,
}: {
  question: ChoiceQuestionSpec;
  onChange: (next: ChoiceQuestionSpec) => void;
}) {
  const setOption = (index: number, label: string, description: string) => {
    const options = question.options.map((o, i) =>
      i === index ? { label, description } : o,
    );
    onChange({ ...question, options });
  };

  return (
    <div className="mt-3 space-y-2">
      {question.options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            className={`${inputClass} w-28 shrink-0 font-mono text-xs sm:w-36`}
            value={option.label}
            placeholder={`option_${index + 1}`}
            spellCheck={false}
            onChange={(e) => setOption(index, e.target.value, option.description)}
          />
          <input
            className={`${inputClass} flex-1`}
            value={option.description}
            placeholder="Description (optional)"
            onChange={(e) => setOption(index, option.label, e.target.value)}
          />
          <button
            type="button"
            disabled={question.options.length <= 2}
            onClick={() =>
              onChange({
                ...question,
                options: question.options.filter((_, i) => i !== index),
              })
            }
            className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-xs text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-30"
            aria-label="Remove option"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...question,
            options: [
              ...question.options,
              { label: `option_${question.options.length + 1}`, description: "" },
            ],
          })
        }
        className="text-xs text-zinc-400 hover:text-emerald-400"
      >
        + option
      </button>
    </div>
  );
}

function ScoreFields({
  question,
  onChange,
}: {
  question: ScoreQuestionSpec;
  onChange: (next: ScoreQuestionSpec) => void;
}) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= question.levels.length) return;
    const levels = [...question.levels];
    [levels[index], levels[target]] = [levels[target], levels[index]];
    onChange({ ...question, levels });
  };

  return (
    <div className="mt-3 space-y-2">
      {question.levels.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-zinc-500">
            {index}
          </span>
          <input
            className={`${inputClass} flex-1`}
            value={level}
            placeholder={`Level ${index} description`}
            onChange={(e) => {
              const levels = question.levels.map((l, i) =>
                i === index ? e.target.value : l,
              );
              onChange({ ...question, levels });
            }}
          />
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={() => move(index, -1)}
              className="px-1 text-[9px] leading-none text-zinc-500 hover:text-zinc-200"
              aria-label="Move level up"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              className="px-1 text-[9px] leading-none text-zinc-500 hover:text-zinc-200"
              aria-label="Move level down"
            >
              ▼
            </button>
          </div>
          <button
            type="button"
            disabled={question.levels.length <= 2}
            onClick={() =>
              onChange({
                ...question,
                levels: question.levels.filter((_, i) => i !== index),
              })
            }
            className="shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-xs text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-30"
            aria-label="Remove level"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...question,
            levels: [...question.levels, `Level ${question.levels.length} description`],
          })
        }
        className="text-xs text-zinc-400 hover:text-amber-400"
      >
        + level
      </button>
    </div>
  );
}
