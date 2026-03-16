import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { ArrowLeft, FileText, BarChart3, MessageCircle } from "lucide-react";
import { cn } from "../lib/utils";
import IngestionSummary from "../components/product/IngestionSummary";
import ReviewTable from "../components/product/ReviewTable";
import SentimentChart from "../components/product/SentimentChart";
import ChatInterface from "../components/chat/ChatInterface";

const TABS = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "reviews", label: "Reviews", icon: BarChart3 },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

export default function Product() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    async function fetchData() {
      if (!productId) {
        setLoading(false);
        return;
      }

      // Fetch product and reviews in parallel
      const [productRes, reviewsRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase
          .from("reviews")
          .select("*")
          .eq("product_id", productId)
          .order("review_date", { ascending: false }),
      ]);

      if (!productRes.error && productRes.data) {
        setProduct(productRes.data);
      }
      if (!reviewsRes.error && reviewsRes.data) {
        setReviews(reviewsRes.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-border p-6 h-16 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-border p-6 h-24 animate-pulse"
            />
          ))}
        </div>
        <div className="bg-white rounded-lg border border-border p-6 h-64 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Product not found.</p>
        <Link
          to="/"
          className="text-primary hover:underline text-sm font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link + Title */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {product.platform?.toUpperCase()} &middot;{" "}
          {product.total_reviews || 0} reviews &middot; Avg{" "}
          {parseFloat(product.average_rating || 0).toFixed(1)} stars
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <IngestionSummary product={product} reviews={reviews} />
          <div className="bg-white rounded-lg border border-border p-6">
            <SentimentChart reviews={reviews} />
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="bg-white rounded-lg border border-border p-6">
          <ReviewTable reviews={reviews} />
        </div>
      )}

      {activeTab === "chat" && (
        <div className="bg-white rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
          {product.status === "ready" ? (
            <ChatInterface product={product} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Chat will be available after reviews are embedded.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
