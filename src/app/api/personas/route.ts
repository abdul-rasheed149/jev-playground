
import { NextResponse } from "next/server";
import personasData from "../../../../data/personas_ml_v2.json";
export async function GET() {
  try {
    return NextResponse.json(personasData);
  } catch (error) {
    console.error("Failed to load personas:", error);

    return NextResponse.json(
      { error: "Failed to load persona database" },
      { status: 500 }
    );
  }
}
