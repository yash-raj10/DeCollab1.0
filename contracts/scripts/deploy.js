const { ethers } = require("hardhat");

async function main() {
  console.log(
    "Deploying CollabifyDocuments contract to Mantle Sepolia Testnet..."
  );

  // Get the contract factory
  const CollabifyDocuments = await ethers.getContractFactory(
    "CollabifyDocuments"
  );

  // Deploy the contract
  const collabifyDocs = await CollabifyDocuments.deploy();
  await collabifyDocs.waitForDeployment();

  const contractAddress = await collabifyDocs.getAddress();
  console.log("CollabifyDocuments deployed to:", contractAddress);

  // Wait for a few blocks to ensure the contract is properly deployed
  console.log("Waiting for blocks to be mined...");
  await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

  // Test the contract with a sample document
  console.log("Testing contract functionality...");

  const testDocId = "test-doc-" + Date.now();
  const testCid = "QmTestCID123456789abcdef";

  try {
    // Create a test document
    const createTx = await collabifyDocs.createDocument(testDocId, testCid);
    await createTx.wait();
    console.log("✅ Test document created successfully");

    // Retrieve the document
    const [cid, createdBy, createdAt, updatedAt] =
      await collabifyDocs.getDocument(testDocId);
    console.log("✅ Test document retrieved:");
    console.log("  CID:", cid);
    console.log("  Created by:", createdBy);
    console.log(
      "  Created at:",
      new Date(Number(createdAt) * 1000).toISOString()
    );
    console.log(
      "  Updated at:",
      new Date(Number(updatedAt) * 1000).toISOString()
    );

    // Test document existence
    const exists = await collabifyDocs.doesDocumentExist(testDocId);
    console.log("✅ Document existence check:", exists);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  console.log("\n📋 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("Block Explorer URL:", getBlockExplorerUrl(contractAddress));
  console.log("\n🚀 Contract deployed successfully!");
}

function getBlockExplorerUrl(address) {
  const network = hre.network.name;
  if (network === "MantleMainnet") {
    return `https://explorer.mantle.xyz/address/${address}`;
  } else if (network === "MantleTestnet") {
    return `https://explorer.sepolia.mantle.xyz/address/${address}`;
  }
  return `Explorer URL not configured for network: ${network}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
