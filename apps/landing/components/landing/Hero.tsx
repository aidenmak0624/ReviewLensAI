"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import DemoAnimation from "@/components/landing/DemoAnimation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const platforms = ["Amazon", "G2", "Yelp", "Shopify", "Capterra"];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-navy overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left — text content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <motion.p
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-mint text-sm tracking-widest uppercase font-[family-name:var(--font-body)] mb-4"
            >
              AI-Powered Multimodal Review Analytics
            </motion.p>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-[family-name:var(--font-heading)] text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white mb-6"
            >
              Turn Thousands of Unstructured Reviews into Verifiable Product
              Decisions in Seconds
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-gray-300 text-lg font-[family-name:var(--font-body)] mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Upload Amazon CSVs, UI screenshots, or research PDFs. Our RAG
              engine extracts sentiment, identifies bugs, and shows clickable
              visual proof for every AI-generated claim.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-2"
            >
              <a
                href="https://review-lens-ai-five.vercel.app/"
                className="inline-block rounded-lg bg-teal px-8 py-4 text-lg font-semibold text-white transition hover:bg-teal/90"
              >
                Start 14-Day Free Trial
              </a>
              <a
                href="https://review-lens-ai-five.vercel.app/"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-white transition hover:bg-white/10"
              >
                <Play size={18} />
                Try the App
              </a>
            </motion.div>

            <motion.p
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-gray-400 text-sm mb-10"
            >
              No credit card required
            </motion.p>

            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3 justify-center lg:justify-start"
            >
              <span className="text-gray-400 text-sm">
                Works with reviews from
              </span>
              {platforms.map((name) => (
                <span
                  key={name}
                  className="text-gray-500 text-sm font-medium"
                >
                  {name}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — demo animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:w-1/2 w-full"
          >
            <DemoAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
