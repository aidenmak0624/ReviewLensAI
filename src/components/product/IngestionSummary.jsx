import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Star, Calendar, Upload, Hash } from "lucide-react";

const METHOD_LABELS = {
  url_scrape: "URL Scraped",
  csv_upload: "CSV Upload",
  paste: "Pasted",
};

const SENTIMENT_COLORS = {
  Positive: "#22c55e",
  Neutral: "#eab308",
  Negative: "#ef4444",
};

const BAR_FILL = "#3b82f6";

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function computeDateRange(reviews) {
  if (!reviews || reviews.length === 0) return "N/A";

  const dates = reviews
    .map((r) => r.review_date)
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a - b);

  if (dates.length === 0) return "N/A";

  const earliest = formatDate(dates[0]);
  const latest = formatDate(dates[dates.length - 1]);

  if (earliest === latest) return earliest;
  return `${earliest} - ${latest}`;
}

function computeSentiment(reviews) {
  if (!reviews || reviews.length === 0) {
    return [
      { name: "Positive", value: 0, pct: "0%" },
      { name: "Neutral", value: 0, pct: "0%" },
      { name: "Negative", value: 0, pct: "0%" },
    ];
  }

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const r of reviews) {
    if (r.rating >= 4) positive++;
    else if (r.rating === 3) neutral++;
    else if (r.rating != null && r.rating <= 2) negative++;
  }

  const total = positive + neutral + negative || 1;
  const pct = (v) => `${Math.round((v / total) * 100)}%`;

  return [
    { name: "Positive", value: positive, pct: pct(positive) },
    { name: "Neutral", value: neutral, pct: pct(neutral) },
    { name: "Negative", value: negative, pct: pct(negative) },
  ];
}

function buildDistributionData(ratingDistribution, totalReviews) {
  const dist =
    typeof ratingDistribution === "string"
      ? JSON.parse(ratingDistribution)
      : ratingDistribution || {};

  const total = totalReviews || Object.values(dist).reduce((a, b) => a + b, 0) || 1;

  return [5, 4, 3, 2, 1].map((star) => ({
    star: `${star} ★`,
    count: dist[star] || 0,
    pct: Math.round(((dist[star] || 0) / total) * 100),
  }));
}

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CustomBarLabel({ x, y, width, height, value }) {
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      fill="#6b7280"
      fontSize={12}
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
}

export default function IngestionSummary({ product, reviews }) {
  if (!product) return null;

  const totalReviews = product.total_reviews ?? 0;
  const avgRating =
    product.average_rating != null
      ? Number(product.average_rating).toFixed(1)
      : "—";
  const dateRange = computeDateRange(reviews);
  const methodLabel = METHOD_LABELS[product.ingestion_method] || "Unknown";
  const createdAt = product.created_at ? formatDate(product.created_at) : "";

  const distributionData = buildDistributionData(
    product.rating_distribution,
    totalReviews
  );
  const sentimentData = computeSentiment(reviews);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-semibold text-foreground">
        Ingestion Summary
      </h2>

      {/* Stats Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={Hash}
          label="Total Reviews"
          value={totalReviews.toLocaleString()}
        />
        <StatTile
          icon={Star}
          label="Average Rating"
          value={`${avgRating} ★`}
        />
        <StatTile
          icon={Calendar}
          label="Date Range"
          value={dateRange}
        />
        <StatTile
          icon={Upload}
          label="Ingestion Method"
          value={methodLabel}
          sub={createdAt}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={distributionData}
              layout="vertical"
              margin={{ top: 0, right: 50, bottom: 0, left: 10 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="star"
                width={45}
                tick={{ fontSize: 13 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, _name, props) => [
                  `${value} (${props.payload.pct}%)`,
                  "Reviews",
                ]}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                barSize={18}
                label={<CustomBarLabel />}
              >
                {distributionData.map((entry, idx) => (
                  <Cell key={idx} fill={BAR_FILL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment Breakdown */}
        <div className="bg-white rounded-lg border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Sentiment Breakdown
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, value, pct }) =>
                    value > 0 ? `${name} ${pct}` : ""
                  }
                >
                  {sentimentData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SENTIMENT_COLORS[entry.name]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} reviews`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-5 mt-2">
            {sentimentData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS[s.name] }}
                />
                <span className="text-muted-foreground">
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
