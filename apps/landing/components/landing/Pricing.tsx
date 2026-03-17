"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Tier {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  ctaStyle: string;
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: [
      "3 products",
      "100 reviews/mo",
      "Text-only ingestion",
      "AI chat",
    ],
    cta: "Start Free Trial",
    href: "https://review-lens-ai-five.vercel.app/",
    ctaStyle:
      "border border-teal text-teal hover:bg-teal/5 transition-colors",
  },
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    features: [
      "10 products",
      "1,000 reviews/mo",
      "CSV + paste ingestion",
      "Skill selector",
    ],
    cta: "Start Free Trial",
    href: "https://review-lens-ai-five.vercel.app/",
    ctaStyle:
      "border border-teal text-teal hover:bg-teal/5 transition-colors",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    features: [
      "50 products",
      "10,000 reviews/mo",
      "All modalities",
      "5 Insight Reports/mo",
    ],
    cta: "Start Free Trial",
    href: "https://review-lens-ai-five.vercel.app/",
    highlighted: true,
    ctaStyle:
      "bg-teal text-white hover:bg-teal/90 transition-colors text-base py-3",
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    features: [
      "Unlimited products",
      "Unlimited reviews",
      "API access",
      "Custom skills",
      "Priority support",
    ],
    cta: "Contact Sales",
    href: "https://review-lens-ai-five.vercel.app/",
    ctaStyle:
      "bg-navy text-white hover:bg-navy/90 transition-colors",
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

export default function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-[family-name:var(--font-heading)] text-navy text-center text-3xl font-bold lg:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-center text-gray-600">
          Start free. Upgrade when you&apos;re ready.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className={`relative flex flex-col rounded-2xl bg-white p-8 ${
                tier.highlighted
                  ? "border-2 border-teal"
                  : "border border-gray-100"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h3 className="font-[family-name:var(--font-heading)] text-navy text-lg font-semibold">
                {tier.name}
              </h3>

              <div className="mt-4 flex items-baseline">
                <span className="text-navy text-4xl font-bold">
                  {tier.price}
                </span>
                <span className="ml-1 text-sm text-gray-500">
                  {tier.period}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={`mt-8 block w-full rounded-lg px-6 py-2.5 text-center text-sm font-semibold ${tier.ctaStyle}`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
