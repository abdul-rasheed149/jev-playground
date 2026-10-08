"use client";

import { useMemo, useState } from "react";

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
  cards?: Array<{
    imageUrl?: string;
    videoUrl?: string;
    headline?: string;
    description?: string;
    link?: string;
  }>;
};

function truncate(text = "", length = 240) {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

function getCreativeType(ad: Ad) {
  if (ad.videoUrls?.length) return "VIDEO";
  if (ad.imageUrls?.length) return "IMAGE";
  if (ad.cards?.length) return "CAROUSEL";
  return ad.displayFormat || "UNKNOWN";
}

function getSentimentClass(sentiment?: string) {
  const value = sentiment?.toLowerCase();

  if (value === "positive") return "sentiment positive";
  if (value === "negative") return "sentiment negative";

  return "sentiment neutral";
}

export default function Home() {
  const [query, setQuery] = useState("Ayurveda");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [sort, setSort] = useState("newest");
  const [activeOnly, setActiveOnly] = useState(true);

  async function searchAds() {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setAds([]);
    setSelectedAd(null);

    try {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchQueries: [query],
          maxAds: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Unable to fetch ads"
        );
      }

      setAds(data.ads || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching ads."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredAds = useMemo(() => {
    let result = [...ads];

    if (activeOnly) {
      result = result.filter((ad) => ad.isActive !== false);
    }

    if (sort === "newest") {
      result.sort(
        (a, b) =>
          (b.runDurationDays ?? 0) - (a.runDurationDays ?? 0)
      );
    }

    if (sort === "oldest") {
      result.sort(
        (a, b) =>
          (a.runDurationDays ?? 0) - (b.runDurationDays ?? 0)
      );
    }

    return result;
  }, [ads, activeOnly, sort]);

  const videoCount = ads.filter(
    (ad) => ad.videoUrls?.length
  ).length;

  const imageCount = ads.filter(
    (ad) => ad.imageUrls?.length
  ).length;

  const carouselCount = ads.filter(
    (ad) => ad.cards?.length
  ).length;

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #09090b;
          color: #f4f4f5;
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        button,
        input,
        select {
          font: inherit;
        }

        .app {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(99,102,241,.10),
              transparent 30%
            ),
            #09090b;
        }

        .container {
          width: min(1500px, 94%);
          margin: auto;
          padding: 36px 0 70px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-bottom: 32px;
        }

        .eyebrow {
          color: #818cf8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        h1 {
          font-size: clamp(32px, 4vw, 54px);
          line-height: 1;
          margin: 0;
          letter-spacing: -.04em;
        }

        .subtitle {
          color: #a1a1aa;
          margin-top: 14px;
          max-width: 720px;
          line-height: 1.6;
        }

        .search-panel {
          border: 1px solid #27272a;
          background: rgba(24,24,27,.72);
          backdrop-filter: blur(20px);
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 28px;
        }

        .search-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
        }

        .search-input {
          width: 100%;
          border: 1px solid #3f3f46;
          background: #09090b;
          color: white;
          border-radius: 12px;
          padding: 16px 18px;
          outline: none;
        }

        .search-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.15);
        }

        .primary-button {
          border: 0;
          border-radius: 12px;
          padding: 0 28px;
          min-height: 54px;
          background: #6366f1;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: .2s;
        }

        .primary-button:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          opacity: .5;
          cursor: not-allowed;
          transform: none;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filters {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .select {
          background: #18181b;
          border: 1px solid #27272a;
          color: #e4e4e7;
          padding: 9px 12px;
          border-radius: 9px;
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a1a1aa;
          font-size: 13px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        .stat {
          border: 1px solid #27272a;
          background: #111113;
          border-radius: 14px;
          padding: 18px;
        }

        .stat-label {
          color: #71717a;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          margin-top: 8px;
        }

        .error {
          background: rgba(127,29,29,.25);
          border: 1px solid #7f1d1d;
          color: #fecaca;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 22px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .card {
          background: #fff;
          color: #18181b;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e4e4e7;
          box-shadow: 0 10px 30px rgba(0,0,0,.15);
          transition: .2s;
        }

        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 45px rgba(0,0,0,.25);
        }

        .creative {
          position: relative;
          background: #18181b;
          aspect-ratio: 1.55;
          overflow: hidden;
        }

        .creative img,
        .creative video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .creative-placeholder {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71717a;
          font-size: 13px;
        }

        .status {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(0,0,0,.75);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
        }

        .card-body {
          padding: 18px;
        }

        .advertiser {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .headline {
          font-size: 14px;
          font-weight: 700;
          margin: 12px 0 8px;
        }

        .copy {
          color: #52525b;
          line-height: 1.55;
          font-size: 13px;
        }

        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 14px 0;
        }

        .badge {
          padding: 5px 8px;
          border-radius: 6px;
          background: #f4f4f5;
          color: #52525b;
          font-size: 10px;
          font-weight: 700;
        }

        .sentiment {
          display: inline-block;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .positive {
          background: #dcfce7;
          color: #166534;
        }

        .negative {
          background: #fee2e2;
          color: #991b1b;
        }

        .neutral {
          background: #f4f4f5;
          color: #52525b;
        }

        .cta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #e4e4e7;
        }

        .cta-label {
          font-size: 10px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .cta-value {
          font-weight: 800;
          font-size: 12px;
        }

        .view-button {
          margin-top: 14px;
          width: 100%;
          border: 1px solid #d4d4d8;
          background: white;
          padding: 10px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .view-button:hover {
          background: #f4f4f5;
        }

        .drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.65);
          z-index: 50;
        }

        .drawer {
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          width: min(680px, 94vw);
          background: #111113;
          border-left: 1px solid #27272a;
          z-index: 51;
          overflow-y: auto;
          padding: 28px;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          margin-bottom: 20px;
        }

        .close {
          border: 1px solid #3f3f46;
          background: #18181b;
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 9px;
          cursor: pointer;
        }

        .analysis-box {
          border: 1px solid #27272a;
          background: #18181b;
          border-radius: 14px;
          padding: 18px;
          margin-top: 18px;
        }

        .analysis-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #818cf8;
          font-weight: 800;
          letter-spacing: .1em;
          margin-bottom: 12px;
        }

        @media(max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media(max-width: 650px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: 1fr 1fr;
          }

          .search-row {
            grid-template-columns: 1fr;
          }

          .primary-button {
            min-height: 48px;
          }
        }
      `}</style>

      <div className="app">
        <div className="container">

          {/* HEADER */}
          <header className="header">
            <div>
              <div className="eyebrow">
                Meta Ad Intelligence
              </div>

              <h1>Ad Persona Matcher</h1>

              <p className="subtitle">
                Discover Indian Meta ads, identify creative patterns,
                understand messaging signals and prepare campaigns for
                persona-level analysis.
              </p>
            </div>
          </header>

          {/* SEARCH */}
          <section className="search-panel">
            <div className="search-row">
              <input
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchAds();
                }}
                placeholder="Search ads by keyword, product, problem or category..."
              />

              <button
                className="primary-button"
                onClick={searchAds}
                disabled={loading || !query.trim()}
              >
                {loading ? "Collecting..." : "Find Ads"}
              </button>
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div className="error">
              <strong>Collection failed:</strong> {error}
            </div>
          )}

          {/* STATS */}
          {ads.length > 0 && (
            <section className="stats">
              <div className="stat">
                <div className="stat-label">
                  Ads Found
                </div>
                <div className="stat-value">
                  {ads.length}
                </div>
              </div>

              <div className="stat">
                <div className="stat-label">
                  Video Ads
                </div>
                <div className="stat-value">
                  {videoCount}
                </div>
              </div>

              <div className="stat">
                <div className="stat-label">
                  Image Ads
                </div>
                <div className="stat-value">
                  {imageCount}
                </div>
              </div>

              <div className="stat">
                <div className="stat-label">
                  Carousel Ads
                </div>
                <div className="stat-value">
                  {carouselCount}
                </div>
              </div>
            </section>
          )}

          {/* TOOLBAR */}
          {ads.length > 0 && (
            <div className="toolbar">

              <strong>
                {filteredAds.length} Ads
              </strong>

              <div className="filters">

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) =>
                      setActiveOnly(e.target.checked)
                    }
                  />
                  Active only
                </label>

                <select
                  className="select"
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value)
                  }
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="oldest">
                    Oldest
                  </option>
                </select>

              </div>
            </div>
          )}

          {/* ADS */}
          {filteredAds.length > 0 && (
            <section className="grid">

              {filteredAds.map((ad, index) => {

                const creativeType =
                  getCreativeType(ad);

                return (
                  <article
                    className="card"
                    key={`${ad.pageName}-${index}`}
                  >

                    {/* CREATIVE */}
                    <div className="creative">

                      {ad.videoUrls?.[0] ? (
                        <video
                          src={ad.videoUrls[0]}
                          controls
                          muted
                          playsInline
                        />
                      ) : ad.imageUrls?.[0] ? (
                        <img
                          src={ad.imageUrls[0]}
                          alt={
                            ad.headline ||
                            "Meta advertisement"
                          }
                        />
                      ) : (
                        <div className="creative-placeholder">
                          No creative preview
                        </div>
                      )}

                      <div className="status">
                        {ad.isActive === false
                          ? "INACTIVE"
                          : "ACTIVE"}
                      </div>

                    </div>

                    {/* BODY */}
                    <div className="card-body">

                      <div className="advertiser">
                        {ad.pageName ||
                          "Unknown Advertiser"}
                      </div>

                      {ad.headline && (
                        <div className="headline">
                          {ad.headline}
                        </div>
                      )}

                      <div className="copy">
                        {truncate(
                          ad.adCopy ||
                            "No ad copy available"
                        )}
                      </div>

                      {/* BADGES */}
                      <div className="badges">

                        <span className="badge">
                          {creativeType}
                        </span>

                        <span
                          className={getSentimentClass(
                            ad.sentimentLabel
                          )}
                        >
                          {ad.sentimentLabel ||
                            "Unknown"}
                        </span>

                        <span className="badge">
                          {ad.runDurationDays ?? 0} days
                        </span>

                        {ad.platforms
                          ?.slice(0, 3)
                          .map((platform) => (
                            <span
                              className="badge"
                              key={platform}
                            >
                              {platform}
                            </span>
                          ))}

                      </div>

                      {/* CTA */}
                      <div className="cta">

                        <div>
                          <div className="cta-label">
                            Call to Action
                          </div>

                          <div className="cta-value">
                            {ad.ctaText ||
                              ad.ctaType ||
                              "N/A"}
                          </div>
                        </div>

                        {ad.landingUrl && (
                          <a
                            href={ad.landingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4f46e5",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Landing Page →
                          </a>
                        )}

                      </div>

                      {/* ANALYZE */}
                      <button
                        className="view-button"
                        onClick={() =>
                          setSelectedAd(ad)
                        }
                      >
                        Analyze Persona →
                      </button>

                    </div>

                  </article>
                );
              })}

            </section>
          )}

          {/* EMPTY STATE */}
          {!loading &&
            ads.length === 0 &&
            !error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "90px 20px",
                  color: "#71717a",
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    marginBottom: 12,
                  }}
                >
                  ◉
                </div>

                <h2
                  style={{
                    color: "#e4e4e7",
                    marginBottom: 8,
                  }}
                >
                  Search the Meta Ad Library
                </h2>

                <p>
                  Enter a product, category, problem,
                  competitor or keyword.
                </p>
              </div>
            )}

        </div>
      </div>

      {/* ANALYSIS DRAWER */}
      {selectedAd && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setSelectedAd(null)}
          />

          <aside className="drawer">

            <div className="drawer-header">

              <div>
                <div className="eyebrow">
                  Ad Analysis
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                  }}
                >
                  {selectedAd.pageName ||
                    "Advertisement"}
                </h2>
              </div>

              <button
                className="close"
                onClick={() =>
                  setSelectedAd(null)
                }
              >
                ×
              </button>

            </div>

            {selectedAd.imageUrls?.[0] && (
              <img
                src={selectedAd.imageUrls[0]}
                alt="Advertisement creative"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  marginBottom: 18,
                }}
              />
            )}

            {selectedAd.videoUrls?.[0] && (
              <video
                src={selectedAd.videoUrls[0]}
                controls
                style={{
                  width: "100%",
                  borderRadius: 12,
                  marginBottom: 18,
                }}
              />
            )}

            <div className="analysis-box">

              <div className="analysis-title">
                Current Ad Signals
              </div>

              <p>
                <strong>Headline</strong>
                <br />
                {selectedAd.headline ||
                  "Not available"}
              </p>

              <p>
                <strong>Ad Copy</strong>
                <br />
                {selectedAd.adCopy ||
                  "Not available"}
              </p>

              <p>
                <strong>CTA</strong>
                <br />
                {selectedAd.ctaText ||
                  selectedAd.ctaType ||
                  "Not available"}
              </p>

              <p>
                <strong>Creative Format</strong>
                <br />
                {getCreativeType(selectedAd)}
              </p>

              <p>
                <strong>Platforms</strong>
                <br />
                {selectedAd.platforms?.join(
                  ", "
                ) || "Not available"}
              </p>

              <p>
                <strong>Days Running</strong>
                <br />
                {selectedAd.runDurationDays ??
                  "Not available"}
              </p>

            </div>

            <div className="analysis-box">

              <div className="analysis-title">
                Persona Analysis
              </div>

              <p style={{ color: "#a1a1aa" }}>
                Jev analysis will be connected here.
                This section will generate:
              </p>

              <ul
                style={{
                  color: "#d4d4d8",
                  lineHeight: 1.8,
                }}
              >
                <li>Target persona</li>
                <li>Demographic signals</li>
                <li>Pain points</li>
                <li>Desires and motivations</li>
                <li>Purchase intent</li>
                <li>Objections</li>
                <li>Messaging angle</li>
                <li>Creative angle</li>
                <li>Persona match score</li>
              </ul>

            </div>

          </aside>
        </>
      )}
    </>
  );
}
