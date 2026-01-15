// Import Lighthouse SDK - using static import to avoid Next.js chunk loading issues
// We'll only use it in client-side functions

// Define Lighthouse SDK type
interface LighthouseSDK {
  uploadText: (
    content: string,
    apiKey: string,
    filename: string
  ) => Promise<unknown>;
}

let lighthouseSDK: LighthouseSDK | null = null;

// Lazy load Lighthouse SDK only when needed (client-side)
async function getLighthouseSDK() {
  if (typeof window === "undefined") {
    // Server-side, return null
    return null;
  }

  if (!lighthouseSDK) {
    try {
      lighthouseSDK = (await import("@lighthouse-web3/sdk")) as LighthouseSDK;
    } catch (error) {
      console.error("Failed to load Lighthouse SDK:", error);
      return null;
    }
  }

  return lighthouseSDK;
}

export interface IPFSResult {
  cid: string; // IPFS Content Identifier
  size: number;
}

// IPFS Gateway configuration
// Using public IPFS gateways - you can also use your own gateway
const IPFS_GATEWAYS = [
  "https://gateway.lighthouse.storage/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

// Lighthouse API key
// Get your free API key from https://lighthouse.storage (no credit card required)
const LIGHTHOUSE_API_KEY = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || "";

/**
 * Upload content to IPFS using Lighthouse or direct IPFS HTTP API
 * @param content - The content to store (encrypted string)
 * @param filename - Optional filename
 * @returns Promise with IPFS CID
 */
export async function uploadToIPFS(
  content: string,
  filename?: string
): Promise<IPFSResult> {
  try {
    console.log("Uploading content to IPFS...", {
      contentLength: content.length,
    });

    // If Lighthouse API key is available, use it
    if (LIGHTHOUSE_API_KEY) {
      return await uploadViaLighthouse(content, filename);
    }

    // Otherwise, use a public IPFS HTTP API endpoint
    return await uploadViaIPFSHTTP(content, filename);
  } catch (error) {
    console.error("IPFS upload failed:", error);
    throw new Error(
      `Failed to upload to IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Upload to IPFS using Lighthouse SDK
 * Using lazy-loaded SDK to avoid Next.js chunk loading issues
 */
async function uploadViaLighthouse(
  content: string,
  filename?: string
): Promise<IPFSResult> {
  try {
    // Get Lighthouse SDK (only loads on client-side)
    const lighthouse = await getLighthouseSDK();

    if (!lighthouse) {
      throw new Error(
        "Lighthouse SDK not available (server-side or failed to load)"
      );
    }

    // Use uploadText for text content (more efficient than file upload)
    // Signature: uploadText(text, apiKey, fileName?)
    const response = await lighthouse.uploadText(
      content,
      LIGHTHOUSE_API_KEY,
      filename || `doc-${Date.now()}.txt`
    );

    // Lighthouse returns the CID in different possible formats
    // Handle various response structures
    type LighthouseResponse = {
      data?: { Hash?: string; cid?: string };
      Hash?: string;
      cid?: string;
    };
    const res = response as LighthouseResponse;
    const cid = res?.data?.Hash || res?.Hash || res?.cid || res?.data?.cid;

    if (!cid) {
      console.error("Lighthouse response:", response);
      throw new Error(
        "No CID returned from Lighthouse. Response: " + JSON.stringify(response)
      );
    }

    console.log("Content uploaded to IPFS via Lighthouse:", cid);

    return {
      cid,
      size: content.length,
    };
  } catch (error) {
    console.error("Lighthouse upload error:", error);
    throw error;
  }
}

/**
 * Upload to IPFS using HTTP API (public endpoint)
 * This uses a public IPFS HTTP API endpoint via a CORS proxy or direct API
 */
async function uploadViaIPFSHTTP(
  content: string,
  filename?: string
): Promise<IPFSResult> {
  // Create a FormData with the content
  const formData = new FormData();
  const blob = new Blob([content], { type: "text/plain" });
  formData.append("file", blob, filename || `doc-${Date.now()}.txt`);

  // Try Pinata first (better browser support)
  const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

  if (pinataApiKey && pinataSecretKey) {
    try {
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        const cid = result.IpfsHash;
        if (cid) {
          console.log("Content uploaded to IPFS via Pinata:", cid);
          return {
            cid,
            size: content.length,
          };
        }
      }
    } catch (error) {
      console.warn("Pinata upload failed:", error);
    }
  }

  // Fallback: Try public IPFS HTTP API endpoints
  // Note: These may have CORS issues, so we use a CORS proxy if needed
  const endpoints = [
    "https://ipfs.infura.io:5003/api/v0/add",
    "https://ipfs.io/api/v0/add",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        // Note: Some endpoints may not support CORS
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const cid = result.Hash || result.cid || result.IpfsHash;

      if (!cid) {
        throw new Error("No CID returned from IPFS");
      }

      console.log("Content uploaded to IPFS via HTTP API:", cid);

      return {
        cid,
        size: content.length,
      };
    } catch (error) {
      console.warn(`Failed to upload via ${endpoint}:`, error);
      // Try next endpoint
      continue;
    }
  }

  throw new Error(
    "All IPFS upload endpoints failed. Please configure Lighthouse API key (get free key at https://lighthouse.storage) or Pinata API keys."
  );
}

/**
 * Retrieve content from IPFS using CID
 * @param cid - IPFS Content Identifier
 * @returns Promise with the content as string
 */
export async function getFromIPFS(cid: string): Promise<string> {
  try {
    console.log("Retrieving content from IPFS:", cid);

    // Try multiple gateways for reliability
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const url = `${gateway}${cid}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "text/plain, application/json, */*",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const content = await response.text();
        console.log("Content retrieved successfully from IPFS:", {
          cid,
          gateway,
          contentLength: content.length,
        });

        return content;
      } catch (error) {
        console.warn(`Failed to fetch from ${gateway}:`, error);
        // Try next gateway
        continue;
      }
    }

    throw new Error("Failed to retrieve content from all IPFS gateways");
  } catch (error) {
    console.error("IPFS retrieval failed:", error);
    throw new Error(
      `Failed to retrieve content from IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid - IPFS Content Identifier
 * @returns IPFS gateway URL string
 */
export function getIPFSGatewayUrl(cid: string): string {
  // Use the first gateway as default
  return `${IPFS_GATEWAYS[0]}${cid}`;
}
