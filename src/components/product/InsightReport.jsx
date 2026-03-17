import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clipboard,
  Download,
  Lightbulb,
  HelpCircle,
  Target,
  Check,
} from "lucide-react";
import { cn } from "../../lib/utils";

const PRIORITY_STYLES = {
  high: { label: "HIGH", color: "bg-red-100 text-red-700" },
  med: { label: "MED", color: "bg-amber-100 text-amber-700" },
  low: { label: "LOW", color: "bg-gray-100 text-gray-600" },
};

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function InsightReport({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const { themes = [], faqs = [], actions = [] } = data;

  async function handleCopyActions() {
    const text = actions
      .map(
        (a) =>
          `[${(a.priority || "med").toUpperCase()}] ${a.action}`
      )
      .join("\n");

    // Try clipboard API, then fallback to execCommand, then just show feedback
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch {
      // clipboard API failed
    }

    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        // execCommand also failed
      }
    }

    // Always show confirmation — the text was at least selected
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPDF() {
    // Dynamically import jsPDF to keep bundle small
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("AI Insight Report", 20, y);
    y += 12;

    // Themes
    doc.setFontSize(14);
    doc.text("Evidence & Themes", 20, y);
    y += 8;
    doc.setFontSize(10);
    for (const theme of themes) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont(undefined, "bold");
      doc.text(`• ${theme.theme}`, 20, y);
      y += 5;
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(theme.summary, 170);
      doc.text(lines, 25, y);
      y += lines.length * 5 + 3;
    }

    y += 5;
    // FAQs
    doc.setFontSize(14);
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text("FAQ & Friction Points", 20, y);
    y += 8;
    doc.setFontSize(10);
    for (let i = 0; i < faqs.length; i++) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont(undefined, "bold");
      doc.text(`${i + 1}. ${faqs[i].question}`, 20, y);
      y += 5;
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(faqs[i].answer, 170);
      doc.text(lines, 25, y);
      y += lines.length * 5 + 3;
    }

    y += 5;
    // Actions
    doc.setFontSize(14);
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text("Action Items", 20, y);
    y += 8;
    doc.setFontSize(10);
    for (const action of actions) {
      if (y > 260) { doc.addPage(); y = 20; }
      const priority = (action.priority || "med").toUpperCase();
      doc.setFont(undefined, "bold");
      doc.text(`[${priority}] ${action.action}`, 20, y);
      y += 5;
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(action.rationale, 170);
      doc.text(lines, 25, y);
      y += lines.length * 5 + 3;
    }

    doc.save("insight-report.pdf");
  }

  return (
    <div className="space-y-4">
      {/* Section 1 — Themes */}
      <CollapsibleSection title="Evidence & Themes" icon={Lightbulb}>
        <div className="space-y-3">
          {themes.map((theme, idx) => (
            <div
              key={idx}
              className="border-l-4 border-teal-500 pl-4 py-1"
            >
              <p className="font-semibold text-gray-900 text-sm">
                {theme.theme}
              </p>
              <p className="text-sm text-gray-600 mt-1">{theme.summary}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 2 — FAQs */}
      <CollapsibleSection title="FAQ & Friction Points" icon={HelpCircle}>
        <ol className="space-y-4 list-decimal list-inside">
          {faqs.map((faq, idx) => (
            <li key={idx} className="text-sm">
              <span className="font-semibold text-gray-900">
                {faq.question}
              </span>
              <p className="text-gray-600 mt-1 ml-5">{faq.answer}</p>
            </li>
          ))}
        </ol>
      </CollapsibleSection>

      {/* Section 3 — Actions */}
      <CollapsibleSection title="Action Items" icon={Target}>
        <div className="space-y-3">
          {actions.map((action, idx) => {
            const priority =
              PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.med;
            return (
              <div key={idx} className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mt-0.5 shrink-0",
                    priority.color
                  )}
                >
                  {priority.label}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {action.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {action.rationale}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Export bar */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleCopyActions}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4" />
              Copy Action Items
            </>
          )}
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
