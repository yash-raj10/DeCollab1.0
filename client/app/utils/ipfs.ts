import { createClient } from "@supabase/supabase-js";

export interface IPFSResult {
  cid: string; // This will be the document ID from Supabase
  size: number;
}

// Supabase configuration
const supabaseUrl = "https://davfropycuzfqfwlpfzu.supabase.co"; // Replace with your Supabase URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdmZyb3B5Y3V6ZnFmd2xwZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTg0MTEsImV4cCI6MjA3NDU3NDQxMX0.MO-i_zMnrlJBqwJ8Gw8Ei8lgLCazz0Ew_PENSZ25WwY"; // Replace with your Supabase anon key

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * "Upload" content to Supabase (fake IPFS)
 * @param content - The HTML content to store
 * @param filename - Optional filename (not used, just for compatibility)
 * @returns Promise with document ID as "CID"
 */
export async function uploadToIPFS(
  content: string,
  filename?: string
): Promise<IPFSResult> {
  try {
    console.log("Storing content in Supabase...", {
      contentLength: content.length,
    });

    // Insert content into Supabase
    const { data, error } = await supabase
      .from("documents")
      .insert({
        content: content,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`${error.message}`);
    }

    const documentId = data.id.toString();
    console.log("Content stored successfully with ID:", documentId);

    return {
      cid: documentId, // Using document ID as "CID"
      size: content.length,
    };
  } catch (error) {
    console.error("Supabase storage failed:", error);
    throw new Error(
      `Failed to store content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Retrieve content from Supabase using document ID
 * @param documentId - The document ID (stored as "CID")
 * @returns Promise with the content as string
 */
export async function getFromIPFS(documentId: string): Promise<string> {
  try {
    console.log("Retrieving content from Supabase:", documentId);

    const { data, error } = await supabase
      .from("documents")
      .select("content")
      .eq("id", documentId)
      .single();

    if (error) {
      throw new Error(` ${error.message}`);
    }

    if (!data) {
      throw new Error("Document not found");
    }

    console.log("Content retrieved successfully:", {
      documentId,
      contentLength: data.content.length,
    });

    return data.content;
  } catch (error) {
    console.error("Supabase retrieval failed:", error);
    throw new Error(
      `Failed to retrieve content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get document URL (not needed for Supabase, but keeping for compatibility)
 * @param documentId
 * @returns Mock URL string
 */
export function getIPFSGatewayUrl(documentId: string): string {
  return `supabase://documents/${documentId}`;
}
