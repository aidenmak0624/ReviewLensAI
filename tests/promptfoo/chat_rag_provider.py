"""
promptfoo Python provider for the chat-rag SSE Edge Function.

Called by promptfoo with:
  call_api(prompt, options, context) -> dict

Collects the full SSE stream into a single response string for assertion
evaluation. Also extracts the citations_ready event payload.

Env vars required:
  VITE_SUPABASE_URL       — e.g. https://xyz.supabase.co
  VITE_SUPABASE_ANON_KEY  — Supabase anon/public key
  PROMPTFOO_PRODUCT_ID    — default product UUID (can be overridden per test)
"""

import json
import os
import urllib.request

def call_api(prompt, options, context):
    supabase_url = os.environ.get("VITE_SUPABASE_URL", "")
    anon_key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

    if not supabase_url or not anon_key:
        return {
            "error": "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars"
        }

    # Resolve product_id and skill from test variables or env
    variables = options.get("vars", {}) if options else {}
    product_id = variables.get("product_id", os.environ.get("PROMPTFOO_PRODUCT_ID", ""))
    skill = variables.get("skill", "general")

    if not product_id:
        return {"error": "No product_id provided. Set PROMPTFOO_PRODUCT_ID or pass via vars."}

    url = f"{supabase_url}/functions/v1/chat-rag"

    body = json.dumps({
        "question": prompt,
        "product_id": product_id,
        "skill": skill,
        "history": [],
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {anon_key}",
            "apikey": anon_key,
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
    except Exception as e:
        return {"error": f"HTTP request failed: {e}"}

    # Parse SSE stream: collect tokens and citations
    tokens = []
    citations = []

    for line in raw.split("\n"):
        line = line.strip()

        # citations_ready is sent as a named SSE event
        if line.startswith("data:") and "citations_ready" not in line:
            payload = line[len("data:"):].strip()
            if payload == "[DONE]":
                continue
            try:
                data = json.loads(payload)
                if "token" in data:
                    tokens.append(data["token"])
                elif "error" in data:
                    return {"error": data["error"]}
            except json.JSONDecodeError:
                continue

        # Handle the citations_ready event payload
        if line.startswith("data:") and len(tokens) > 0:
            # Check if previous line was "event: citations_ready"
            pass

    # Second pass: extract citations_ready event
    lines = raw.split("\n")
    for i, line in enumerate(lines):
        if line.strip() == "event: citations_ready":
            # Next line should be the data payload
            if i + 1 < len(lines):
                data_line = lines[i + 1].strip()
                if data_line.startswith("data:"):
                    try:
                        citations = json.loads(data_line[len("data:"):].strip())
                    except json.JSONDecodeError:
                        pass

    full_response = "".join(tokens)

    return {
        "output": full_response,
        "metadata": {
            "citations": citations,
            "citation_count": len(citations),
            "word_count": len(full_response.split()),
        },
    }
