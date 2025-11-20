# Collabify Smart Contract Integration Guide

This guide explains how to integrate the Collabify smart contract with the existing Go backend and Next.js frontend.

## Overview

The smart contract stores document metadata and IPFS CIDs on Base L2, providing:

- Immutable document ownership records
- Decentralized document versioning
- Blockchain-based document integrity verification

## Backend Integration (Go)

### 1. Add Web3 Dependencies

```bash
cd server
go get github.com/ethereum/go-ethereum
go get github.com/ethereum/go-ethereum/crypto
go get github.com/ethereum/go-ethereum/accounts/abi/bind
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Base L2 Configuration
BASE_RPC_URL=https://mainnet.base.org
BASE_CHAIN_ID=8453
CONTRACT_ADDRESS=0x... # Your deployed contract address
PRIVATE_KEY=0x... # Your private key for contract interactions

# IPFS Configuration (optional)
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
IPFS_API_URL=https://api.pinata.cloud
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret
```

### 3. Smart Contract Integration Service

Create `server/blockchain/contract.go`:

```go
package blockchain

import (
    "context"
    "crypto/ecdsa"
    "math/big"
    "github.com/ethereum/go-ethereum"
    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/ethereum/go-ethereum/ethclient"
    "github.com/ethereum/go-ethereum/common"
)

type ContractService struct {
    client   *ethclient.Client
    auth     *bind.TransactOpts
    contract *CollabifyDocuments // Generated binding
    address  common.Address
}

func NewContractService(rpcURL, privateKeyHex, contractAddress string) (*ContractService, error) {
    client, err := ethclient.Dial(rpcURL)
    if err != nil {
        return nil, err
    }

    privateKey, err := crypto.HexToECDSA(privateKeyHex)
    if err != nil {
        return nil, err
    }

    publicKey := privateKey.Public()
    publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
    if !ok {
        return nil, errors.New("cannot assert type: publicKey is not of type *ecdsa.PublicKey")
    }

    fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
    nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
    if err != nil {
        return nil, err
    }

    gasPrice, err := client.SuggestGasPrice(context.Background())
    if err != nil {
        return nil, err
    }

    auth := bind.NewKeyedTransactor(privateKey)
    auth.Nonce = big.NewInt(int64(nonce))
    auth.Value = big.NewInt(0)
    auth.GasLimit = uint64(300000)
    auth.GasPrice = gasPrice

    address := common.HexToAddress(contractAddress)
    contract, err := NewCollabifyDocuments(address, client)
    if err != nil {
        return nil, err
    }

    return &ContractService{
        client:   client,
        auth:     auth,
        contract: contract,
        address:  address,
    }, nil
}

func (cs *ContractService) CreateDocument(docID, cid string) error {
    tx, err := cs.contract.CreateDocument(cs.auth, docID, cid)
    if err != nil {
        return err
    }

    _, err = bind.WaitMined(context.Background(), cs.client, tx)
    return err
}

func (cs *ContractService) UpdateDocument(docID, newCid string) error {
    tx, err := cs.contract.UpdateDocument(cs.auth, docID, newCid)
    if err != nil {
        return err
    }

    _, err = bind.WaitMined(context.Background(), cs.client, tx)
    return err
}

func (cs *ContractService) GetDocument(docID string) (string, common.Address, *big.Int, *big.Int, error) {
    return cs.contract.GetDocument(&bind.CallOpts{}, docID)
}
```

### 4. IPFS Integration Service

Create `server/ipfs/ipfs.go`:

```go
package ipfs

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
)

type IPFSService struct {
    apiURL    string
    apiKey    string
    secretKey string
}

type PinataResponse struct {
    IpfsHash string `json:"IpfsHash"`
}

func NewIPFSService(apiURL, apiKey, secretKey string) *IPFSService {
    return &IPFSService{
        apiURL:    apiURL,
        apiKey:    apiKey,
        secretKey: secretKey,
    }
}

func (ipfs *IPFSService) PinContent(content string, filename string) (string, error) {
    var b bytes.Buffer
    writer := multipart.NewWriter(&b)

    part, err := writer.CreateFormFile("file", filename)
    if err != nil {
        return "", err
    }

    part.Write([]byte(content))
    writer.Close()

    req, err := http.NewRequest("POST", ipfs.apiURL+"/pinning/pinFileToIPFS", &b)
    if err != nil {
        return "", err
    }

    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("pinata_api_key", ipfs.apiKey)
    req.Header.Set("pinata_secret_api_key", ipfs.secretKey)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }

    var pinataResp PinataResponse
    err = json.Unmarshal(body, &pinataResp)
    if err != nil {
        return "", err
    }

    return pinataResp.IpfsHash, nil
}
```

