/**
 * Encryption utilities for documents and drawings
 * Uses wallet addresses of collaborators to generate encryption keys
 */

import { ethers } from "ethers";

/**
 * Generate encryption key from wallet addresses
 * @param walletAddresses - Array of wallet addresses of all collaborators
 * @returns Encryption key (hex string)
 */
export function generateEncryptionKey(walletAddresses: string[]): string {
  // Sort addresses to ensure consistent key generation
  const sortedAddresses = [...walletAddresses].sort();
  
  // Combine all addresses into a single string
  const combined = sortedAddresses.join("");
  
  // Use keccak256 hash to generate a consistent key
  const hash = ethers.keccak256(ethers.toUtf8Bytes(combined));
  
  // Take first 32 bytes (64 hex characters) for AES-256 key
  return hash.slice(0, 66); // 0x + 64 hex chars
}

/**
 * Derive encryption key from a single wallet address
 * This allows any collaborator to decrypt documents they worked on
 * @param walletAddress - Wallet address of the collaborator
 * @param allAddresses - All wallet addresses that worked on the document
 * @returns Encryption key if address is in the list, null otherwise
 */
export function deriveKeyFromAddress(
  walletAddress: string,
  allAddresses: string[]
): string | null {
  const normalizedAddress = walletAddress.toLowerCase();
  const normalizedAll = allAddresses.map((addr) => addr.toLowerCase());
  
  // Check if this address is in the collaborators list
  if (!normalizedAll.includes(normalizedAddress)) {
    return null;
  }
  
  // Generate the same key using all addresses
  return generateEncryptionKey(allAddresses);
}

/**
 * Encrypt data using AES-GCM
 * @param data - Data to encrypt (string)
 * @param key - Encryption key (hex string)
 * @returns Encrypted data as base64 string
 */
export async function encryptData(data: string, key: string): Promise<string> {
  try {
    // Convert hex key to bytes
    const keyBytes = ethers.getBytes(key);
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    
    // Encrypt
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      encodedData
    );
    
    // Combine IV and encrypted data, then encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-GCM
 * @param encryptedData - Encrypted data as base64 string
 * @param key - Encryption key (hex string)
 * @returns Decrypted data as string
 */
export async function decryptData(
  encryptedData: string,
  key: string
): Promise<string> {
  try {
    // If data is empty or null, return as-is (might be unencrypted)
    if (!encryptedData || encryptedData.trim().length === 0) {
      return encryptedData;
    }

    // Check if data looks like it's already decrypted (starts with HTML or JSON)
    // This handles old documents that weren't encrypted
    if (encryptedData.trim().startsWith("<") || 
        encryptedData.trim().startsWith("{") || 
        encryptedData.trim().startsWith("[")) {
      // Likely already decrypted, return as-is
      return encryptedData;
    }

    // Convert hex key to bytes
    const keyBytes = ethers.getBytes(key);
    
    // Check if the data is already a valid base64 string
    let base64Data = encryptedData;
    
    // Try to decode base64 - if it fails, the data might not be base64 encoded
    try {
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedData)) {
        throw new Error("Invalid base64 format");
      }
      // Test decode
      atob(encryptedData);
    } catch (e) {
      // If it's not base64, it might be plain text (for backward compatibility)
      // or it might be hex encoded
      console.warn("Data is not base64, checking if it's already decrypted");
      
      // Try to convert from hex if it looks like hex
      if (encryptedData.startsWith("0x") || /^[0-9a-fA-F]+$/.test(encryptedData)) {
        // It's hex, convert to base64
        const hexData = encryptedData.startsWith("0x") ? encryptedData.slice(2) : encryptedData;
        const bytes = new Uint8Array(hexData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        base64Data = btoa(String.fromCharCode(...bytes));
      } else {
        // Data might already be decrypted (old format)
        // Return as-is and let the caller handle it
        console.warn("Data doesn't appear to be encrypted, returning as-is");
        return encryptedData;
      }
    }
    
    // Decode base64
    const combined = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    
    // Check if we have enough data (at least 12 bytes for IV)
    if (combined.length < 12) {
      console.warn("Encrypted data too short, might be unencrypted");
      return encryptedData; // Return original data
    }
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // If decryption fails, the data might not be encrypted (old documents)
    // Return the original data and let the caller decide what to do
    console.warn("Decryption failed, data might be unencrypted:", error);
    return encryptedData;
  }
}

/**
 * Store encryption key locally for a document/drawing
 * @param docId - Document or drawing ID
 * @param key - Encryption key
 * @param addresses - List of collaborator addresses
 */
export function storeEncryptionKey(
  docId: string,
  key: string,
  addresses: string[]
): void {
  if (typeof window === "undefined") return;
  
  try {
    const keyData = {
      key,
      addresses,
      timestamp: Date.now(),
    };
    localStorage.setItem(`enc_key_${docId}`, JSON.stringify(keyData));
  } catch (error) {
    console.error("Failed to store encryption key:", error);
  }
}

/**
 * Retrieve encryption key from local storage
 * @param docId - Document or drawing ID
 * @param userAddress - Current user's wallet address
 * @returns Encryption key if user is authorized, null otherwise
 */
export function getEncryptionKey(
  docId: string,
  userAddress: string
): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(`enc_key_${docId}`);
    if (!stored) return null;
    
    const keyData = JSON.parse(stored);
    const normalizedUser = userAddress.toLowerCase();
    const normalizedAddresses = keyData.addresses.map((addr: string) =>
      addr.toLowerCase()
    );
    
    // Check if user is in the collaborators list
    if (!normalizedAddresses.includes(normalizedUser)) {
      return null;
    }
    
    return keyData.key;
  } catch (error) {
    console.error("Failed to retrieve encryption key:", error);
    return null;
  }
}

/**
 * Get all collaborator addresses for a document
 * @param docId - Document or drawing ID
 * @returns Array of wallet addresses
 */
export function getCollaboratorAddresses(docId: string): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(`enc_key_${docId}`);
    if (!stored) return [];
    
    const keyData = JSON.parse(stored);
    return keyData.addresses || [];
  } catch (error) {
    console.error("Failed to get collaborator addresses:", error);
    return [];
  }
}

/**
 * Add a new collaborator to the encryption key
 * @param docId - Document or drawing ID
 * @param newAddress - New collaborator's wallet address
 */
export function addCollaborator(docId: string, newAddress: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(`enc_key_${docId}`);
    if (!stored) {
      // Create new key with just this address
      const key = generateEncryptionKey([newAddress]);
      storeEncryptionKey(docId, key, [newAddress]);
      return;
    }
    
    const keyData = JSON.parse(stored);
    const addresses = keyData.addresses || [];
    
    // Check if address already exists
    const normalizedNew = newAddress.toLowerCase();
    const normalizedExisting = addresses.map((addr: string) =>
      addr.toLowerCase()
    );
    
    if (normalizedExisting.includes(normalizedNew)) {
      return; // Already a collaborator
    }
    
    // Add new address and regenerate key
    const newAddresses = [...addresses, newAddress];
    const newKey = generateEncryptionKey(newAddresses);
    storeEncryptionKey(docId, newKey, newAddresses);
  } catch (error) {
    console.error("Failed to add collaborator:", error);
  }
}

