"""
promptfoo Python provider for the generate-insight Edge Function.

Called by promptfoo with:
  call_api(prompt, options, context) -> dict

The prompt is ignored for this provider — the only input is the product_id.
Returns the full JSON response for assertion evaluation.

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

    variables = options.get("vars", {}) if options else {}
    product_id = variables.get("product_id", os.environ.get("PROMPTFOO_PRODUCT_ID", ""))

    if not product_id:
        return {"error": "No product_id provided. Set PROMPTFOO_PRODUCT_ID or pass via vars."}

    url = f"{supabase_url}/functions/v1/generate-insight"

    body = json.dumps({"product_id": product_id}).encode("utf-8")

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
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except Exception as e:
        return {"error": f"HTTP request failed: {e}"}

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"error": f"Invalid JSON response: {raw[:500]}"}

    if "error" in data:
        return {"error": data["error"]}

    # Return the JSON as a string so promptfoo assertions can inspect it
    return {
        "output": raw,
        "metadata": {
            "theme_count": len(data.get("themes", [])),
            "faq_count": len(data.get("faqs", [])),
            "action_count": len(data.get("actions", [])),
        },
    }
