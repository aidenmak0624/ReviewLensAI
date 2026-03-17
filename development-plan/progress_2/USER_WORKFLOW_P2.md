# Progress 2 — User Workflows

> Step-by-step workflows for all P2 features added to ReviewLens AI.

---

## Workflow 1: Image Ingestion

Upload a screenshot or photo of customer reviews and extract structured data.

1. Navigate to **+ New Product** page
2. Enter product name and select platform
3. Click the **Image** tab (4th tab)
4. Drag and drop an image file (PNG, JPG, JPEG, or WebP, max 20MB) onto the drop zone — or click to browse
5. A thumbnail preview appears with filename and file size
6. Click **"Extract & Preview Reviews"**
7. GPT-4o Vision analyzes the image and extracts all visible reviews
8. Review the extracted data in the preview table — remove any incorrect rows
9. Click **"Confirm & Ingest N Reviews"** to save to database and embed in Pinecone
10. Redirected to the product page with all reviews indexed and ready for chat

---

## Workflow 2: Chat with Skill Selector

Use specialized AI analytical lenses to focus chat responses on specific aspects.

1. Navigate to a product page and click the **Chat** tab
2. The skill selector shows 7 pills above the input bar:
   - **General** (default) — open-ended analysis
   - **Features** — extract requested/praised features
   - **UI Bugs** — surface interface friction and broken flows
   - **Sentiment** — classify reviewer tone (Aggressive to Evangelist)
   - **SWOT** — build SWOT matrix from competitor mentions
   - **Pricing** — isolate cost, value, and refund mentions
   - **Executive** — top 3 insights in plain language (max 200 words)
3. Click a skill pill to activate it (teal highlight)
4. Switching skills saves the current conversation and loads the saved history for the new skill
5. Type a question and press Enter — the AI response is shaped by the active skill's directive
6. Each skill maintains its own independent conversation history

---

## Workflow 3: Citation Click to Evidence Drawer

Click a citation badge in chat or a row in the Reviews table to see the full source review.

### From Chat:
1. Send a query in the Chat tab
2. The AI response includes inline citation badges like [Review 1], [Review 3]
3. Hover over a badge — cursor changes to pointer with scale animation
4. Click the badge — the Evidence Drawer slides in from the right
5. The drawer shows:
   - Reviewer name and review date
   - Visual star rating (filled/empty stars)
   - Verified purchase badge (green checkmark, if applicable)
   - Source badge (CSV / Paste / URL / Image)
   - Helpful count (N people found this helpful)
   - Full review text with no truncation
6. Close the drawer via: X button, backdrop click, or Escape key

### From Reviews Table:
1. Click the **Reviews** tab on the product page
2. Click any row in the reviews table (cursor-pointer on hover)
3. The same Evidence Drawer opens with the full review detail

---

## Workflow 4: AI Insight Report

Generate a structured executive strategy document from all ingested reviews.

1. Navigate to a product page and click the **Insight** tab
2. If no report has been generated yet, a centered empty state shows:
   - Sparkles icon + "AI Insight Report" title
   - "Generate AI Insight Report" button (enabled when product status is "ready")
3. Click the button — a 3-step loading animation plays:
   - Step 1: "Gathering evidence from reviews..."
   - Step 2: "Analysing themes..."
   - Step 3: "Building action plan..."
4. The report renders 3 collapsible sections:

   **Section 1 — Evidence & Themes**
   - Up to 6 MECE themes extracted from reviews
   - Each theme has a bold title + summary paragraph
   - Teal left border accent

   **Section 2 — FAQ & Friction Points**
   - Up to 8 common user questions and friction points
   - Numbered Q&A list with bold questions and gray answers

   **Section 3 — Action Items**
   - Up to 10 prioritized product action items
   - Priority badges: HIGH (red), MED (amber), LOW (gray)
   - Each action has a rationale explanation

5. Export options at the bottom:
   - **Copy Action Items** — copies a formatted checklist to clipboard
   - **Download PDF** — generates and downloads a formatted PDF via jsPDF

---

## Workflow 5: Large CSV Ingestion

Upload a CSV file with 200+ reviews for instant processing.

1. Navigate to **+ New Product** page
2. Enter product name and select platform
3. On the **CSV Upload** tab (default), drag and drop a CSV file
4. The system detects standard column headers automatically:
   - Supported columns: reviewer_name, rating, review_text, review_date, verified, helpful_count
   - Also recognizes aliases: name/author, stars/score, comment/feedback, etc.
5. Click **"Extract & Preview Reviews"**
6. Direct column mapping processes the CSV instantly — no LLM API call needed
7. For non-standard column names, the system falls back to GPT-4o extraction in 50-row batches
8. Review the extracted data in the preview table (paginated for large datasets)
9. Click **"Confirm & Ingest N Reviews"** to save all reviews and embed in Pinecone
10. Redirected to product page — all reviews visible in the Reviews tab

---

## Workflow 6: Chat Persistence

Chat conversations are preserved across tab switches and page navigation.

1. Navigate to a product page and open the **Chat** tab
2. Send one or more messages — the AI responds with streaming text and citations
3. Switch to the **Summary** or **Reviews** tab
4. Switch back to the **Chat** tab — all messages and citations are still displayed
5. Conversations are saved per product + skill combination:
   - Switching from General to Sentiment saves the General conversation
   - The Sentiment skill loads its own saved history (or empty state if new)
   - Switching back to General restores the General conversation
6. To clear a conversation, click the **trash icon** next to the send button
7. Conversations persist across page refreshes (stored in localStorage)
