import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import type { EntryType, Questions } from "@typesafe-ai/sdk";
import { DEFAULT_MODEL } from "@/lib/playground";
import type { EvaluateRequestBody, QuestionSpec } from "@/lib/playground";

function clean(value: string | undefined): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

function parseState(raw: string): EntryType {
  const text = raw.trim();
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return JSON.parse(text) as EntryType;
    } catch {
      // not valid JSON; send as plain text
    }
  }
  return text;
}

function buildQuestions(specs: QuestionSpec[]): Questions {
  const built: Questions = {};

  for (const spec of specs) {
    const id = spec.id.trim();
    const instructions = clean(spec.instructions);
    if (!instructions) {
      throw new UserError(`Question "${id || "(no id)"}" needs instructions.`);
    }

    if (spec.type === "noul") {
      const yesMeaning = clean(spec.yesMeaning);
      const noMeaning = clean(spec.noMeaning);
      built[id] = noul(instructions, { true: yesMeaning, false: noMeaning });
    } else if (spec.type === "choice") {
      const criteria: Record<string, string | null> = {};
      for (const option of spec.options) {
        const label = option.label.trim();
        if (label) criteria[label] = clean(option.description);
      }
      if (Object.keys(criteria).length < 2) {
        throw new UserError(
          `Choice question "${id}" needs at least two labeled options.`,
        );
      }
      built[id] = choice(instructions, criteria);
    } else {
      const levels = spec.levels.map((level) => clean(level));
      if (levels.filter(Boolean).length < 2) {
        throw new UserError(
          `Score question "${id}" needs at least two described levels.`,
        );
      }
      built[id] = score(instructions, levels as [EntryType, EntryType, ...EntryType[]]);
    }
  }

  if (Object.keys(built).length === 0) {
    throw new UserError("Add at least one question.");
  }
  return built;
}

class UserError extends Error {}

export async function POST(request: Request) {
  let body: EvaluateRequestBody;
  try {
    body = (await request.json()) as EvaluateRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const state = typeof body.state === "string" ? body.state.trim() : "";
  if (!state) {
    return Response.json({ error: "State is required." }, { status: 400 });
  }

  let questions: Questions;
  try {
    questions = buildQuestions(Array.isArray(body.questions) ? body.questions : []);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid questions." },
      { status: 400 },
    );
  }

  const ids = new Set<string>();
  for (const spec of body.questions ?? []) {
    const id = (spec?.id ?? "").trim();
    if (!id) {
      return Response.json(
        { error: "Every question needs an id." },
        { status: 400 },
      );
    }
    if (ids.has(id)) {
      return Response.json(
        { error: `Duplicate question id "${id}".` },
        { status: 400 },
      );
    }
    ids.add(id);
  }

  try {
    const client = new TypeSafeClient();
    const result = await client.systemOne({
      state: parseState(body.state),
      model: body.model?.trim() || DEFAULT_MODEL,
      questions,
    });

    return Response.json({
      model: result.model,
      answers: result.answers,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    return Response.json({ error: message }, { status });
  }
}
