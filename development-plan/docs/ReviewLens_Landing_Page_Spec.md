
# Purpose & Scope
This document specifies the complete content, layout, design system, and component architecture for the ReviewLens AI public-facing marketing site. It is the direct input for the frontend developer building the landing page after Progress_2 is complete.
The landing page is a separate Next.js 14 deployment (not embedded in the main app). Its sole commercial goal: convert a first-time visitor into a free trial signup within 60 seconds.




# Design System
## Typography

## Color Palette

## Motion Principles
- Framework: Framer Motion (React). CSS-only for simple hover states.
- Scroll reveal: staggered fade-up on section entry (delay 0ms, 100ms, 200ms per child).
- Hero demo animation: looping 8-second sequence — user types question → AI streams response → citation badge appears → evidence drawer slides open.
- Transition duration: 200–300ms for all interactive elements. Nothing faster (jarring) or slower (sluggish).
- No autoplay video. Animation must respect prefers-reduced-motion.



# Page Architecture — Section by Section
## Section 1 — Navigation
Sticky top nav. Transparent on hero, white with border-bottom on scroll.

## Section 2 — Hero
Full-viewport-height. Dark navy background. Left-aligned text, right-side animated demo.

## Section 3 — Pain Point / Transformation
White background. Two-column split.

## Section 4 — How It Works
Gray-50 background. 3-step horizontal flow with connector line.

## Section 5 — Feature Grid
White background. 2×3 grid of feature cards.

## Section 6 — Pricing
Gray-50 background. 4-column pricing table. Pro tier highlighted with teal border.

Pro is marked with ★ 'Most Popular' badge. Primary CTA below each tier: 'Start Free Trial' (Free/Starter/Pro) or 'Contact Sales' (Enterprise).

## Section 7 — Social Proof / Testimonials
3 testimonial cards. Placeholder copy until real user testimonials are collected.

## Section 8 — Footer CTA
Dark navy background. Center-aligned.



# Technical Implementation Notes
## Stack
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Animation: Framer Motion
- Fonts: Google Fonts (Instrument Serif + DM Sans) — self-hosted via next/font
- Analytics: Vercel Analytics + PostHog for conversion tracking
- Forms: React Hook Form + Zod for the email capture / signup flow

## Component File Map

## SEO Requirements
- Title tag: 'ReviewLens AI — Turn Customer Reviews into Verifiable Product Insights'
- Meta description: 'Upload review CSVs, PDFs, and screenshots. AI extracts sentiment and provides clickable citations back to every source review.'
- OG image: 1200×630px — hero layout with the UI demo screenshot
- Structured data: SoftwareApplication schema (Google rich results)
- Core Web Vitals target: LCP < 2.5s, CLS < 0.1, INP < 200ms — achieve via next/image, self-hosted fonts, no layout shift

| REVIEWLENS AI
SaaS Landing Page Specification
Copy • Layout • Design System • Component Map
Version 1.0  |  March 2026  |  Aiden (Chin Wei Mak) |
| --- |

| Deployment Target
Separate Next.js 14 repo or /apps/landing monorepo directory. Deploy to Vercel. Target domain: reviewlens.ai (main app moves to app.reviewlens.ai). |
| --- |

| Role | Font Family | Notes |
| --- | --- | --- |
| Display / Hero H1 | Instrument Serif | Google Fonts. Editorial precision without Space Grotesk cliché. |
| Headings H2–H3 | DM Sans (600) | Geometric sans — distinct from Inter/Roboto. |
| Body / UI | DM Sans (400) | 16px base, 1.7 line-height. |
| Monospace / Code | JetBrains Mono | For any technical snippets in feature sections. |

| Name | Hex | Usage |
| --- | --- | --- |
| Navy (bg) | #0F1929 | Hero background, footer, dark sections. |
| Teal (primary) | #0F7B6C | CTA buttons, active states, accent borders. |
| Mint (highlight) | #9FE1CB | Subheadlines on dark bg, icon fills. |
| White | #FFFFFF | Content section backgrounds. |
| Gray-50 | #F9FAFB | Alternating section backgrounds. |
| Gray-600 | #4B5563 | Body text on white bg. |
| Danger Red | #EF4444 | Error states only. |

| Element | Spec |
| --- | --- |
| Logo | ReviewLens AI wordmark (teal on dark, teal on white) |
| Nav links | Features  |  How It Works  |  Pricing  |  Blog (placeholder) |
| CTA button | 'Start Free Trial' — teal bg, white text, border-radius 8px |
| Mobile | Hamburger menu → full-screen overlay drawer |

