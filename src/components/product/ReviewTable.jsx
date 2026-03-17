import { useState, useMemo } from "react";
import { Star, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const REVIEWS_PER_PAGE = 10;

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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function ReviewTable({ reviews, onRowClick }) {
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const safeReviews = reviews ?? [];

  const filtered = useMemo(() => {
    let result = safeReviews;

    if (starFilter) {
      result = result.filter((r) => r.rating === starFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) => r.review_text && r.review_text.toLowerCase().includes(q)
      );
    }

    return result;
  }, [safeReviews, starFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * REVIEWS_PER_PAGE;
  const pageReviews = filtered.slice(pageStart, pageStart + REVIEWS_PER_PAGE);

  function handleSearchChange(e) {
    setSearch(e.target.value);
    setCurrentPage(1);
  }

  function handleStarFilter(star) {
    setStarFilter(starFilter === star ? null : star);
    setCurrentPage(1);
  }

  function handleClearFilter() {
    setStarFilter(null);
    setCurrentPage(1);
  }

  function toggleExpand(index) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search reviews..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Star filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleClearFilter}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
            starFilter === null
              ? "bg-blue-600 text-white border-blue-600"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </button>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarFilter(star)}
            className={cn(
              "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border transition-colors",
              starFilter === star
                ? "bg-blue-600 text-white border-blue-600"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {star}
            <Star
              className={cn(
                "h-3 w-3",
                starFilter === star
                  ? "fill-white text-white"
                  : "fill-amber-400 text-amber-400"
              )}
            />
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {safeReviews.length} reviews
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No reviews match your filters
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-10">
                    #
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28">
                    Rating
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">
                    Reviewer
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Review
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageReviews.map((review, idx) => {
                  const globalIndex = pageStart + idx;
                  const isExpanded = expandedRows.has(globalIndex);
                  const text = review.review_text || "";
                  const isTruncatable = text.length > 200;

                  return (
                    <tr
                      key={review.id ?? globalIndex}
                      className={cn(
                        "border-t border-border hover:bg-muted/30",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick?.(review)}
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {globalIndex + 1}
                      </td>
                      <td className="px-3 py-2">
                        <StarRating rating={review.rating} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {review.reviewer_name || "Anonymous"}
                      </td>
                      <td className="px-3 py-2">
                        <p
                          className={cn(
                            "max-w-lg",
                            isTruncatable && "cursor-pointer"
                          )}
                          onClick={
                            isTruncatable
                              ? () => toggleExpand(globalIndex)
                              : undefined
                          }
                        >
                          {isExpanded || !isTruncatable
                            ? text
                            : `${text.slice(0, 200)}...`}
                        </p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {formatDate(review.review_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border transition-colors",
              safePage <= 1
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border transition-colors",
              safePage >= totalPages
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
