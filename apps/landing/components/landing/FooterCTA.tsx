"use client";

import { motion } from "framer-motion";

export default function FooterCTA() {
  return (
    <section className="bg-navy py-20 lg:py-28">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl px-6 text-center"
      >
        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white lg:text-4xl">
          Start Analyzing Your First Product Free
        </h2>

        <p className="mt-4 text-lg text-gray-300">
          No credit card required. Up and running in 60 seconds.
        </p>

        <button className="mt-8 rounded-lg bg-white px-8 py-4 text-lg font-semibold text-teal transition hover:bg-gray-100">
          Create Free Account
        </button>

        <p className="mt-8 text-sm text-gray-400">
          Privacy Policy &middot; Terms of Service &middot; docs.reviewlens.ai
        </p>

        <p className="mt-12 text-xs text-gray-500">
          &copy; 2026 ReviewLens AI. All rights reserved.
        </p>
      </motion.div>
    </section>
  );
}
