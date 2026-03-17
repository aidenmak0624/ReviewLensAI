import { Bot, User } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Splits content string on [Review N] patterns, returning an array of
 * plain-text strings and citation badge elements.
 * When citations data is available, badges become clickable buttons.
 */
function renderContentWithCitations(content, citations, onCitationClick) {
  const parts = content.split(/(\[Review \d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[Review (\d+)\]$/);
    if (match) {
      const reviewNum = parseInt(match[1], 10);
      const citation = citations?.[reviewNum];
      return (
        <button
          key={i}
          onClick={() => citation && onCitationClick?.(citation)}
          className={cn(
            "inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mx-0.5 align-baseline",
            citation
              ? "cursor-pointer hover:bg-blue-200 hover:scale-105 transition-all"
              : "cursor-default"
          )}
          type="button"
        >
          {part}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Three-dot typing indicator with staggered bounce animation. */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * MessageBubble — renders a single chat message.
 *
 * @param {{ message: { role: "user"|"assistant", content: string }, isStreaming: boolean, citations: object, onCitationClick: function }} props
 */
export default function MessageBubble({
  message,
  isStreaming = false,
  citations = {},
  onCitationClick,
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-600">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
          isUser
            ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
            : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-sm"
        )}
      >
        {isStreaming && !message.content ? (
          <TypingIndicator />
        ) : isUser ? (
          message.content
        ) : (
          renderContentWithCitations(message.content, citations, onCitationClick)
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
