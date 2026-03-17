import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import SkillSelector from "./SkillSelector";
import { Send, Loader2, Trash2 } from "lucide-react";

/** Build a localStorage key for this product + skill combo */
function storageKey(productId, skill) {
  return `reviewlens_chat_${productId}_${skill}`;
}

/** Load persisted chat from localStorage */
function loadChat(productId, skill) {
  try {
    const raw = localStorage.getItem(storageKey(productId, skill));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        messages: parsed.messages || [],
        citations: parsed.citations || {},
      };
    }
  } catch {
    // ignore corrupt data
  }
  return { messages: [], citations: {} };
}

/** Save chat to localStorage */
function saveChat(productId, skill, messages, citations) {
  try {
    // Only save completed messages (skip empty assistant placeholders)
    const toSave = messages.filter((m) => m.content);
    localStorage.setItem(
      storageKey(productId, skill),
      JSON.stringify({ messages: toSave, citations })
    );
  } catch {
    // ignore quota errors
  }
}

export default function ChatInterface({ product, onCitationClick }) {
  const [selectedSkill, setSelectedSkill] = useState("general");

  // Load persisted chat on mount and skill change
  const initial = loadChat(product.id, "general");
  const [messages, setMessages] = useState(initial.messages);
  const [citations, setCitations] = useState(initial.citations);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  // Persist chat whenever messages or citations change (debounced via effect)
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      saveChat(product.id, selectedSkill, messages, citations);
    }
  }, [messages, citations, isStreaming, product.id, selectedSkill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSkillChange = useCallback(
    (skill) => {
      // Save current chat before switching
      if (messages.length > 0) {
        saveChat(product.id, selectedSkill, messages, citations);
      }
      setSelectedSkill(skill);
      // Load chat for the new skill
      const saved = loadChat(product.id, skill);
      setMessages(saved.messages);
      setCitations(saved.citations);
    },
    [product.id, selectedSkill, messages, citations]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setCitations({});
    try {
      localStorage.removeItem(storageKey(product.id, selectedSkill));
    } catch {
      // ignore
    }
  }, [product.id, selectedSkill]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMessage = { role: "user", content: question };
    const assistantMessage = { role: "assistant", content: "" };
    const updatedHistory = [...messages, userMessage];

    setMessages([...updatedHistory, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/chat-rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          question,
          product_id: product.id,
          history: updatedHistory,
          skill: selectedSkill,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = null;

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed) {
            currentEvent = null; // Reset on empty line (SSE event boundary)
            continue;
          }

          // Detect SSE event type
          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7);
            continue;
          }

          if (!trimmed.startsWith("data: ")) continue;

          const payload = trimmed.slice(6);

          // Handle citations_ready event
          if (currentEvent === "citations_ready") {
            try {
              const citationsArray = JSON.parse(payload);
              const citationsMap = {};
              citationsArray.forEach((c) => {
                citationsMap[c.reviewNumber] = c;
              });
              setCitations((prev) => ({ ...prev, ...citationsMap }));
            } catch {
              // skip malformed citations
            }
            currentEvent = null;
            continue;
          }

          if (payload === "[DONE]") {
            setIsStreaming(false);
            return;
          }

          try {
            const { token } = JSON.parse(payload);
            if (token) {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  content: last.content + token,
                };
                return next;
              });
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm space-y-2">
            <p>Ask me anything about {product.name}&apos;s reviews!</p>
            <p className="text-xs text-gray-300">
              Try: &quot;Summarize the reviews&quot; &middot; &quot;What are the
              main complaints?&quot; &middot; &quot;What do users love?&quot;
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            isStreaming={
              isStreaming &&
              idx === messages.length - 1 &&
              msg.role === "assistant"
            }
            citations={citations}
            onCitationClick={onCitationClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Skill selector + Input area */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        <SkillSelector
          selectedSkill={selectedSkill}
          onSkillChange={handleSkillChange}
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about reviews..."
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {messages.length > 0 && !isStreaming && (
            <button
              onClick={handleClearChat}
              title="Clear chat"
              className="flex items-center justify-center rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="flex items-center justify-center rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
