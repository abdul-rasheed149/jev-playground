
import { choice, score, TypeSafeClient } from "@typesafe-ai/sdk";
import type { Questions } from "@typesafe-ai/sdk";
import { NextResponse } from "next/server";
import personasData from "../../../../data/personas_ml_v2.json";
import { DEFAULT_MODEL } from "@/lib/playground";

type Persona = (typeof personasData.personas)[number];

type CreativeInput = {
  pageName?: string;
  adCopy?: string;
  headline?: string;
  ctaText?: string;
  ctaType?: string;
  landingUrl?: string;
  displayFormat?: string;
  platforms?: string[];
  imageUrls?: string[];
  videoUrls?: string[];
  cards?: Array<{
    headline?: string;
    description?: string;
  }>;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ad = body.ad as CreativeInput | undefined;

    if (!ad || !(ad.adCopy || ad.headline)) {
      return NextResponse.json(
        { error: "Ad copy or headline is required." },
        { status: 400 }
      );
    }

    const personas = personasData.personas as Persona[];

    const creativeState = {
      task: "Match a Meta advertisement creative to customer personas.",
      instructions: [
        "Evaluate intended persona fit, not actual ad audience performance.",
        "Use only evidence available in the creative and persona profiles.",
        "Do not invent demographic or purchase data.",
        "A persona's historical customer count is not evidence that this ad reaches them.",
        "Treat missing creative information as unknown.",
        "Compare every persona using the same criteria."
      ],
      creative: {
        advertiser: ad.pageName ?? null,
        headline: ad.headline ?? null,
        primary_text: ad.adCopy ?? null,
        call_to_action: ad.ctaText ?? ad.ctaType ?? null,
        landing_page: ad.landingUrl ?? null,
        format: ad.displayFormat ?? null,
        platforms: ad.platforms ?? [],
        image_urls: ad.imageUrls ?? [],
        video_urls: ad.videoUrls ?? [],
        carousel_cards: ad.cards ?? []
      },
      personas
    };

    const personaOptions: Record<string, string> = {};

    for (const persona of personas) {
      personaOptions[persona.persona_id] = JSON.stringify({
        name: persona.persona_name,
        profile: persona.profile,
        behavior: persona.behavior,
        marketing_interpretation: persona.marketing_interpretation
      });
    }

    const questions: Questions = {
      primary_persona: choice(
        "Which persona is the strongest evidence-based intended audience for this creative? Compare all profiles. Choose the best fit, not merely a demographic similarity. If evidence is insufficient, choose INSUFFICIENT_EVIDENCE.",
        {
          ...personaOptions,
          INSUFFICIENT_EVIDENCE:
            "The available creative information does not support a defensible primary persona selection."
        }
      )
    };

    for (const persona of personas) {
      questions[`match_${persona.persona_id}`] = score(
        `Assess how strongly this creative aligns with persona ${persona.persona_id}. Consider its stated benefits, problems addressed, motivations, objections, offer, CTA and recommended creative angles. Score only observable alignment; do not assume the actual audience or campaign results. Persona profile: ${JSON.stringify(persona)}`,
        [
          "0 — No meaningful alignment or clear mismatch",
          "1 — Weak alignment with little supporting evidence",
          "2 — Partial alignment with some supporting evidence",
          "3 — Strong alignment across several relevant signals",
          "4 — Very strong alignment across multiple explicit signals"
        ]
      );
    }

    const client = new TypeSafeClient();

    const result = await client.systemOne({
      state: JSON.stringify(creativeState),
      model: DEFAULT_MODEL,
      questions
    });

    const primaryAnswer = result.answers.primary_persona;
    const primaryId =
      primaryAnswer?.type === "choice"
        ? primaryAnswer.choice
        : null;

    const rankedMatches = personas
      .map((persona) => {
        const answer = result.answers[`match_${persona.persona_id}`];

        return {
          persona_id: persona.persona_id,
          persona_name: persona.persona_name,
          score: answer?.type === "score" ? answer.score : null,
          confidence:
            answer?.type === "score" ? answer.confidence : null,
          probabilities:
            answer?.type === "score" ? answer.probabilities : null,
          is_primary: primaryId === persona.persona_id,
          profile: persona.profile,
          behavior: persona.behavior,
          marketing_interpretation:
            persona.marketing_interpretation
        };
      })
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    const insufficientEvidence =
      primaryId === "INSUFFICIENT_EVIDENCE";

    return NextResponse.json({
      success: true,
      model: result.model,
      primary_persona: insufficientEvidence
        ? null
        : rankedMatches.find((item) => item.persona_id === primaryId) ?? null,
      insufficient_evidence: insufficientEvidence,
      ranked_matches: rankedMatches,
      usage: result.usage,
      limitations: [
        "Scores are model assessments, not measured campaign performance.",
        "Image and video URLs are provided as references; this endpoint does not inspect their pixels or video frames.",
        "Persona profiles are seed segments from a general marketing campaign dataset."
      ]
    });
  } catch (error) {
    console.error("Persona matching failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Persona matching failed."
      },
      { status: 500 }
    );
  }
}
