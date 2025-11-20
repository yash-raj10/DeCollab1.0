// Example showing how the updated DocPage.tsx integrates with blockchain

## 🚀 Updated DocPage.tsx - Blockchain Integration Summary

### Key Changes Made:

1. **Wallet Integration**:

   - Added wallet connection functionality
   - Displays wallet connection status in the UI
   - Uses wallet address instead of email for document ownership

2. **Enhanced Document Management**:

   - Documents are stored with wallet address as owner
   - Blockchain metadata includes creation/update timestamps
   - CID links to Supabase storage for actual content

3. **Improved UI Components**:
   - **Wallet Connection Button**: Shows connection status and allows connecting
   - **My Documents Sidebar**: Lists all documents owned by connected wallet
   - **Document Details Modal**: Shows comprehensive blockchain information

### New Features:

#### 1. Wallet Connection

```typescript
// Auto-check wallet connection on load
const checkWalletConnection = async () => {
  const address = await getConnectedAddress();
  if (address) {
    setConnectedWallet(address);
    setIsWalletConnected(true);
  }
};

// Connect wallet manually
const handleConnectWallet = async () => {
  const walletConnection = await connectWallet();
  setConnectedWallet(walletConnection.address);
  setIsWalletConnected(true);
};
```

#### 2. Document Ownership by Wallet

```typescript
// Save document with wallet as owner
const blockchainResult = await createDocumentOnChain(sessionId, cid);
// No email parameter needed - uses connected wallet automatically

// Load user's documents by wallet address
const blockchainDocs = await getUserDocumentsFromChain(connectedWallet);
```

#### 3. Blockchain Document Details

```typescript
interface BlockchainDoc {
  id: string;
  docId: string;
  updatedAt: string;
  content: string;
  cid: string;
  createdBy: string; // Wallet address
  createdAt: number;
  transactionHash?: string;
}
```

### UI Flow:

1. **Page Load**:

   - Check if wallet is already connected
   - Display connection status in header

2. **Connect Wallet**:

   - Click "Connect" button
   - MetaMask prompts for connection
   - Switches to Rootstock testnet if needed

3. **View My Documents**:

   - Click "My Docs" (only enabled when wallet connected)
   - Fetches documents owned by connected wallet
   - Shows list in sidebar

4. **Document Details**:

   - Click "📊 Details" on any document
   - Shows comprehensive blockchain information:
     - Document ID
     - Storage CID (Supabase ID)
     - Owner wallet address
     - Creation/update timestamps
     - Transaction hash (if available)
     - Links to blockchain explorer

5. **Load Document**:

   - Click "Load Document"
   - Fetches content from Supabase using CID
   - Updates editor with document content

6. **Save Document**:
   - Only enabled when wallet is connected
   - Stores content in Supabase (gets CID)
   - Creates/updates blockchain record with metadata
   - Shows transaction hash upon success

### Error Handling:

- **No Wallet**: Clear messaging about needing wallet connection
- **Wrong Network**: Automatically switches to Rootstock testnet
- **Transaction Failures**: Detailed error messages for different scenarios
- **Loading States**: Visual feedback during blockchain operations

### Security Features:

- **Ownership Verification**: Only document owner can update documents
- **Wallet Validation**: All operations require connected wallet
- **Transaction Confirmation**: Wait for blockchain confirmation before success

### Example Usage:

```typescript
// User flow:
1. User opens document page
2. Clicks "Connect" to connect wallet
3. Wallet switches to Rootstock testnet
4. User writes content and clicks "Save"
5. Content stored in Supabase, metadata on blockchain
6. User clicks "My Docs" to see their documents
7. Clicks "📊 Details" to see blockchain information
8. Can copy addresses, transaction hashes, or view on explorer
9. Clicks "Load Document" to edit existing documents
```

This implementation provides a complete blockchain-integrated document management system with proper wallet authentication and comprehensive document metadata tracking.
