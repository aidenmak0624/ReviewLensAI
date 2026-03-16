import { Pinecone } from "https://esm.sh/@pinecone-database/pinecone@2.2.1";

const pinecone = new Pinecone({
  apiKey: Deno.env.get("PINECONE_API_KEY") || "",
});

const indexName = Deno.env.get("PINECONE_INDEX") || "reviewlens";
export const pineconeIndex = pinecone.index(indexName);

export default pinecone;
