import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { ArrowLeft, FileText, BarChart3, MessageCircle } from "lucide-react";
import { cn } from "../lib/utils";

const TABS = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "reviews", label: "Reviews", icon: BarChart3 },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

export default function Product() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!error && data) {
        setProduct(data);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-border p-6 h-32 animate-pulse" />
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
      <div className="bg-white rounded-lg border border-border p-6">
        {activeTab === "summary" && (
          <div className="text-center text-muted-foreground py-8">
            Ingestion summary will appear here after reviews are ingested.
          </div>
        )}
        {activeTab === "reviews" && (
          <div className="text-center text-muted-foreground py-8">
            Review table will appear here after reviews are ingested.
          </div>
        )}
        {activeTab === "chat" && (
          <div className="text-center text-muted-foreground py-8">
            Chat interface will appear here after reviews are embedded.
          </div>
        )}
      </div>
    </div>
  );
}
