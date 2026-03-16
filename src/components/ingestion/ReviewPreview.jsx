import { Star, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewPreview({ reviews, onRemoveReview, onConfirm, loading }) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          Extracted Reviews ({reviews.length})
        </h3>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Reviewer</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Rating</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Review</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, idx) => (
                <tr key={idx} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {review.reviewer_name || "Anonymous"}
                  </td>
                  <td className="px-3 py-2">
                    <StarRating rating={review.rating} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {review.review_date || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <p className="line-clamp-2 max-w-md">
                      {review.review_text}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onRemoveReview(idx)}
                      className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Remove review ${idx + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={loading || reviews.length === 0}
        className={cn(
          "w-full mt-4 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
          loading
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary-hover"
        )}
      >
        {loading ? "Saving & Embedding..." : `Confirm & Ingest ${reviews.length} Reviews`}
      </button>
    </div>
  );
}
