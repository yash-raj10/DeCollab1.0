// Blockchain utilities for Collabify smart contract interaction on Mantle Sepolia Testnet
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<string[] | string>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        callback: (...args: unknown[]) => void
      ) => void;
    };
  }
}

// Interface definitions
export interface BlockchainDocument {
  docId: string;
  cid: string;
  createdBy: string; // Mantle account ID or EVM address
  createdAt: number;
  updatedAt: number;
}

export interface BlockchainResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  balance?: string;
}

// Smart contract configuration for Mantle Sepolia Testnet
const CONTRACT_CONFIG = {
  contractAddress: "0x80b865423DfAA4AD644871Ae11c2500Ba84e2C62",
  rpcUrl: "https://rpc.sepolia.mantle.xyz", // Mantle Sepolia RPC
  chainId: 5003, // Mantle Sepolia chain ID (0x138b)
  currency: "MNT",
  explorerUrl: "https://explorer.sepolia.mantle.xyz",
  // Contract ABI
  abi: [
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          internalType: "string",
          name: "cid",
          type: "string",
        },
      ],
      name: "createDocument",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          indexed: false,
          internalType: "string",
          name: "cid",
          type: "string",
        },
        {
          indexed: true,
          internalType: "address",
          name: "createdBy",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "createdAt",
          type: "uint256",
        },
      ],
      name: "DocumentCreated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          indexed: false,
          internalType: "string",
          name: "cid",
          type: "string",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "updatedAt",
          type: "uint256",
        },
      ],
      name: "DocumentUpdated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
        {
          internalType: "string",
          name: "newCid",
          type: "string",
        },
      ],
      name: "updateDocument",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "doesDocumentExist",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "getDocument",
      outputs: [
        {
          internalType: "string",
          name: "cid",
          type: "string",
        },
        {
          internalType: "address",
          name: "createdBy",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "createdAt",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "updatedAt",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "getDocumentCid",
      outputs: [
        {
          internalType: "string",
          name: "cid",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "getDocumentOwner",
      outputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "docId",
          type: "string",
        },
      ],
      name: "isDocumentOwner",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
};

// Network configuration for Mantle Sepolia Testnet
const MANTLE_SEPOLIA_CONFIG = {
  chainId: "0x138b", // 5003 in hex
  chainName: "Mantle Sepolia Testnet",
  nativeCurrency: {
    name: "Mantle",
    symbol: "MNT",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"],
};

// Utility functions
/**
 * Check if MetaMask or compatible wallet is available
 */
export function isWalletAvailable(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

/**
 * Get provider instance
 */
function getProvider(): ethers.BrowserProvider | ethers.JsonRpcProvider {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
}

/**
 * Get contract instance
 */
function getContract(signer?: ethers.Signer): ethers.Contract {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_CONFIG.contractAddress,
    CONTRACT_CONFIG.abi,
    signer || provider
  );
  return contract;
}

/**
 * Connect to wallet and add/switch to Mantle Testnet
 */
export async function connectWallet(): Promise<WalletConnection> {
  if (!isWalletAvailable() || !window.ethereum) {
    throw new Error("MetaMask or compatible wallet is required");
  }

  try {
    let provider = new ethers.BrowserProvider(window.ethereum);

    // Request account access
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your wallet.");
    }

    // Get current chain ID
    const network = await provider.getNetwork();
    const chainIdDecimal = Number(network.chainId);

    // If not on Mantle testnet, try to switch
    if (chainIdDecimal !== CONTRACT_CONFIG.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MANTLE_SEPOLIA_CONFIG.chainId }],
        });
      } catch (switchError: unknown) {
        // If the chain hasn't been added yet, add it
        const err = switchError as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MANTLE_SEPOLIA_CONFIG],
          });
        } else {
          throw switchError;
        }
      }

      // After network switch, recreate provider so ethers sees the new network
      if (!window.ethereum) {
        throw new Error("Ethereum provider not available");
      }
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    // Get signer and balance
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const balanceInEther = ethers.formatEther(balance);

    return {
      address,
      chainId: CONTRACT_CONFIG.chainId,
      isConnected: true,
      balance: balanceInEther,
    };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to connect wallet"
    );
  }
}

/**
 * Get connected wallet address
 */
