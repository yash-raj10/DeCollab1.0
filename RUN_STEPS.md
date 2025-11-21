# 🚀 Step-by-Step Guide to Run DeCollab on Hedera

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** 18+ installed ([Download](https://nodejs.org/))
- ✅ **Go** 1.19+ installed ([Download](https://go.dev/dl/))
- ✅ **MongoDB** running locally or cloud instance ([Download](https://www.mongodb.com/try/download/community))
- ✅ **MetaMask** or compatible Web3 wallet installed in your browser
- ✅ **HBAR tokens** on Hedera Testnet (for transaction fees)

---

## Step 1: Install Dependencies

### Frontend Dependencies

```bash
cd client
npm install
```

This will install:
- Next.js 15.3.4
- React 19.1.0
- ethers.js 6.15.0
- @hashgraph/sdk 2.39.0
- And other required packages

### Backend Dependencies

```bash
cd server
go mod tidy
```

---

## Step 2: Set Up Environment Variables

### Frontend Environment (`.env.local`)

Create a file `client/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Hedera Blockchain Configuration
NEXT_PUBLIC_HEDERA_CONTRACT_ADDRESS=0x0658cEa786FcB7E2d0dDfCf7B88103b24d9E9a9F
NEXT_PUBLIC_HEDERA_RPC_URL=https://testnet.hashio.io/api
```

### Backend Environment (`.env`)

Create a file `server/.env`:

```env
# Server Configuration
PORT=8080
JWT_SECRET=your_jwt_secret_key_here_change_this

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/collabify
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/collabify

# Hedera Blockchain Configuration (optional, for backend blockchain operations)
HEDERA_CONTRACT_ADDRESS=0x0658cEa786FcB7E2d0dDfCf7B88103b24d9E9a9F
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

---

## Step 3: Start MongoDB

### Local MongoDB

If you have MongoDB installed locally:

```bash
# On macOS (using Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
# Start MongoDB service from Services panel
```

### MongoDB Atlas (Cloud)

If using MongoDB Atlas, ensure your connection string is correct in `server/.env`.

---

## Step 4: Start the Backend Server

```bash
cd server
go run main.go
```

You should see:
```
✅ Server running on http://localhost:8080
✅ MongoDB connected
```

**Keep this terminal window open!**

---

## Step 5: Start the Frontend

Open a **new terminal window**:

```bash
cd client
npm run dev
```

You should see:
```
✓ Ready in X seconds
○ Local:        http://localhost:3000
```

---

## Step 6: Configure MetaMask for Hedera Testnet

### Add Hedera Testnet to MetaMask

1. Open MetaMask extension
2. Click the network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add Network" or "Add a network manually"
4. Enter the following details:

   **Network Name:** `Hedera Testnet`
   
   **RPC URL:** `https://testnet.hashio.io/api`
   
   **Chain ID:** `296`
   
   **Currency Symbol:** `HBAR`
   
   **Block Explorer URL:** `https://hashscan.io/testnet`

5. Click "Save"

### Get Testnet HBAR

You'll need HBAR tokens for transaction fees:

1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Request testnet HBAR from the faucet
4. Your wallet address will be your MetaMask address (0x...)

---

## Step 7: Connect Wallet and Use the App

1. **Open the application**: Navigate to `http://localhost:3000`

2. **Connect your wallet**:
   - Click "Connect Wallet" button
   - MetaMask will prompt you to connect
   - Approve the connection
   - If not on Hedera Testnet, MetaMask will prompt to switch networks - approve it

3. **Register (if first time)**:
   - If you haven't registered, you'll be redirected to the registration page
   - Enter your username and email
   - Submit to create your profile

4. **Create a Document**:
   - Click "Create New Session" or navigate to `/doc`
   - Start typing in the editor
   - Click "Save" to store on blockchain
   - Confirm the transaction in MetaMask

5. **View Your Documents**:
   - Click "My Docs" to see all your saved documents
   - Click "📊 Details" to see blockchain information
   - Click "Load Document" to edit existing documents

---

## Step 8: Verify Blockchain Integration

### Check Transaction on HashScan

1. After saving a document, copy the transaction hash
2. Visit `https://hashscan.io/testnet`
3. Paste the transaction hash in the search bar
4. You should see your transaction details

### Verify Contract Interaction

1. Visit: `https://hashscan.io/testnet/contract/0x0658cEa786FcB7E2d0dDfCf7B88103b24d9E9a9F`
2. You can see contract details and recent transactions

---

## Troubleshooting

### Issue: "Failed to connect wallet"

**Solutions:**
- Ensure MetaMask is installed and unlocked
- Check that Hedera Testnet is added to MetaMask
- Refresh the page and try again

### Issue: "Insufficient HBAR balance"

**Solutions:**
- Get testnet HBAR from [Hedera Portal](https://portal.hedera.com/)
- Ensure you're on Hedera Testnet (Chain ID: 296)

### Issue: "Transaction was rejected"

**Solutions:**
- Check you have enough HBAR for gas fees
- Ensure you're on the correct network (Hedera Testnet)
- Try increasing gas limit if transaction fails

### Issue: Backend not connecting

**Solutions:**
- Verify MongoDB is running: `mongosh` or check MongoDB Compass
- Check `server/.env` has correct `MONGODB_URI`
- Ensure backend is running on port 8080
- Check for port conflicts

### Issue: Frontend can't reach backend

**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` in `client/.env.local` is `http://localhost:8080`
- Check backend is running and accessible
- Check CORS settings in backend if needed

---

## Quick Commands Reference

```bash
# Start MongoDB (macOS)
brew services start mongodb-community

# Start Backend
cd server && go run main.go

# Start Frontend (new terminal)
cd client && npm run dev

# Install dependencies
cd client && npm install
cd server && go mod tidy

# Check MongoDB connection
mongosh
# or
mongosh "mongodb://localhost:27017/collabify"
```

---

## Environment Variables Summary

### Frontend (`client/.env.local`)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL
- `NEXT_PUBLIC_HEDERA_CONTRACT_ADDRESS` - Deployed contract address
- `NEXT_PUBLIC_HEDERA_RPC_URL` - Hedera RPC endpoint

### Backend (`server/.env`)
- `PORT` - Server port (default: 8080)
- `JWT_SECRET` - Secret for JWT tokens
- `MONGODB_URI` - MongoDB connection string
- `HEDERA_CONTRACT_ADDRESS` - Contract address (optional)
- `HEDERA_RPC_URL` - Hedera RPC endpoint (optional)

---

## Next Steps

- ✅ Test document creation and updates
- ✅ Test multi-user collaboration
- ✅ Verify documents on HashScan explorer
- ✅ Test document ownership verification
- ✅ Explore the ExcaliDraw whiteboard feature

---

## Need Help?

- Check the [README.md](./README.md) for more details
- Review [BLOCKCHAIN_INTEGRATION.md](./client/BLOCKCHAIN_INTEGRATION.md)
- Visit [Hedera Documentation](https://docs.hedera.com/)
- Check [HashScan Explorer](https://hashscan.io/testnet)

