import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { ArrowLeft, FileText, BarChart3, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import IngestionSummary from "../components/product/IngestionSummary";
import ReviewTable from "../components/product/ReviewTable";
import SentimentChart from "../components/product/SentimentChart";
import ChatInterface from "../components/chat/ChatInterface";
import EvidenceDrawer from "../components/chat/EvidenceDrawer";
import InsightReport from "../components/product/InsightReport";

const TABS = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "reviews", label: "Reviews", icon: BarChart3 },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "insight", label: "Insight", icon: Sparkles },
];

export default function Product() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerReview, setDrawerReview] = useState(null);
  const [insightData, setInsightData] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(null);
  const [insightStep, setInsightStep] = useState(0);

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

  async function handleGenerateInsight() {
    setInsightLoading(true);
    setInsightError(null);
    setInsightStep(0);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Simulate loading steps for UX (the API is a single call)
      const stepTimer1 = setTimeout(() => setInsightStep(1), 3000);
      const stepTimer2 = setTimeout(() => setInsightStep(2), 7000);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-insight`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({ product_id: product.id }),
        }
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      setInsightData(data);
    } catch (err) {
      setInsightError(err.message || "Failed to generate insight report.");
    } finally {
      setInsightLoading(false);
    }
  }

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
          <ReviewTable
            reviews={reviews}
            onRowClick={(r) => {
              setDrawerReview(r);
              setDrawerOpen(true);
            }}
          />
        </div>
      )}

      {activeTab === "chat" && (
        <div className="bg-white rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
          {product.status === "ready" ? (
            <ChatInterface
              product={product}
              onCitationClick={(review) => {
                setDrawerReview(review);
                setDrawerOpen(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Chat will be available after reviews are embedded.
            </div>
          )}
        </div>
      )}

      {activeTab === "insight" && (
        <div className="space-y-4">
          {insightData ? (
            <InsightReport data={insightData} />
          ) : insightLoading ? (
            <div className="bg-white rounded-lg border border-border p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <div className="text-center space-y-1">
                  <p className="font-medium text-gray-900">
                    {insightStep === 0 && "Gathering evidence from reviews…"}
                    {insightStep === 1 && "Analysing themes…"}
                    {insightStep === 2 && "Building action plan…"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Step {insightStep + 1} of 3
                  </p>
                </div>
              </div>
            </div>
          ) : insightError ? (
            <div className="bg-white rounded-lg border border-red-200 p-8 text-center space-y-3">
              <p className="text-red-600 text-sm">{insightError}</p>
              <button
                onClick={handleGenerateInsight}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-border p-12 text-center space-y-4">
              <Sparkles className="h-12 w-12 text-teal-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  AI Insight Report
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Generate a structured analysis of themes, FAQs, and action
                  items from your reviews.
                </p>
              </div>
              <button
                onClick={handleGenerateInsight}
                disabled={product.status !== "ready"}
                className="px-6 py-3 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate AI Insight Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Evidence Drawer — triggered from ReviewTable row click or chat citation */}
      <EvidenceDrawer
        isOpen={drawerOpen}
        review={drawerReview}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerReview(null);
        }}
      />
    </div>
  );
}
