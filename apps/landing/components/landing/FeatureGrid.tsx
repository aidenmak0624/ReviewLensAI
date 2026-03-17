"use client";

import { motion } from "framer-motion";
import { Layers, Link2, FileText, Sliders, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Multimodal Ingestion",
    body: "CSV, paste, URL scraping, PDF, and image uploads. AI auto-maps any column format.",
  },
  {
    icon: Link2,
    title: "Verifiable Citations",
    body: "Every AI claim links to the source review. Click to open the original document with the cited text highlighted.",
  },
  {
    icon: FileText,
    title: "AI Insight Reports",
    body: "One click generates a full strategic document: themes, FAQs, and prioritized action items \u2014 all cited.",
  },
  {
    icon: Sliders,
    title: "AI Skill Selector",
    body: "Switch between analytical lenses: Feature Extraction, UI Bug Detection, Competitor SWOT, and more.",
  },
  {
    icon: BarChart3,
    title: "Competitor Benchmarking",
    body: "Paste a competitor\u2019s review page URL. Instantly compare sentiment, themes, and customer pain points.",
  },
  {
    icon: Shield,
    title: "Guardrailed Answers",
    body: "The AI only answers questions about your ingested data. No hallucinations. No off-topic drift.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function FeatureGrid() {
  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-[family-name:var(--font-heading)] text-navy text-center text-3xl font-bold lg:text-4xl">
          Everything You Need to Analyze Reviews
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:border-teal/20 hover:shadow-lg"
            >
              <f.icon className="mb-4 h-10 w-10 text-teal" />
              <h3 className="font-[family-name:var(--font-heading)] text-navy text-lg font-semibold">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
