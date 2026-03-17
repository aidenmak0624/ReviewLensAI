"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "We went from 3 hours of manual review reading to 5 minutes of AI-generated insight. The citation drawer is the killer feature \u2014 my team finally trusts the AI\u2019s claims.",
    name: "Sarah K.",
    role: "Head of Product, B2B SaaS",
  },
  {
    quote:
      "The skill selector changed how we do competitive analysis. Switching from Sentiment to SWOT mode gives us completely different insights from the same dataset.",
    name: "Marcus T.",
    role: "Product Manager, E-commerce",
  },
  {
    quote:
      "Finally an AI tool that shows its work. Every insight links back to the exact review. No more \u2018the AI said so\u2019 debates in product meetings.",
    name: "Priya R.",
    role: "UX Researcher, FinTech",
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

export default function Testimonials() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-[family-name:var(--font-heading)] text-navy text-center text-3xl font-bold lg:text-4xl">
          Trusted by Product Teams
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="rounded-2xl bg-gray-50 p-8"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-700 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <hr className="my-4 border-gray-200" />

              <div className="text-sm">
                <span className="text-navy font-bold">{t.name}</span>
                <span className="ml-1 text-gray-500">{t.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
