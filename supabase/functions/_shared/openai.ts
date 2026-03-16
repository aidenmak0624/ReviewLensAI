import OpenAI from "https://esm.sh/openai@4.52.0";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

export default openai;
