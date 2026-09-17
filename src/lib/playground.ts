export type NoulQuestionSpec = {
  id: string;
  type: "noul";
  instructions: string;
  yesMeaning: string;
  noMeaning: string;
};

export type ChoiceOption = {
  label: string;
  description: string;
};

export type ChoiceQuestionSpec = {
  id: string;
  type: "choice";
  instructions: string;
  options: ChoiceOption[];
};

export type ScoreQuestionSpec = {
  id: string;
  type: "score";
  instructions: string;
  levels: string[];
};

export type QuestionSpec = NoulQuestionSpec | ChoiceQuestionSpec | ScoreQuestionSpec;

export type EvaluateRequestBody = {
  state: string;
  model: string;
  questions: QuestionSpec[];
};

export type NoulAnswer = {
  type: "noul";
  noul: number;
};

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type EvaluateResult = {
  model: string;
  answers: Record<string, Answer>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

export const DEFAULT_MODEL = "jev-latest";

export const SAMPLE_STATE =
  "Hi, I've been trying to connect my Stripe account for 3 days and it keeps failing. I'm losing sales. Please help ASAP.";

export function sampleQuestions(): QuestionSpec[] {
  return [
    {
      id: "department",
      type: "choice",
      instructions: "Which team should handle this",
      options: [
        { label: "billing", description: "Payment or subscription issues" },
        { label: "technical", description: "Bugs or integration problems" },
        { label: "sales", description: "Pricing or account questions" },
      ],
    },
    {
      id: "frustration",
      type: "score",
      instructions: "How frustrated the customer appears",
      levels: [
        "Calm, just stating facts",
        "Frustrated but civil",
        "Very angry, strong language",
      ],
    },
    {
      id: "is_urgent",
      type: "noul",
      instructions: "The message conveys urgency or time-sensitivity",
      yesMeaning: "",
      noMeaning: "",
    },
  ];
}

export function uniqueId(existing: string[], base: string): string {
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

export function looksLikeJson(text: string): boolean {
  const t = text.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}
