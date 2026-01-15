// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CollabifyDocuments.sol";

/**
 * @title CollabifyDocumentsTest
 * @dev Test contract for CollabifyDocuments functionality
 */
contract CollabifyDocumentsTest {
    CollabifyDocuments public collabifyDocs;
    
    event TestResult(string testName, bool passed);
    
    constructor() {
        collabifyDocs = new CollabifyDocuments();
    }
    
    /**
     * @dev Test document creation
     */
    function testCreateDocument() internal {
        string memory docId = "test-doc-1";
        string memory cid = "QmTestCID123456789";
        
        try collabifyDocs.createDocument(docId, cid) {
            emit TestResult("testCreateDocument", true);
        } catch {
            emit TestResult("testCreateDocument", false);
        }
    }
    
    /**
     * @dev Test document retrieval
     */
    function testGetDocument() internal {
        string memory docId = "test-doc-2";
        string memory cid = "QmTestCID987654321";
        
        collabifyDocs.createDocument(docId, cid);
        
        try collabifyDocs.getDocument(docId) returns (
            string memory retrievedCid,
            address createdBy,
            uint256 createdAt,
            uint256 updatedAt
        ) {
            bool passed = (
                keccak256(bytes(retrievedCid)) == keccak256(bytes(cid)) &&
                createdBy == address(this) &&
                createdAt > 0 &&
                updatedAt > 0
            );
            emit TestResult("testGetDocument", passed);
        } catch {
            emit TestResult("testGetDocument", false);
        }
    }
    
    /**
     * @dev Test document update
     */
    function testUpdateDocument() internal {
        string memory docId = "test-doc-3";
        string memory originalCid = "QmOriginalCID123";
        string memory newCid = "QmUpdatedCID456";
        
        collabifyDocs.createDocument(docId, originalCid);
        
        try collabifyDocs.updateDocument(docId, newCid) {
            string memory retrievedCid = collabifyDocs.getDocumentCid(docId);
            bool passed = keccak256(bytes(retrievedCid)) == keccak256(bytes(newCid));
            emit TestResult("testUpdateDocument", passed);
        } catch {
            emit TestResult("testUpdateDocument", false);
        }
    }
    
    /**
     * @dev Test document existence check
     */
    function testDocumentExists() internal {
        string memory docId = "test-doc-4";
        string memory cid = "QmExistsCID789";
        
        bool existsBefore = collabifyDocs.doesDocumentExist(docId);
        collabifyDocs.createDocument(docId, cid);
        bool existsAfter = collabifyDocs.doesDocumentExist(docId);
        
        bool passed = !existsBefore && existsAfter;
        emit TestResult("testDocumentExists", passed);
    }
    
    /**
     * @dev Test ownership verification
     */
    function testOwnership() internal {
        string memory docId = "test-doc-5";
        string memory cid = "QmOwnershipCID101";
        
        collabifyDocs.createDocument(docId, cid);
        
        address owner = collabifyDocs.getDocumentOwner(docId);
        bool isOwner = collabifyDocs.isDocumentOwner(docId);
        
        bool passed = (owner == address(this)) && isOwner;
        emit TestResult("testOwnership", passed);
    }
    
    /**
     * @dev Run all tests
     */
    function runAllTests() external {
        testCreateDocument();
        testGetDocument();
        testUpdateDocument();
        testDocumentExists();
        testOwnership();
    }
}