"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const USER_QUERY = "What are the main pricing complaints?";
const AI_RESPONSE =
  'Based on 200 reviews, the top pricing complaints are:\n1. Hidden fees after trial [Review 3]\n2. Price increase without notice [Review 7]';
const EVIDENCE_TEXT =
  "Carmen D. ★★★ — The recent price increase without any corresponding feature improvements...";

const CYCLE_DURATION = 8000;

function CitationBadge({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 font-mono text-xs transition-colors ${
        highlight
          ? "bg-teal/50 text-mint animate-pulse"
          : "bg-teal/30 text-teal"
      }`}
    >
      {children}
    </span>
  );
}

export default function DemoAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [typedUser, setTypedUser] = useState("");
  const [typedAI, setTypedAI] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [highlightBadge, setHighlightBadge] = useState(false);

  // ---------- Static fallback for reduced motion ----------
  if (prefersReducedMotion) {
    return (
      <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-navy/95 p-4 shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="ml-auto max-w-[75%] rounded-lg bg-teal/20 px-3 py-2 text-sm text-white/90">
            {USER_QUERY}
          </div>
          <div className="mr-auto max-w-[85%] whitespace-pre-wrap rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80">
            Based on 200 reviews, the top pricing complaints are:{"\n"}1.
            Hidden fees after trial <CitationBadge>Review 3</CitationBadge>
            {"\n"}2. Price increase without notice{" "}
            <CitationBadge>Review 7</CitationBadge>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 left-4 rounded-lg border border-white/10 bg-white/10 p-3 backdrop-blur">
          <p className="text-xs text-white/60">{EVIDENCE_TEXT}</p>
        </div>
      </div>
    );
  }

  // ---------- Animation loop ----------
  useEffect(() => {
    let cancelled = false;

    async function runLoop() {
      while (!cancelled) {
        // Phase 0 -> 1: typewriter user query
        setPhase(0);
        setTypedUser("");
        setTypedAI("");
        setShowDrawer(false);
        setHighlightBadge(false);

        for (let i = 0; i <= USER_QUERY.length; i++) {
          if (cancelled) return;
          setTypedUser(USER_QUERY.slice(0, i));
          await sleep(2000 / USER_QUERY.length);
        }

        // Phase 1: stream AI response token by token
        setPhase(1);
        const tokens = AI_RESPONSE.split(" ");
        for (let i = 0; i <= tokens.length; i++) {
          if (cancelled) return;
          setTypedAI(tokens.slice(0, i).join(" "));
          await sleep(3000 / tokens.length);
        }

        // Phase 2: highlight badge + drawer
        setPhase(2);
        setHighlightBadge(true);
        await sleep(500);
        if (cancelled) return;
        setShowDrawer(true);

        // Phase 3: hold then fade
        await sleep(1500);
        if (cancelled) return;
        setPhase(3);
        await sleep(1000);
      }
    }

    runLoop();
    return () => {
      cancelled = true;
    };
  }, []);

  // Render AI text with citation badges
  function renderAIText(text: string) {
    const parts = text.split(/(\[Review \d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[Review (\d+)\]/);
      if (match) {
        return (
          <CitationBadge
            key={i}
            highlight={highlightBadge && match[1] === "3"}
          >
            Review {match[1]}
          </CitationBadge>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <motion.div
      className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-navy/95 p-4 shadow-2xl"
      animate={{ opacity: phase === 3 ? 0 : 1 }}
      transition={{ duration: phase === 3 ? 0.8 : 0.3 }}
    >
      {/* Mock top bar */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        <span className="ml-2 font-mono text-[10px] text-white/30">
          ReviewLens AI
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* User message */}
        <AnimatePresence>
          {typedUser.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-auto max-w-[75%] rounded-lg bg-teal/20 px-3 py-2 text-sm text-white/90"
            >
              {typedUser}
              {phase === 0 && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/60" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI response */}
        <AnimatePresence>
          {typedAI.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mr-auto max-w-[85%] whitespace-pre-wrap rounded-lg bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/80"
            >
              {renderAIText(typedAI)}
              {phase === 1 && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/60" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini evidence drawer */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-4 bottom-4 left-4 rounded-lg border border-white/10 bg-white/10 p-3 backdrop-blur"
          >
            <div className="mb-1 flex items-center gap-2">
              <CitationBadge highlight>Review 3</CitationBadge>
              <span className="text-[10px] text-white/40">Source</span>
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              {EVIDENCE_TEXT}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
