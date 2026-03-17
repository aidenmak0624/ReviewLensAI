"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, MessageSquare, X, Check } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const oldPains = [
  "Hours of manual reading",
  "No source verification",
  "Gut-feel decisions",
];

const newBenefits = [
  "AI analysis in seconds",
  "Clickable source citations",
  "Data-driven decisions",
];

export default function PainPoint() {
  return (
    <section id="pain-point" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-14 text-center font-[family-name:var(--font-heading)] text-3xl font-bold text-navy lg:text-4xl">
          Stop Guessing. Start Verifying.
        </h2>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Old Way */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-2xl border border-red-200 bg-red-50 p-8"
          >
            <FileSpreadsheet className="mb-4 h-10 w-10 text-red-400" />
            <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-red-700">
              The Old Way
            </h3>
            <p className="mb-6 text-red-600">
              You&apos;re manually reading 500 reviews, copy-pasting into a
              spreadsheet, and still can&apos;t prove which features to build
              next.
            </p>
            <ul className="space-y-3">
              {oldPains.map((item) => (
                <li key={item} className="flex items-center gap-3 text-red-600">
                  <X className="h-5 w-5 flex-shrink-0 text-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* New Way */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="rounded-2xl border border-teal/20 bg-teal/5 p-8"
          >
            <MessageSquare className="mb-4 h-10 w-10 text-teal" />
            <h3 className="mb-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-teal">
              With ReviewLens
            </h3>
            <p className="mb-6 text-teal/80">
              30 seconds from upload to insight. Every claim backed by the exact
              source review. Click to verify.
            </p>
            <ul className="space-y-3">
              {newBenefits.map((item) => (
                <li key={item} className="flex items-center gap-3 text-teal">
                  <Check className="h-5 w-5 flex-shrink-0 text-teal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