export async function getConnectedAddress(): Promise<string | null> {
  if (!isWalletAvailable() || !window.ethereum) {
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Failed to get connected address:", error);
    return null;
  }
}

/**
 * Create a document on the blockchain
 * @param docId - Unique document identifier (UUID)
 * @param cid - IPFS Content Identifier
 * @returns Promise with blockchain transaction result
 */
export async function createDocumentOnChain(
  docId: string,
  cid: string
): Promise<BlockchainResult> {
  try {
    console.log("Creating document on blockchain...", { docId, cid });

    // Ensure wallet is connected
    const walletConnection = await connectWallet();
    console.log("Connected wallet:", walletConnection.address);

    // Get provider and signer
    if (!window.ethereum) {
      throw new Error("Ethereum provider not available");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    // Estimate gas
    const gasEstimate = await contract.createDocument.estimateGas(docId, cid);
    console.log("Estimated gas:", gasEstimate.toString());

    // Send transaction
    const tx = await contract.createDocument(docId, cid, {
      gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // Add 20% buffer
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Document created on blockchain:", {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    // Store document ID in localStorage for easy retrieval later
    // (Workaround for indexed string limitation in events)
    storeUserDocumentId(walletConnection.address, docId);

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error: unknown) {
    console.error("Blockchain document creation failed:", error);

    // Handle specific error cases
    let errorMessage = "Unknown blockchain error";
    const err = error as { code?: number | string; message?: string };
    if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      errorMessage = "Transaction was rejected by user";
    } else if (
      err.message &&
      (err.message.includes("insufficient funds") ||
        err.message.includes("insufficient balance"))
    ) {
      errorMessage = "Insufficient MNT balance for transaction";
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update a document on the blockchain
 * @param docId - Document identifier
 * @param newCid - New IPFS Content Identifier
 * @returns Promise with blockchain transaction result
 */
export async function updateDocumentOnChain(
  docId: string,
  newCid: string
): Promise<BlockchainResult> {
  try {
    console.log("Updating document on blockchain...", { docId, newCid });

    // Ensure wallet is connected
    const walletConnection = await connectWallet();
    console.log("Connected wallet:", walletConnection.address);

    // Get provider and signer
    if (!window.ethereum) {
      throw new Error("Ethereum provider not available");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getContract(signer);

    // Check if document exists and user owns it
    const isOwner = await contract.isDocumentOwner(docId);

    if (!isOwner) {
      throw new Error("Only document owner can update this document");
    }

    // Estimate gas
    const gasEstimate = await contract.updateDocument.estimateGas(
      docId,
      newCid
    );
    console.log("Estimated gas:", gasEstimate.toString());

    // Send transaction
    const tx = await contract.updateDocument(docId, newCid, {
      gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // Add 20% buffer
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("Document updated on blockchain:", {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    // Ensure document ID is stored in localStorage
    // (Workaround for indexed string limitation in events)
    storeUserDocumentId(walletConnection.address, docId);

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error: unknown) {
    console.error("Blockchain document update failed:", error);

    let errorMessage = "Unknown blockchain error";
    const err = error as { code?: number | string; message?: string };
    if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      errorMessage = "Transaction was rejected by user";
    } else if (
      err.message &&
      (err.message.includes("insufficient funds") ||
        err.message.includes("insufficient balance"))
    ) {
      errorMessage = "Insufficient MNT balance for transaction";
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get a document from the blockchain
 * @param docId - Document identifier
 * @returns Promise with document data or null if not found
 */
export async function getDocumentFromChain(
  docId: string
): Promise<BlockchainDocument | null> {
  try {
    console.log("Getting document from blockchain...", docId);

    // Use JsonRpcProvider for read operations to ensure consistency
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      CONTRACT_CONFIG.contractAddress,
      CONTRACT_CONFIG.abi,
      provider
    );

    // Verify contract exists at address
    const code = await provider.getCode(CONTRACT_CONFIG.contractAddress);
    if (code === "0x" || code === "0x0") {
      console.error(
        "No contract found at address:",
        CONTRACT_CONFIG.contractAddress
      );
      throw new Error("Contract not found at the specified address");
    }

    // Check if document exists
    const exists = await contract.doesDocumentExist(docId);
    if (!exists) {
      return null;
    }

    // Get document details
    const result = await contract.getDocument(docId);

    return {
      docId,
      cid: result[0] || result.cid,
      createdBy: result[1] || result.createdBy,
      createdAt: Number(result[2] || result.createdAt),
      updatedAt: Number(result[3] || result.updatedAt),
    };
  } catch (error: unknown) {
    console.error("Failed to get document from blockchain:", error);

    // Provide more helpful error messages
    const err = error as { code?: string; message?: string };
    if (err.code === "BAD_DATA" || err.message?.includes("could not decode")) {
      console.error("Contract interaction error - possible causes:");
      console.error(
        "1. Contract not deployed at:",
        CONTRACT_CONFIG.contractAddress
      );
      console.error(
        "2. Wrong network (should be Mantle Sepolia Testnet - Chain ID: 5003)"
      );
      console.error("3. RPC endpoint issue:", CONTRACT_CONFIG.rpcUrl);
      console.error("4. ABI mismatch with deployed contract");
    }

    return null;
  }
}

/**
 * Check if a document exists on the blockchain
 * @param docId - Document identifier
 * @returns Promise<boolean>
 */
export async function documentExistsOnChain(docId: string): Promise<boolean> {
  try {
    // Use JsonRpcProvider for read operations
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      CONTRACT_CONFIG.contractAddress,
      CONTRACT_CONFIG.abi,
      provider
    );

    // Verify contract exists
    const code = await provider.getCode(CONTRACT_CONFIG.contractAddress);
    if (code === "0x" || code === "0x0") {
      console.error(
        "No contract found at address:",
        CONTRACT_CONFIG.contractAddress
      );
      return false;
    }

    return await contract.doesDocumentExist(docId);
  } catch (error: unknown) {
    console.error("Failed to check document existence:", error);
    const err = error as { code?: string; message?: string };
    if (err.code === "BAD_DATA" || err.message?.includes("could not decode")) {
      console.error(
        "Contract interaction error - check contract address and network"
      );
    }
    return false;
  }
}

/**
 * Store document ID in local storage for a user
 * @param userAddress - User's wallet address
 * @param docId - Document ID to store
 */
function storeUserDocumentId(userAddress: string, docId: string) {
  if (typeof window === "undefined") return;

  try {
    const key = `user_docs_${userAddress.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    const docIds: string[] = stored ? JSON.parse(stored) : [];

    if (!docIds.includes(docId)) {
      docIds.push(docId);
      localStorage.setItem(key, JSON.stringify(docIds));
    }
  } catch (error) {
    console.error("Failed to store document ID:", error);
  }
}

/**
 * Get stored document IDs for a user from local storage
 * @param userAddress - User's wallet address
 * @returns Array of document IDs
 */
function getStoredUserDocumentIds(userAddress: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const key = `user_docs_${userAddress.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get stored document IDs:", error);
    return [];
  }
}

/**
 * Get all documents created by a user
 * @param userAddress - User's wallet address
 * @returns Promise with array of document IDs and metadata
 */
export async function getUserDocumentsFromChain(
  userAddress: string
): Promise<Array<{ docId: string; document: BlockchainDocument }>> {
  try {
    console.log("Getting user documents from blockchain...", userAddress);

    // Get stored document IDs from localStorage (workaround for indexed string limitation)
    const storedDocIds = getStoredUserDocumentIds(userAddress);
    console.log(`Found ${storedDocIds.length} stored document IDs`);

    // Use JsonRpcProvider for read operations
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
    const contract = new ethers.Contract(
      CONTRACT_CONFIG.contractAddress,
      CONTRACT_CONFIG.abi,
      provider
    );

    // Verify contract exists
    const code = await provider.getCode(CONTRACT_CONFIG.contractAddress);
    if (code === "0x" || code === "0x0") {
      console.error(
        "No contract found at address:",
        CONTRACT_CONFIG.contractAddress
      );
      // Still return documents from localStorage even if contract check fails
      if (storedDocIds.length > 0) {
        console.log("Using stored document IDs as fallback");
      } else {
        return [];
      }
    }

    // Fetch documents using stored docIds
    // Since indexed strings in events are hashed, we can't get docIds from events
    // So we rely on localStorage where we store docIds when documents are created
    const userDocuments = await Promise.all(
      storedDocIds.map(async (docId) => {
        try {
          const document = await getDocumentFromChain(docId);
          if (
            document &&
            document.createdBy.toLowerCase() === userAddress.toLowerCase()
          ) {
            return {
              docId,
              document: {
                docId: document.docId,
                cid: document.cid,
                createdBy: document.createdBy,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt,
              },
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching document ${docId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and deduplicate
    const validDocuments = userDocuments.filter(
      (doc): doc is { docId: string; document: BlockchainDocument } =>
        doc !== null
    );

    // Deduplicate by docId (keep latest by updatedAt)
    const docMap = new Map<
      string,
      { docId: string; document: BlockchainDocument }
    >();
    for (const doc of validDocuments) {
      if (doc && doc.docId) {
        const existing = docMap.get(doc.docId);
        if (!existing || doc.document.updatedAt > existing.document.updatedAt) {
          docMap.set(doc.docId, doc);
        }
      }
    }

    // Convert to array and sort by updatedAt descending
    const dedupedSortedDocs = Array.from(docMap.values()).sort(
      (a, b) => b.document.updatedAt - a.document.updatedAt
    );

    console.log(
      `Successfully retrieved ${dedupedSortedDocs.length} unique documents`
    );
    return dedupedSortedDocs;
  } catch (error) {
    console.error("Failed to get user documents from blockchain:", error);
    // Return stored documents as fallback
    const storedDocIds = getStoredUserDocumentIds(userAddress);
    if (storedDocIds.length > 0) {
      console.log("Returning stored document IDs as fallback");
    }
    return [];
  }
}

// Helper functions for blockchain operations

/**
 * Verify that the contract is deployed and accessible
 * @returns Promise<boolean> - true if contract exists, false otherwise
 */
export async function verifyContractAccess(): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
    const code = await provider.getCode(CONTRACT_CONFIG.contractAddress);

    if (code === "0x" || code === "0x0") {
      console.error(
        "❌ Contract not found at address:",
        CONTRACT_CONFIG.contractAddress
      );
      console.error("Please verify:");
      console.error("1. Contract is deployed to Mantle Sepolia Testnet");
      console.error("2. Contract address is correct");
      console.error(
        "3. You're connected to Mantle Sepolia Testnet (Chain ID: 5003)"
      );
      return false;
    }

    console.log(
      "✅ Contract verified at address:",
      CONTRACT_CONFIG.contractAddress
    );
    return true;
  } catch (error) {
    console.error("Failed to verify contract:", error);
    return false;
  }
}

/**
 * Generate UUID for document ID
 * @returns UUID string
 */
export function generateDocumentId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get blockchain explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Explorer URL string
 */
export function getTransactionUrl(txHash: string): string {
  return `${CONTRACT_CONFIG.explorerUrl}/transaction/${txHash}`;
}

/**
 * Get current gas price from the network
 * @returns Promise with gas price in wei
 */
export async function getCurrentGasPrice(): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
    const feeData = await provider.getFeeData();
    return (feeData.gasPrice || BigInt(0)).toString();
  } catch (error) {
    console.error("Failed to get gas price:", error);
    return "0";
  }
}

/**
 * Get wallet balance in MNT
 * @param address - Wallet address
 * @returns Promise with balance as string
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Failed to get wallet balance:", error);
    return "0";
  }
}

/**
 * Validate if a string is a valid Ethereum address (works for Mantle EVM addresses)
 * @param address - Address to validate
 * @returns boolean
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validate if a string is a valid transaction hash
 * @param hash - Hash to validate
 * @returns boolean
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Listen for contract events
 * @param eventName - Name of the event to listen for
 * @param callback - Callback function to execute when event is emitted
 */
export async function subscribeToContractEvents(
  eventName: string,
  callback: (...args: unknown[]) => void
): Promise<void> {
  try {
    const contract = getContract();
    contract.on(eventName, callback);
    console.log(`Subscribed to ${eventName} events`);
  } catch (error) {
    console.error(`Failed to subscribe to ${eventName} events:`, error);
  }
}

/**
 * Remove event listeners
 */
export async function unsubscribeFromContractEvents(): Promise<void> {
  try {
    const contract = getContract();
    contract.removeAllListeners();
    console.log("Removed all event listeners");
  } catch (error) {
    console.error("Failed to unsubscribe from contract events:", error);
  }
}