### 5. Enhanced Document Service

Modify `server/docs/docs.go` to integrate blockchain:

```go
// Add blockchain integration to SaveDocument function
func SaveDocument(c *gin.Context) {
    // ... existing code ...

    // After successful database save, also save to blockchain
    if blockchainService != nil {
        // Pin content to IPFS
        cid, err := ipfsService.PinContent(req.Content, req.DocID+".html")
        if err != nil {
            log.Printf("IPFS pinning failed: %v", err)
        } else {
            // Save to blockchain
            err = blockchainService.CreateDocument(req.DocID, cid)
            if err != nil {
                log.Printf("Blockchain save failed: %v", err)
            } else {
                log.Printf("Document saved to blockchain with CID: %s", cid)
            }
        }
    }

    // ... rest of existing code ...
}
```

## Frontend Integration (Next.js)

### 1. Add Web3 Dependencies

```bash
cd client
npm install ethers @rainbow-me/rainbowkit wagmi viem
```

### 2. Web3 Configuration

Create `client/app/config/web3.ts`:

```typescript
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const { chains, publicClient } = configureChains(
  [base, baseSepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Collabify",
  projectId: "YOUR_WALLET_CONNECT_PROJECT_ID",
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains };
```

### 3. Smart Contract Hook

Create `client/app/hooks/useCollabifyContract.ts`:

```typescript
import { useContract, useContractRead, useContractWrite } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../config/contract";

export function useCollabifyContract() {
  const contract = useContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
  });

  const { write: createDocument } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "createDocument",
  });

  const { write: updateDocument } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "updateDocument",
  });

  const getDocument = (docId: string) => {
    return useContractRead({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getDocument",
      args: [docId],
    });
  };

  return {
    contract,
    createDocument,
    updateDocument,
    getDocument,
  };
}
```

### 4. Web3 Provider Setup

Modify `client/app/layout.tsx`:

```tsx
import { WagmiConfig } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig, chains } from "./config/web3";
import "@rainbow-me/rainbowkit/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            <AuthProvider>{children}</AuthProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  );
}
```

## Deployment Steps

### 1. Deploy Smart Contract

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your private key and API keys

# Deploy to Base Sepolia (testnet)
npm run deploy:base-sepolia

# Deploy to Base Mainnet
npm run deploy:base
```

### 2. Update Configuration

Update your backend and frontend configurations with the deployed contract address.

### 3. Test Integration

1. Create a document through the UI
2. Verify it's saved to MongoDB (existing functionality)
3. Check that it's also pinned to IPFS and recorded on blockchain
4. Verify document retrieval works from all sources

## Benefits

1. **Immutability**: Documents stored on blockchain cannot be tampered with
2. **Ownership Proof**: Clear ownership records on-chain
3. **Version History**: IPFS CIDs provide content-addressable versioning
4. **Decentralization**: Reduces dependence on centralized storage
5. **Interoperability**: Other applications can read document metadata from blockchain

## Gas Optimization

The contract is optimized for Base L2:

- Efficient storage patterns
- Minimal external calls
- Batched operations where possible
- Gas costs typically under 100k per operation on L2

## Security Considerations

1. Private keys must be secured and never committed to repositories
2. Use environment variables for all sensitive configuration
3. Implement proper access controls in your backend
4. Consider using a multi-signature wallet for contract ownership
5. Regular security audits recommended for production deployment

## Future Enhancements

1. **Document Sharing**: Implement on-chain permission management
2. **Tokenization**: Convert documents to NFTs for ownership transfer
3. **Collaboration Tokens**: Reward contributors with tokens
4. **DAO Governance**: Community governance for platform decisions
5. **Cross-chain Compatibility**: Support multiple blockchain networks
