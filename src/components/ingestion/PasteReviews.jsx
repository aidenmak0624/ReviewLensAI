import { useState } from "react";

export default function PasteReviews({ onParsed }) {
  const [text, setText] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    onParsed(value.trim() || null);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        Paste Review Text
      </label>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder={`Paste reviews here. Any format works — the AI will extract structured data.\n\nExample:\nJohn D. - 5 stars - March 1, 2026\n"Great product, love the interface!"\n\nJane S. - 3 stars - Feb 28, 2026\n"Decent but could use better documentation."`}
        rows={10}
        className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
      />
      <div className="flex justify-end mt-1">
        <span className="text-xs text-muted-foreground">
          {text.length.toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
