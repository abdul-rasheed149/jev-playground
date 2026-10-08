"use client";

import { useState } from "react";

type Ad = {
  pageName?: string;
  adCopy?: string;
  headline?: string;
  isActive?: boolean;
  platforms?: string[];
  runDurationDays?: number;
  sentimentLabel?: string;
  ctaType?: string;
  ctaText?: string;
  landingUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  displayFormat?: string;
};

export default function Home() {
  const [query, setQuery] = useState("Ayurveda");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchAds() {
    setLoading(true);
    setError("");
    setAds([]);

    try {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchQueries: [query],
          maxAds: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      setAds(data.ads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>
        Ad Persona Matcher
      </h1>

      <p style={{ color: "#666", marginBottom: 30 }}>
        Find Indian Meta ads and analyze their persona, messaging and creative
        signals.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 30,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter keyword..."
          style={{
            flex: 1,
            padding: "14px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 16,
          }}
        />

        <button
          onClick={searchAds}
          disabled={loading || !query.trim()}
          style={{
            padding: "14px 24px",
            border: "none",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "Searching..." : "Find Ads"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            marginBottom: 20,
            background: "#fee",
            border: "1px solid #f99",
            borderRadius: 8,
            color: "#900",
          }}
        >
          {error}
        </div>
      )}

      {ads.length > 0 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>
            Found {ads.length} Ads
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: 20,
            }}
          >
            {ads.map((ad, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 20,
                  background: "#fff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  {ad.pageName || "Unknown Advertiser"}
                </h3>

                <p>
                  <strong>Ad Copy:</strong>
                </p>

                <p style={{ color: "#555" }}>
                  {ad.adCopy || "No ad copy available"}
                </p>

                {ad.headline && (
                  <p>
                    <strong>Headline:</strong> {ad.headline}
                  </p>
                )}

                <div
                  style={{
                    display: "inline-flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px 12px",
                    marginBottom: 12,
                    borderRadius: 6,
                    background: "#111",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  CTA: {ad.ctaText || ad.ctaType || "N/A"}
                </div>

                <p>
                  <strong>Sentiment:</strong>{" "}
                  {ad.sentimentLabel || "N/A"}
                </p>

                <p>
                  <strong>Days Running:</strong>{" "}
                  {ad.runDurationDays ?? "N/A"}
                </p>

                <p>
                  <strong>Platforms:</strong>{" "}
                  {ad.platforms?.join(", ") || "N/A"}
                </p>

                <p>
                  <strong>Creative:</strong>{" "}
                  {ad.displayFormat || "N/A"}
                </p>

                {ad.landingUrl && (
                  <a
                    href={ad.landingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Landing Page →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
