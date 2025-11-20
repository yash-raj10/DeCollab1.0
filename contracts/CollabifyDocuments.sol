// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CollabifyDocuments
 * @dev Smart contract for storing document metadata and IPFS CIDs on Base L2
 * @author Collabify Team
 */
contract CollabifyDocuments {
    
    // Document structure
    struct Document {
        string docId;
        string cid;
        address createdBy;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Mapping from docId to Document
    mapping(string => Document) private documents;
    
    // Mapping to check if a document exists
    mapping(string => bool) private documentExists;
    
    // Events
    event DocumentCreated(
        string indexed docId,
        string cid,
        address indexed createdBy,
        uint256 createdAt
    );
    
    event DocumentUpdated(
        string indexed docId,
        string cid,
        uint256 updatedAt
    );
    
    // Modifiers
    modifier documentMustExist(string memory docId) {
        require(documentExists[docId], "Document does not exist");
        _;
    }
    
    modifier onlyDocumentOwner(string memory docId) {
        require(
            documents[docId].createdBy == msg.sender,
            "Only document owner can perform this action"
        );
        _;
    }
    
    modifier validDocId(string memory docId) {
        require(bytes(docId).length > 0, "Document ID cannot be empty");
        _;
    }
    
    modifier validCid(string memory cid) {
        require(bytes(cid).length > 0, "CID cannot be empty");
        _;
    }
    
    /**
     * @dev Creates a new document with given docId and CID
     * @param docId Unique identifier for the document
     * @param cid IPFS Content Identifier for the document
     */
    function createDocument(
        string memory docId,
        string memory cid
    ) 
        external 
        validDocId(docId)
        validCid(cid)
    {
        require(!documentExists[docId], "Document already exists");
        
        uint256 timestamp = block.timestamp;
        
        // Create new document
        documents[docId] = Document({
            docId: docId,
            cid: cid,
            createdBy: msg.sender,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        
        // Mark document as existing
        documentExists[docId] = true;
        
        // Emit event
        emit DocumentCreated(docId, cid, msg.sender, timestamp);
    }
    
    /**
     * @dev Updates an existing document's CID
     * @param docId Unique identifier for the document
     * @param newCid New IPFS Content Identifier for the document
     */
    function updateDocument(
        string memory docId,
        string memory newCid
    )
        external
        validDocId(docId)
        validCid(newCid)
        documentMustExist(docId)
        onlyDocumentOwner(docId)
    {
        uint256 timestamp = block.timestamp;
        
        // Update document
        documents[docId].cid = newCid;
        documents[docId].updatedAt = timestamp;
        
        // Emit event
        emit DocumentUpdated(docId, newCid, timestamp);
    }
    
    /**
     * @dev Retrieves document information by docId
     * @param docId Unique identifier for the document
     * @return cid IPFS Content Identifier
     * @return createdBy Address of the document creator
     * @return createdAt Timestamp when document was created
     * @return updatedAt Timestamp when document was last updated
     */
    function getDocument(string memory docId)
        external
        view
        validDocId(docId)
        documentMustExist(docId)
        returns (
            string memory cid,
            address createdBy,
            uint256 createdAt,
            uint256 updatedAt
        )
    {
        Document memory doc = documents[docId];
        return (doc.cid, doc.createdBy, doc.createdAt, doc.updatedAt);
    }
    
    /**
     * @dev Checks if a document exists
     * @param docId Unique identifier for the document
     * @return bool True if document exists, false otherwise
     */
    function doesDocumentExist(string memory docId)
        external
        view
        validDocId(docId)
        returns (bool)
    {
        return documentExists[docId];
    }
    
    /**
     * @dev Gets the current CID for a document (gas-optimized read)
     * @param docId Unique identifier for the document
     * @return cid Current IPFS Content Identifier
     */
    function getDocumentCid(string memory docId)
        external
        view
        validDocId(docId)
        documentMustExist(docId)
        returns (string memory cid)
    {
        return documents[docId].cid;
    }
    
    /**
     * @dev Gets the owner of a document
     * @param docId Unique identifier for the document
     * @return owner Address of the document creator
     */
    function getDocumentOwner(string memory docId)
        external
        view
        validDocId(docId)
        documentMustExist(docId)
        returns (address owner)
    {
        return documents[docId].createdBy;
    }
    
    /**
     * @dev Checks if the caller is the owner of a document
     * @param docId Unique identifier for the document
     * @return bool True if caller is owner, false otherwise
     */
    function isDocumentOwner(string memory docId)
        external
        view
        validDocId(docId)
        documentMustExist(docId)
        returns (bool)
    {
        return documents[docId].createdBy == msg.sender;
    }
}