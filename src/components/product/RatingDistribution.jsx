import { Star } from "lucide-react";

/**
 * Horizontal bar chart showing rating distribution (1-5 stars).
 * Props:
 *   - distribution: { "1": number, "2": number, ..., "5": number }
 *   - totalReviews: number
 */
export default function RatingDistribution({ distribution, totalReviews }) {
  const dist = distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const total = totalReviews || Object.values(dist).reduce((a, b) => a + b, 0);

  // Render 5 stars down to 1 star
  const rows = [5, 4, 3, 2, 1];
  const maxCount = Math.max(...Object.values(dist), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Rating Distribution
      </h3>
      {rows.map((star) => {
        const count = dist[star] || 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            {/* Star label */}
            <div className="flex items-center gap-1 w-12 shrink-0 justify-end">
              <span className="font-medium text-muted-foreground">{star}</span>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </div>

            {/* Bar */}
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>

            {/* Count + percentage */}
            <div className="w-20 shrink-0 text-right text-muted-foreground">
              <span className="font-medium text-foreground">{count}</span>{" "}
              <span className="text-xs">({pct}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