| Element | Copy / Spec |
| --- | --- |
| Eyebrow | AI-Powered Multimodal Review Analytics |
| H1 Headline | Turn Thousands of Unstructured Reviews into Verifiable Product Decisions in Seconds |
| Subheadline | Upload Amazon CSVs, UI screenshots, or research PDFs. Our RAG engine extracts sentiment, identifies bugs, and shows clickable visual proof for every AI-generated claim. |
| Primary CTA | 'Start 14-Day Free Trial' — large teal button. No credit card required. |
| Secondary CTA | 'Watch 90-Second Demo' — ghost button with play icon |
| Social proof | Greyscale logos of: Amazon, G2, Yelp, Shopify, Capterra — 'Works with reviews from' |
| Right side | Animated UI demo (Framer Motion). Shows: chat input → streaming response → [Review 3] badge → drawer slides open |

| Column | Content |
| --- | --- |
| Left — Before (red tint card) | Icon: spreadsheet. Headline: 'The old way'. Body: You're manually reading 500 reviews, copy-pasting into a spreadsheet, and still can't prove which features to build next. |
| Right — After (teal tint card) | Icon: AI chat bubble. Headline: 'With ReviewLens'. Body: 30 seconds from upload to insight. Every claim backed by the exact source review. Click to verify. |

| Step | Title | Description + Visual |
| --- | --- | --- |
| 1 | Upload your reviews | Drag in a CSV, paste raw text, drop a PDF, or upload a screenshot. Any format, any platform. |
| 2 | AI analyzes instantly | Our RAG engine extracts sentiment, themes, bugs, and feature requests — grounded strictly in your data. |
| 3 | Click to verify | Every AI claim links to the exact source review. Click any citation badge to see the original text highlighted. |

| Feature Card | Body Copy |
| --- | --- |
| Multimodal Ingestion | CSV, paste, URL scraping, PDF, and image uploads. AI auto-maps any column format. |
| Verifiable Citations | Every AI claim links to the source review. Click to open the original document with the cited text highlighted. |
| AI Insight Reports | One click generates a full strategic document: themes, FAQs, and prioritized action items — all cited. |
| AI Skill Selector | Switch between analytical lenses: Feature Extraction, UI Bug Detection, Competitor SWOT, and more. |
| Competitor Benchmarking | Paste a competitor's review page URL. Instantly compare sentiment, themes, and customer pain points. |
| Guardrailed Answers | The AI only answers questions about your ingested data. No hallucinations. No off-topic drift. |

| Tier | Price | Key Features | Best For |
| --- | --- | --- | --- |
| Free | $0/mo | 3 products, 100 reviews/mo, text-only, chat | Evaluation / students |
| Starter | $19/mo | 10 products, 1,000 reviews/mo, CSV + paste, skill selector | Freelancers / small brands |
| Pro ★ | $49/mo | 50 products, 10,000 reviews/mo, all modalities, 5 Insight Reports/mo | Product managers / agencies |
| Enterprise | $199/mo | Unlimited, API access, custom skills, priority support | ORM agencies / SaaS companies |

| Attribute | Card 1 (Placeholder) |
| --- | --- |
| Quote | We went from 3 hours of manual review reading to 5 minutes of AI-generated insight. The citation drawer is the killer feature — my team finally trusts the AI's claims. |
| Name / Role | Sarah K., Head of Product, B2B SaaS (placeholder) |
| Rating | ★★★★★ |

| Element | Copy |
| --- | --- |
| Headline | Start analyzing your first product free |
| Subhead | No credit card required. Up and running in 60 seconds. |
| CTA button | 'Create Free Account' — large white button, teal text |
| Secondary links | Privacy Policy  •  Terms of Service  •  docs.reviewlens.ai |

| File | Purpose |
| --- | --- |
| app/page.tsx | Landing page root — assembles all sections |
| components/landing/Hero.tsx | Hero section with Framer Motion demo animation |
| components/landing/HowItWorks.tsx | 3-step flow with SVG connector |
| components/landing/FeatureGrid.tsx | 2×3 feature card grid |
| components/landing/Pricing.tsx | 4-column pricing table with Pro highlight |
| components/landing/Testimonials.tsx | 3-card testimonial carousel |
| components/landing/DemoAnimation.tsx | Looping Framer Motion chat sequence |
| components/landing/Nav.tsx | Sticky nav with scroll state |
| components/landing/FooterCTA.tsx | Final conversion section |