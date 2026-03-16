import { useMemo } from "react";

/**
 * SentimentChart — visualises sentiment distribution derived from review ratings.
 *
 * Positive: rating >= 4  |  Neutral: rating === 3  |  Negative: rating <= 2
 *
 * @param {{ reviews: Array<{ rating: number }> }} props
 */
export default function SentimentChart({ reviews = [] }) {
  const { positive, neutral, negative, total } = useMemo(() => {
    let pos = 0;
    let neu = 0;
    let neg = 0;

    for (const r of reviews) {
      if (r.rating >= 4) pos++;
      else if (r.rating === 3) neu++;
      else neg++;
    }

    return { positive: pos, neutral: neu, negative: neg, total: reviews.length };
  }, [reviews]);

  if (total === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-400">
        No reviews to analyse.
      </div>
    );
  }

  const pct = (count) => ((count / total) * 100).toFixed(1);

  const segments = [
    {
      label: "Positive",
      emoji: "\uD83D\uDE0A",
      count: positive,
      color: "#22c55e",
      border: "border-l-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Neutral",
      emoji: "\uD83D\uDE10",
      count: neutral,
      color: "#eab308",
      border: "border-l-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Negative",
      emoji: "\uD83D\uDE1F",
      count: negative,
      color: "#ef4444",
      border: "border-l-red-500",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border border-gray-200 border-l-4 ${s.border} ${s.bg} p-4`}
          >
            <p className="text-sm text-gray-500">
              {s.emoji} {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.count}</p>
            <p className="text-sm text-gray-500">{pct(s.count)}%</p>
          </div>
        ))}
      </div>

      {/* Horizontal stacked bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {segments.map(
          (s) =>
            s.count > 0 && (
              <div
                key={s.label}
                style={{
                  width: `${pct(s.count)}%`,
                  backgroundColor: s.color,
                }}
                title={`${s.label}: ${s.count} (${pct(s.count)}%)`}
              />
            ),
        )}
      </div>
    </div>
  );
}
