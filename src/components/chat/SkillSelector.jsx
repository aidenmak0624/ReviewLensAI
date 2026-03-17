import { cn } from "../../lib/utils";

const SKILLS = [
  { key: "general", emoji: "💬", label: "General" },
  { key: "feature_extraction", emoji: "🔧", label: "Features" },
  { key: "ui_bug_detection", emoji: "🐛", label: "UI Bugs" },
  { key: "sentiment_analysis", emoji: "😤", label: "Sentiment" },
  { key: "competitor_swot", emoji: "⚔️", label: "SWOT" },
  { key: "pricing_complaints", emoji: "💰", label: "Pricing" },
  { key: "executive_summary", emoji: "📋", label: "Executive" },
];

export default function SkillSelector({ selectedSkill, onSkillChange }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="tablist"
      aria-label="Analysis skill selector"
    >
      {SKILLS.map(({ key, emoji, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={selectedSkill === key}
          onClick={() => onSkillChange(key)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors",
            selectedSkill === key
              ? "bg-teal-100 border-teal-600 text-teal-800"
              : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
          )}
        >
          <span>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
