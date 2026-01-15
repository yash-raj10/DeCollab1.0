// Example usage of the blockchain utilities
import {
  connectWallet,
  createDocumentOnChain,
  updateDocumentOnChain,
  getDocumentFromChain,
  generateDocumentId,
  getTransactionUrl,
} from "./blockchain";
import { uploadToIPFS } from "./ipfs";

/**
 * Example function showing how to create a document with blockchain integration
 */
export async function exampleCreateDocument(content: string) {
  try {
    console.log("=== Creating Document Example ===");

    // Step 1: Connect wallet
    console.log("1. Connecting wallet...");
    const wallet = await connectWallet();
    console.log("Connected:", wallet.address);

    // Step 2: Generate document ID
    const docId = generateDocumentId();
    console.log("Generated document ID:", docId);

    // Step 3: Upload to "IPFS" (actually Supabase)
    console.log("2. Uploading to Supabase...");
    const ipfsResult = await uploadToIPFS(content);
    console.log("Uploaded with CID:", ipfsResult.cid);

    // Step 4: Store metadata on blockchain
    console.log("3. Storing metadata on blockchain...");
    const blockchainResult = await createDocumentOnChain(docId, ipfsResult.cid);

    if (blockchainResult.success) {
      console.log("✅ Document created successfully!");
      console.log(
        "Transaction:",
        getTransactionUrl(blockchainResult.transactionHash!)
      );
      console.log("Block:", blockchainResult.blockNumber);

      return {
        docId,
        cid: ipfsResult.cid,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
      };
    } else {
      console.error("❌ Blockchain creation failed:", blockchainResult.error);
      throw new Error(blockchainResult.error);
    }
  } catch (error) {
    console.error("Example failed:", error);
    throw error;
  }
}

/**
 * Example function showing how to update a document
 */
export async function exampleUpdateDocument(docId: string, newContent: string) {
  try {
    console.log("=== Updating Document Example ===");

    // Step 1: Upload new content to Supabase
    console.log("1. Uploading new content...");
    const ipfsResult = await uploadToIPFS(newContent);
    console.log("New CID:", ipfsResult.cid);

    // Step 2: Update on blockchain
    console.log("2. Updating blockchain...");
    const blockchainResult = await updateDocumentOnChain(docId, ipfsResult.cid);

    if (blockchainResult.success) {
      console.log("✅ Document updated successfully!");
      console.log(
        "Transaction:",
        getTransactionUrl(blockchainResult.transactionHash!)
      );
      return blockchainResult;
    } else {
      console.error("❌ Blockchain update failed:", blockchainResult.error);
      throw new Error(blockchainResult.error);
    }
  } catch (error) {
    console.error("Update example failed:", error);
    throw error;
  }
}

/**
 * Example function showing how to retrieve a document
 */
export async function exampleGetDocument(docId: string) {
  try {
    console.log("=== Getting Document Example ===");

    // Get document metadata from blockchain
    console.log("1. Getting metadata from blockchain...");
    const document = await getDocumentFromChain(docId);

    if (document) {
      console.log("✅ Document found!");
      console.log("Document:", document);
      return document;
    } else {
      console.log("❌ Document not found");
      return null;
    }
  } catch (error) {
    console.error("Get document example failed:", error);
    throw error;
  }
}
