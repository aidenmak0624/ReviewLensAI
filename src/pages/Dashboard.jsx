import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../api/supabaseClient";
import { Plus, Package, Star, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";

const PLATFORM_COLORS = {
  g2: "bg-orange-100 text-orange-700",
  amazon: "bg-yellow-100 text-yellow-700",
  google_maps: "bg-blue-100 text-blue-700",
  yelp: "bg-red-100 text-red-700",
  capterra: "bg-green-100 text-green-700",
};

const PLATFORM_LABELS = {
  g2: "G2",
  amazon: "Amazon",
  google_maps: "Google Maps",
  yelp: "Yelp",
  capterra: "Capterra",
};

const STATUS_STYLES = {
  ingesting: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  error: "bg-red-100 text-red-700",
};

function StatsOverview({ products }) {
  const totalProducts = products.length;
  const totalReviews = products.reduce((sum, p) => sum + (p.total_reviews || 0), 0);
  const avgRating =
    products.length > 0
      ? (
          products.reduce((sum, p) => sum + (parseFloat(p.average_rating) || 0), 0) /
          products.length
        ).toFixed(2)
      : "0.00";

  const stats = [
    { label: "Products", value: totalProducts, icon: Package },
    { label: "Total Reviews", value: totalReviews, icon: MessageSquare },
    { label: "Avg Rating", value: avgRating, icon: Star },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-border p-5 flex items-center gap-4"
        >
          <div className="p-3 rounded-lg bg-primary/10">
            <stat.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link
      to={`/product?id=${product.id}`}
      className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow no-underline text-foreground block"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg truncate pr-2">{product.name}</h3>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
            STATUS_STYLES[product.status] || STATUS_STYLES.ingesting
          )}
        >
          {product.status}
        </span>
      </div>

      {product.platform && (
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-3",
            PLATFORM_COLORS[product.platform] || "bg-gray-100 text-gray-700"
          )}
        >
          {PLATFORM_LABELS[product.platform] || product.platform}
        </span>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {product.total_reviews || 0} reviews
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {parseFloat(product.average_rating || 0).toFixed(1)}
        </span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-5 h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          to="/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors no-underline"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <StatsOverview products={products} />

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-border">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No products yet</h2>
          <p className="text-muted-foreground mb-6">
            Add your first product to start analyzing reviews.
          </p>
          <Link
            to="/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors no-underline"
          >
            <Plus className="h-4 w-4" />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
