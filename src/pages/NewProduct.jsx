import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, FileSpreadsheet, ClipboardPaste } from "lucide-react";
import { cn } from "../lib/utils";

const PLATFORMS = [
  { value: "g2", label: "G2" },
  { value: "amazon", label: "Amazon" },
  { value: "google_maps", label: "Google Maps" },
  { value: "yelp", label: "Yelp" },
  { value: "capterra", label: "Capterra" },
];

const TABS = [
  { id: "url", label: "URL", icon: Globe },
  { id: "csv", label: "CSV Upload", icon: FileSpreadsheet },
  { id: "paste", label: "Paste Text", icon: ClipboardPaste },
];

export default function NewProduct() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState("g2");
  const [activeTab, setActiveTab] = useState("csv");
  const [urlInput, setUrlInput] = useState("");
  const [pasteInput, setPasteInput] = useState("");

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
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
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

      {/* Ingestion Tabs */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
            <div>
              <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">
                  Drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports any column format — AI will map columns automatically
                </p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                />
              </div>
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === "paste" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Paste Review Text
              </label>
              <textarea
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder={`Paste reviews here. Any format works — the AI will extract structured data.\n\nExample:\nJohn D. - 5 stars - March 1, 2026\n"Great product, love the interface!"\n\nJane S. - 3 stars - Feb 28, 2026\n"Decent but could use better documentation."`}
                rows={10}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>
          )}

          {/* Submit */}
          <button
            disabled={!productName.trim()}
            className={cn(
              "w-full mt-6 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              productName.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Extract & Ingest Reviews
          </button>
        </div>
      </div>
    </div>
  );
}
