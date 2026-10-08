import { NextResponse } from "next/server";

const APIFY_URL =
  "https://api.apify.com/v2/actors/webdatalabs~meta-ad-library-scraper/run-sync-get-dataset-items";

export async function POST(request: Request) {
  try {
    const token = process.env.APIFY_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const searchQueries =
      Array.isArray(body.searchQueries) && body.searchQueries.length > 0
        ? body.searchQueries
        : ["Ayurveda"];

    const maxAds = Math.min(
      Math.max(Number(body.maxAds) || 5, 1),
      100
    );

    const input = {
      searchQueries,
      country: "IN",
      activeStatus: "active",
      adType: "all",
      mediaType: "all",
      maxAds,
      sortMode: "newest",
      analyzeSentiment: true,
      trackChanges: true,
      useProxies: true,
      proxyGroups: ["RESIDENTIAL"],
    };

    const response = await fetch(APIFY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Apify request failed",
          details: responseText,
        },
        { status: response.status }
      );
    }

    const ads = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      count: Array.isArray(ads) ? ads.length : 0,
      ads,
    });
  } catch (error) {
    console.error("Apify error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch Meta ads",
      },
      { status: 500 }
    );
  }
}
