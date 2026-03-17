export const SKILL_PROMPTS: Record<
  string,
  { label: string; emoji: string; description: string; prompt: string }
> = {
  general: {
    label: "General",
    emoji: "💬",
    description: "Open-ended analysis",
    prompt: "",
  },
  feature_extraction: {
    label: "Features",
    emoji: "🔧",
    description: "Identify requested & praised features",
    prompt:
      "Focus on extracting product features that reviewers mention. Categorise them as 'most requested', 'most praised', and 'most criticized'. Rank by frequency and urgency. Cite the relevant reviews.",
  },
  ui_bug_detection: {
    label: "UI Bugs",
    emoji: "🐛",
    description: "Surface interface friction & broken flows",
    prompt:
      "Identify mentions of interface friction, broken flows, confusing navigation, unresponsive buttons, layout issues, and exact error messages quoted by reviewers. Focus exclusively on UI/UX problems. Cite the relevant reviews.",
  },
  sentiment_analysis: {
    label: "Sentiment",
    emoji: "😤",
    description: "Classify reviewer tone",
    prompt:
      "Classify each reviewer's sentiment into one of these categories: Aggressive, Frustrated, Neutral, Satisfied, or Evangelist. Provide a count and percentage breakdown. Quote short representative phrases from each category. Cite the relevant reviews.",
  },
  competitor_swot: {
    label: "SWOT",
    emoji: "⚔️",
    description: "Build SWOT from competitor mentions",
    prompt:
      "Compare the primary product against any competitors mentioned in the reviews. Build a SWOT matrix (Strengths, Weaknesses, Opportunities, Threats) based solely on reviewer comments. Cite the relevant reviews for each point.",
  },
  pricing_complaints: {
    label: "Pricing",
    emoji: "💰",
    description: "Isolate cost & value mentions",
    prompt:
      "Focus only on mentions of price, cost, value, expensive, cheap, refund, billing, subscription tiers, or free tier limitations. Summarise the pricing sentiment and list specific complaints or praise about pricing. Cite the relevant reviews.",
  },
  executive_summary: {
    label: "Executive",
    emoji: "📋",
    description: "Top 3 insights, plain language",
    prompt:
      "Summarise the top 3 insights from these reviews in plain, non-technical language suitable for a C-level executive. Maximum 200 words total. No jargon. Each insight should be one sentence followed by a brief supporting sentence. Cite the relevant reviews.",
  },
};
