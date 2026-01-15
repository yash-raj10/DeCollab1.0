const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollabifyDocuments", function () {
  let collabifyDocs;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const CollabifyDocuments = await ethers.getContractFactory(
      "CollabifyDocuments"
    );
    collabifyDocs = await CollabifyDocuments.deploy();
    await collabifyDocs.waitForDeployment();
  });

  describe("Document Creation", function () {
    it("Should create a document successfully", async function () {
      const docId = "test-doc-1";
      const cid = "QmTestCID123456789";

      await expect(collabifyDocs.createDocument(docId, cid))
        .to.emit(collabifyDocs, "DocumentCreated")
        .withArgs(
          docId,
          cid,
          owner.address,
          await ethers.provider.getBlock().then((b) => b.timestamp + 1)
        );

      expect(await collabifyDocs.doesDocumentExist(docId)).to.be.true;
    });

    it("Should fail to create document with empty docId", async function () {
      const docId = "";
      const cid = "QmTestCID123456789";

      await expect(collabifyDocs.createDocument(docId, cid)).to.be.revertedWith(
        "Document ID cannot be empty"
      );
    });

    it("Should fail to create document with empty CID", async function () {
      const docId = "test-doc-1";
      const cid = "";

      await expect(collabifyDocs.createDocument(docId, cid)).to.be.revertedWith(
        "CID cannot be empty"
      );
    });

    it("Should fail to create duplicate document", async function () {
      const docId = "test-doc-1";
      const cid = "QmTestCID123456789";

      await collabifyDocs.createDocument(docId, cid);

      await expect(collabifyDocs.createDocument(docId, cid)).to.be.revertedWith(
        "Document already exists"
      );
    });
  });

  describe("Document Retrieval", function () {
    it("Should retrieve document correctly", async function () {
      const docId = "test-doc-2";
      const cid = "QmTestCID987654321";

      await collabifyDocs.createDocument(docId, cid);

      const [retrievedCid, createdBy, createdAt, updatedAt] =
        await collabifyDocs.getDocument(docId);

      expect(retrievedCid).to.equal(cid);
      expect(createdBy).to.equal(owner.address);
      expect(createdAt).to.be.gt(0);
      expect(updatedAt).to.equal(createdAt);
    });

    it("Should fail to retrieve non-existent document", async function () {
      const docId = "non-existent-doc";

      await expect(collabifyDocs.getDocument(docId)).to.be.revertedWith(
        "Document does not exist"
      );
    });

    it("Should get document CID correctly", async function () {
      const docId = "test-doc-3";
      const cid = "QmTestCID111111111";

      await collabifyDocs.createDocument(docId, cid);

      expect(await collabifyDocs.getDocumentCid(docId)).to.equal(cid);
    });
  });

  describe("Document Updates", function () {
    it("Should update document CID successfully", async function () {
      const docId = "test-doc-4";
      const originalCid = "QmOriginalCID123";
      const newCid = "QmUpdatedCID456";

      await collabifyDocs.createDocument(docId, originalCid);

      await expect(collabifyDocs.updateDocument(docId, newCid))
        .to.emit(collabifyDocs, "DocumentUpdated")
        .withArgs(
          docId,
          newCid,
          await ethers.provider.getBlock().then((b) => b.timestamp + 1)
        );

      expect(await collabifyDocs.getDocumentCid(docId)).to.equal(newCid);
    });

    it("Should fail to update non-existent document", async function () {
      const docId = "non-existent-doc";
      const newCid = "QmNewCID789";

      await expect(
        collabifyDocs.updateDocument(docId, newCid)
      ).to.be.revertedWith("Document does not exist");
    });

    it("Should fail to update document by non-owner", async function () {
      const docId = "test-doc-5";
      const originalCid = "QmOriginalCID789";
      const newCid = "QmUpdatedCID101112";

      await collabifyDocs.createDocument(docId, originalCid);

      await expect(
        collabifyDocs.connect(addr1).updateDocument(docId, newCid)
      ).to.be.revertedWith("Only document owner can perform this action");
    });

    it("Should fail to update with empty CID", async function () {
      const docId = "test-doc-6";
      const originalCid = "QmOriginalCID456";
      const newCid = "";

      await collabifyDocs.createDocument(docId, originalCid);

      await expect(
        collabifyDocs.updateDocument(docId, newCid)
      ).to.be.revertedWith("CID cannot be empty");
    });
  });

  describe("Ownership Functions", function () {
    it("Should return correct document owner", async function () {
      const docId = "test-doc-7";
      const cid = "QmOwnershipCID123";

      await collabifyDocs.createDocument(docId, cid);

      expect(await collabifyDocs.getDocumentOwner(docId)).to.equal(
        owner.address
      );
    });

    it("Should correctly identify document owner", async function () {
      const docId = "test-doc-8";
      const cid = "QmOwnershipCID456";

      await collabifyDocs.createDocument(docId, cid);

      expect(await collabifyDocs.isDocumentOwner(docId)).to.be.true;
      expect(await collabifyDocs.connect(addr1).isDocumentOwner(docId)).to.be
        .false;
    });
  });

  describe("Document Existence", function () {
    it("Should correctly report document existence", async function () {
      const docId = "test-doc-9";
      const cid = "QmExistsCID789";

      expect(await collabifyDocs.doesDocumentExist(docId)).to.be.false;

      await collabifyDocs.createDocument(docId, cid);

      expect(await collabifyDocs.doesDocumentExist(docId)).to.be.true;
    });

    it("Should fail existence check with empty docId", async function () {
      await expect(collabifyDocs.doesDocumentExist("")).to.be.revertedWith(
        "Document ID cannot be empty"
      );
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for document operations", async function () {
      const docId = "gas-test-doc";
      const cid = "QmGasTestCID123";

      // Test creation gas cost
      const createTx = await collabifyDocs.createDocument(docId, cid);
      const createReceipt = await createTx.wait();
      console.log(`Document creation gas used: ${createReceipt.gasUsed}`);

      // Should be under 200k gas for creation
      expect(createReceipt.gasUsed).to.be.lt(200000);

      // Test update gas cost
      const newCid = "QmUpdatedGasTestCID456";
      const updateTx = await collabifyDocs.updateDocument(docId, newCid);
      const updateReceipt = await updateTx.wait();
      console.log(`Document update gas used: ${updateReceipt.gasUsed}`);

      // Should be under 100k gas for update
      expect(updateReceipt.gasUsed).to.be.lt(100000);
    });
  });
});
