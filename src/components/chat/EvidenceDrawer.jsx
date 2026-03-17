import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, CheckCircle, ThumbsUp } from "lucide-react";
import { cn } from "../../lib/utils";

const SOURCE_BADGES = {
  csv: { label: "CSV", color: "bg-blue-100 text-blue-700" },
  paste: { label: "Paste", color: "bg-purple-100 text-purple-700" },
  url: { label: "URL", color: "bg-green-100 text-green-700" },
  image: { label: "Image", color: "bg-amber-100 text-amber-700" },
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export default function EvidenceDrawer({ isOpen, review, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sourceBadge = review?.source_modality
    ? SOURCE_BADGES[review.source_modality] || SOURCE_BADGES.paste
    : null;

  return (
    <AnimatePresence>
      {isOpen && review && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="drawer-backdrop"
          />

          {/* Drawer panel */}
          <motion.aside
            className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-label="Review detail"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Review Detail
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Reviewer name + date */}
              <div>
                <p className="font-semibold text-gray-900">
                  {review.reviewer_name || "Anonymous"}
                </p>
                {review.review_date && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(review.review_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              {/* Star rating */}
              <StarRating rating={review.rating || 0} />

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                {review.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                )}
                {sourceBadge && (
                  <span
                    className={cn(
                      "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                      sourceBadge.color
                    )}
                  >
                    {sourceBadge.label}
                  </span>
                )}
              </div>

              {/* Full review text */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {review.review_text}
                </p>
              </div>

              {/* Helpful count */}
              {review.helpful_count > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>
                    {review.helpful_count}{" "}
                    {review.helpful_count === 1 ? "person" : "people"} found
                    this helpful
                  </span>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
