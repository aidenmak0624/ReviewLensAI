import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, FileSpreadsheet, ClipboardPaste, Camera, Loader2, AlertCircle, Upload, X } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../api/supabaseClient";
import CSVUploader from "../components/ingestion/CSVUploader";
import PasteReviews from "../components/ingestion/PasteReviews";
import ReviewPreview from "../components/ingestion/ReviewPreview";

const PLATFORMS = [
  { value: "g2", label: "G2" },
  { value: "amazon", label: "Amazon" },
  { value: "google_maps", label: "Google Maps" },
  { value: "yelp", label: "Yelp" },
  { value: "capterra", label: "Capterra" },
  { value: "trustpilot", label: "Trustpilot" },
  { value: "other", label: "Other" },
];

const TABS = [
  { id: "url", label: "URL", icon: Globe },
  { id: "csv", label: "CSV Upload", icon: FileSpreadsheet },
  { id: "paste", label: "Paste Text", icon: ClipboardPaste },
  { id: "image", label: "Image", icon: Camera },
];

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

export default function NewProduct() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState("g2");
  const [activeTab, setActiveTab] = useState("csv");
  const [urlInput, setUrlInput] = useState("");

  // Ingestion state
  const [rawInput, setRawInput] = useState(null); // CSV text or paste text
  const [extractedReviews, setExtractedReviews] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Step tracking
  const [step, setStep] = useState("input"); // input | preview | saving

  const hasInput = () => {
    if (activeTab === "url") return urlInput.trim().length > 0;
    if (activeTab === "image") return imageFile !== null;
    return rawInput && rawInput.trim().length > 0;
  };

  const canSubmit = productName.trim() && hasInput() && !extracting;

  // Image validation and handling
  const validateAndSetImage = useCallback((file) => {
    setImageError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Invalid file type. Only PNG, JPG, JPEG, and WebP are accepted.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("File too large. Maximum size is 20MB.");
      return;
    }

    setImageFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleImageDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) validateAndSetImage(file);
    },
    [validateAndSetImage]
  );

  const handleImageSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetImage(file);
    },
    [validateAndSetImage]
  );

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
  };

  // Step 1: Extract reviews via OpenAI
  const handleExtract = async () => {
    if (!canSubmit) return;
    setError(null);
    setExtracting(true);

    try {
      if (activeTab === "image") {
        // Image extraction via extract-image Edge Function
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/extract-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify({
              base64Image: base64,
              mimeType: imageFile.type,
              productId: "preview", // placeholder — real ID created on confirm
            }),
          }
        );

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Image extraction failed (${response.status})`);
        }

        const data = await response.json();

        if (!data?.reviews?.length) {
          throw new Error("No reviews could be extracted from the image. Try a clearer screenshot.");
        }

        setExtractedReviews(data.reviews);
        setStep("preview");
      } else {
        // CSV / Paste / URL extraction via extract-reviews Edge Function
        const mode = activeTab;
        const input = activeTab === "url" ? urlInput : rawInput;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/extract-reviews`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify({
              mode,
              raw_input: input,
              product_id: "preview",
            }),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || data.error || `Extraction failed (${response.status})`);
        }

        if (!data?.reviews?.length) {
          throw new Error("No reviews could be extracted from the input. Please check your data format.");
        }

        setExtractedReviews(data.reviews);
        setStep("preview");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveReview = (idx) => {
    setExtractedReviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step 2: Create product, save reviews to DB, embed in Pinecone
  const handleConfirm = async () => {
    if (!extractedReviews?.length) return;
    setError(null);
    setSaving(true);
    setStep("saving");

    try {
      // 1. Create product row
      const { data: product, error: createError } = await supabase
        .from("products")
        .insert({
          name: productName.trim(),
          platform,
          source_url: activeTab === "url" ? urlInput : null,
          status: "ingesting",
        })
        .select("id")
        .single();

      if (createError) throw new Error(`Failed to create product: ${createError.message}`);

      const productId = product.id;
      const namespace = `product-${productId}`;
      const ingestionMethod =
        activeTab === "csv"
          ? "csv_upload"
          : activeTab === "paste"
          ? "paste"
          : activeTab === "image"
          ? "image"
          : "url_scrape";

      // 2. Insert reviews into Postgres
      const reviewRows = extractedReviews.map((r) => ({
        product_id: productId,
        reviewer_name: r.reviewer_name || "Anonymous",
        rating: Math.max(1, Math.min(5, r.rating || 3)),
        review_text: r.review_text,
        review_date: r.review_date || null,
        verified: r.verified || false,
        helpful_count: r.helpful_count || 0,
        source_modality: r.source_modality || activeTab,
        source_file_name: r.source_file_name || null,
      }));

      const { data: insertedReviews, error: insertError } = await supabase
        .from("reviews")
        .insert(reviewRows)
        .select("id");

      if (insertError) throw new Error(`Failed to save reviews: ${insertError.message}`);

      // 3. Compute and update product stats
      const ratingDist = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
      let totalRating = 0;
      for (const r of reviewRows) {
        ratingDist[String(r.rating)] = (ratingDist[String(r.rating)] || 0) + 1;
        totalRating += r.rating;
      }
      const avgRating = reviewRows.length > 0 ? totalRating / reviewRows.length : 0;

      await supabase
        .from("products")
        .update({
          total_reviews: reviewRows.length,
          average_rating: parseFloat(avgRating.toFixed(2)),
          rating_distribution: ratingDist,
          ingestion_method: ingestionMethod,
          pinecone_namespace: namespace,
        })
        .eq("id", productId);

      // 4. Embed reviews in Pinecone
      const reviewIds = insertedReviews.map((r) => r.id);
      const { data: embedData, error: embedError } = await supabase.functions.invoke(
        "embed-reviews",
        {
          body: { product_id: productId, namespace, review_ids: reviewIds },
        }
      );

      if (embedError) throw new Error(embedError.message);
      if (embedData?.error) throw new Error(embedData.message || embedData.error);

      // 5. Navigate to product page
      navigate(`/product?id=${productId}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
      setStep("preview");
    }
  };

  const handleBackToInput = () => {
    setStep("input");
    setExtractedReviews(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      {/* Product Info */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Product Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Notion, Slack, Figma"
              disabled={step !== "input"}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              disabled={step !== "input"}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white disabled:opacity-50"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {step === "saving" && (
        <div className="bg-white rounded-lg border border-border p-12 text-center">
          <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Ingesting Reviews</h3>
          <p className="text-sm text-muted-foreground">
            Saving to database and embedding in vector store...
          </p>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && extractedReviews && (
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Review Preview</h2>
            <button
              onClick={handleBackToInput}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to input
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Review the extracted data below. Remove any incorrect rows, then confirm to ingest.
          </p>
          <ReviewPreview
            reviews={extractedReviews}
            onRemoveReview={handleRemoveReview}
            onConfirm={handleConfirm}
            loading={saving}
          />
        </div>
      )}

      {/* Input Step */}
      {step === "input" && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setRawInput(null);
                  clearImage();
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors flex-1 justify-center",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* URL Tab */}
            {activeTab === "url" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Product Page URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.g2.com/products/notion/reviews"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Note: URL scraping may be blocked by anti-bot measures. CSV upload
                  or paste is recommended for reliable ingestion.
                </p>
              </div>
            )}

            {/* CSV Tab */}
            {activeTab === "csv" && (
              <CSVUploader
                onParsed={(csvText) => setRawInput(csvText)}
              />
            )}

            {/* Paste Tab */}
            {activeTab === "paste" && (
              <PasteReviews onParsed={(text) => setRawInput(text)} />
            )}

            {/* Image Tab */}
            {activeTab === "image" && (
              <div>
                {!imageFile ? (
                  <div
                    onDrop={handleImageDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    onClick={() =>
                      document.getElementById("image-upload-input")?.click()
                    }
                    role="button"
                    tabIndex={0}
                    aria-label="Image drop zone"
                  >
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700">
                      Drop an image here or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Accepts PNG, JPG, JPEG, WebP (max 20MB)
                    </p>
                    <input
                      id="image-upload-input"
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      data-testid="image-file-input"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {imageFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(imageFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={clearImage}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        aria-label="Remove image"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {imageError && (
                  <p className="text-sm text-red-600 mt-2">{imageError}</p>
                )}
              </div>
            )}

            {/* Extract Button */}
            <button
              onClick={handleExtract}
              disabled={!canSubmit}
              className={cn(
                "w-full mt-6 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                canSubmit
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {extracting && <Loader2 className="h-4 w-4 animate-spin" />}
              {extracting ? "Extracting Reviews..." : "Extract & Preview Reviews"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
