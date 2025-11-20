# DeCollab 🌐

> **Decentralized Real-Time Collaboration** — Own your work. Collaborate globally. Trust the blockchain. DeCollab is a decentralized platform for real-time document and whiteboard collaboration. Your work is secured on the blockchain, accessible from anywhere, and owned by you. No central servers, no limits—just pure, peer-powered creation.

## 🌟 Features

### 📝 **DeCollab Docs** — Decentralized Document Editor

- **On-chain real-time editing** with live cursor tracking
- **Multi-user collaboration** with instant updates
- **Decentralized storage** — Own your documents, access from anywhere
- **Personal on-chain library** — Managed by your wallet
- **Cross-device sync** — Work seamlessly across all devices
- **Wallet-based authentication** — No email, no passwords

### 🎨 **DeCollab Whiteboard** — Decentralized Whiteboard _(Beta)_

- **Interactive whiteboard** for diagrams and sketches
- **On-chain real-time collaboration** _(Beta)_
- **Multi-user cursors** — See where others are working
- **Decentralized save** — Store drawings on-chain
- **Personal drawings library** — Access your creations anywhere

### 🔐 **Authentication & Security**

- **Wallet-based authentication**
- **No central authority** — You own your data
- **Cryptographic security**

### ☁️ **Decentralized Features**

- **Blockchain & IPFS integration** for reliable, censorship-resistant storage
- **Personal workspace** for each wallet

## 🛠️ Tech Stack

### Blockchain & Backend

- **Rootstock (RSK) Smart Contracts** — Document metadata and ownership
- **Go** — Backend API for off-chain features
- **WebSockets** — Real-time bidirectional communication
- **IPFS/Supabase** — Decentralized document and drawing storage

### Frontend

- **Next.js 14** — React framework with App Router
- **TypeScript** — Type-safe JavaScript
- **Tailwind CSS** — Utility-first CSS framework
- **Web3.js** — Blockchain interaction

## 🚀 Getting Started

### Prerequisites

- **Go** 1.19+ installed
- **Node.js** 18+ installed
- **MongoDB** database (local or cloud)

### 🖥️ Backend & Blockchain Setup

1. **Navigate to server directory**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   go mod tidy
   ```

3. **Set up environment variables**
   Create a `.env` file in the server directory:

   ```env

   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=8080
   # Blockchain config
   RSK_CONTRACT_ADDRESS=your_contract_address
   RSK_RPC_URL=https://public-node.testnet.rsk.co
   ```

4. **Run the server**
   ```bash
   go run main.go
   ```
   Server will start on `http://localhost:8080`

### 🌐 Frontend Setup

1. **Navigate to client directory**

   ```bash
   cd client
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the client directory:

   ```env

   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXT_PUBLIC_WS_URL=ws://localhost:8080
   NEXT_PUBLIC_RSK_CONTRACT_ADDRESS=your_contract_address
   NEXT_PUBLIC_RSK_RPC_URL=https://public-node.testnet.rsk.co
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Frontend will start on `http://localhost:3000`

## 🎯 Usage

### Creating a New Session

1. **Visit the homepage**
2. **Choose your tool**: Doc Online or ExcaliDraw
3. **Click "Create New Session"**
4. **Start collaborating** - Share the URL with others

### Joining an Existing Session

1. **Get the session ID** from a collaborator
2. **Click "Join Existing Session"**
3. **Enter the session ID**
4. **Start collaborating** in real-time

### Managing Your Work

1. **Sign in** to access personal features
2. **View your saved documents** and drawings
3. **Access your work** from any device
4. **Organize your personal library**

### 📁 Project Structure

```
Collabify/
├── server/           # Go backend
│   ├── main.go      # Main server file
│   ├── auth/        # Authentication handlers
│   ├── docs/        # Document management
│   ├── drawings/    # Drawing management
│   └── socket/      # WebSocket handlers
└── client/          # Next.js frontend
    ├── app/         # Next.js App Router
    ├── components/  # React components
    ├── contexts/    # React contexts
    └── public/      # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Yash Raj**

- LinkedIn: [@yash-raj-in](https://www.linkedin.com/in/yash-raj-in/)
- Twitter: [@ya_shtwt](https://x.com/ya_shtwt)
- YouTube: [@yashraj.10](https://www.youtube.com/@yashraj.10)

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

<div align="center">
   <p>Built with ❤️ by <strong>Ya.sh</strong></p>
   <p><em>Decentralized Real-Time Collaboration</em></p>
</div>
