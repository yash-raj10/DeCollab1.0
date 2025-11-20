# Collabify Smart Contracts

This directory contains smart contracts for the Collabify platform, designed to be deployed on Base (Ethereum L2).

## Contracts

### CollabifyDocuments.sol

A gas-efficient smart contract for storing document metadata and IPFS Content Identifiers (CIDs) on-chain.

**Features:**

- Document creation and updates with IPFS CID storage
- Owner-only document modification
- Gas-optimized storage patterns
- Comprehensive event logging
- Full EVM compatibility for Base L2 deployment

**Key Functions:**

- `createDocument(docId, cid)` - Creates a new document
- `updateDocument(docId, newCid)` - Updates document CID (owner only)
- `getDocument(docId)` - Retrieves full document metadata
- `getDocumentCid(docId)` - Gas-optimized CID retrieval
- `doesDocumentExist(docId)` - Check document existence

**Events:**

- `DocumentCreated` - Emitted when a new document is created
- `DocumentUpdated` - Emitted when a document is updated

## Deployment

### Prerequisites

```bash
npm install -g @remix-project/remixd
# Or use Hardhat/Foundry for local development
```

### Base L2 Deployment

1. Configure your wallet with Base network
2. Ensure you have ETH on Base for gas fees
3. Deploy using Remix IDE or Hardhat

### Base Network Configuration

- **Network Name:** Base
- **RPC URL:** https://mainnet.base.org
- **Chain ID:** 8453
- **Currency Symbol:** ETH
- **Block Explorer:** https://basescan.org

### Base Testnet (Sepolia)

- **Network Name:** Base Sepolia
- **RPC URL:** https://sepolia.base.org
- **Chain ID:** 84532
- **Currency Symbol:** ETH
- **Block Explorer:** https://sepolia.basescan.org

## Gas Optimization Features

The contract includes several gas optimization techniques:

- Packed storage layout
- Efficient mapping usage
- Minimal external calls
- Optimized modifiers
- Event indexing for efficient querying

## Integration with Collabify

This contract can be integrated with the existing Collabify backend to:

1. Store document hashes on-chain for immutability
2. Provide decentralized document ownership verification
3. Enable blockchain-based document versioning
4. Support future tokenization of collaborative documents

## Security Considerations

- Documents are owned by their creators (immutable)
- Only document owners can update CIDs
- Input validation on all public functions
- Protection against common smart contract vulnerabilities

## License

MIT License - see LICENSE file for details.
