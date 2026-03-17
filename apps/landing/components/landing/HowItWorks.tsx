"use client";

import { motion } from "framer-motion";
import { Upload, Sparkles, MousePointerClick } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: Upload,
    title: "Upload Your Reviews",
    description:
      "Drag in a CSV, paste raw text, drop a PDF, or upload a screenshot. Any format, any platform.",
  },
  {
    number: 2,
    icon: Sparkles,
    title: "AI Analyzes Instantly",
    description:
      "Our RAG engine extracts sentiment, themes, bugs, and feature requests — grounded strictly in your data.",
  },
  {
    number: 3,
    icon: MousePointerClick,
    title: "Click to Verify",
    description:
      "Every AI claim links to the exact source review. Click any citation badge to see the original text highlighted.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-[family-name:var(--font-heading)] text-3xl font-bold text-navy lg:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mt-4 mb-16 max-w-xl text-center text-gray-600">
          From raw reviews to verified insights in three steps
        </p>

        {/* Steps grid with connector line */}
        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {/* Connector line (md+ only) */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-7 right-[calc(16.67%+28px)] left-[calc(16.67%+28px)] hidden h-0.5 bg-teal/30 md:block"
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Number circle */}
                <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal font-[family-name:var(--font-heading)] text-xl font-bold text-white shadow-lg shadow-teal/25">
                  {step.number}
                </div>

                {/* Icon */}
                <Icon className="mb-3 h-7 w-7 text-teal/70" />

                {/* Title */}
                <h3 className="mb-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-navy">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="max-w-xs text-gray-600">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
