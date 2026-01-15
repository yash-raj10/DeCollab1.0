# DeCollab 🌐⚡

> **Decentralized Real-Time Collaboration** — Powered by Mantle & IPFS

**DeCollab** is a decentralized platform for real-time document and whiteboard collaboration, built on the **Mantle network**. Your work is **end-to-end encrypted**, secured on-chain with **IPFS storage**, enhanced by **AI-powered writing assistance**, and owned by you. No central servers, no limits. Just pure, private, AI-powered, peer-driven creation.

---

## 🏆 Built on Mantle

This project leverages **Mantle's** fast, secure, and sustainable blockchain technology to enable:

- ⚡ **Real-time on-chain collaboration** with instant finality
- 💰 **Efficient MNT transactions** for document anchoring
- 🔒 **Immutable timestamping** on Mantle blockchain
- 🌍 **Decentralized storage** via IPFS integration
- 🔐 **Wallet-based authentication** using Mantle accounts

---

## 🌟 Core Features

### � **End-to-End Encryption — Privacy First**

- **Client-side encryption** — Data encrypted before leaving your device
- **Zero-knowledge architecture** — We can't read your data, only you and your collaborators can
- **Wallet-based access** — Cryptographic authentication, no passwords to steal or leak
- **Complete privacy guaranteed** — No one else can read your work, not even us

### 📝 **DeCollab Docs — AI-Powered Document Editor**

- **🤖 AI Writing Assistant** — Smart rewriting, continue writing, summarize, expand ideas, grammar fixes, and AI chat
- **Real-time collaborative editing** with live cursor tracking
- **Multi-user collaboration** with instant WebSocket-powered updates
- **End-to-end encrypted** documents
- **IPFS decentralized storage** — Permanently distributed, always accessible
- **Blockchain anchoring** — Documents timestamped and secured on Mantle
- **Personal on-chain library** — Managed by your wallet
- **Cross-device sync** — Work seamlessly across all devices

### 🎨 **DeCollab Whiteboard — Decentralized Canvas** _(Beta)_

- **Interactive whiteboard** for diagrams, sketches, and visual brainstorming
- **Real-time collaboration** with multi-user cursors _(Beta)_
- **End-to-end encrypted** drawings
- **IPFS storage** — Decentralized and permanent
- **Blockchain save** — Drawings anchored to Mantle
- **Personal drawings library** — Access your creations anywhere

### ⚡ **On-Chain Real-time Collaboration**

- **Mantle blockchain integration** — All edits secured and timestamped
- **True ownership** — Your wallet controls your content
- **Transparency** — Immutable collaboration history
- **Live updates** — See what others are typing or drawing in real-time

### 🌐 **IPFS Decentralized Storage**

- **InterPlanetary File System** — Distributed, permanent storage
- **No single point of failure** — Content distributed across the network
- **No vendor lock-in** — Your data is always accessible
- **Content-addressed** — Cryptographic verification of data integrity

### 🛡️ **Blockchain Storage on Mantle**

- **Immutable records** — Documents anchored to Mantle blockchain
- **Timestamped proof** — Permanent record of creation and edits
- **MNT-secured transactions** — Fast, low-cost, and eco-friendly
- **Wallet authentication** — No email, no passwords, just cryptographic security

### 👥 **Multi-user, Borderless Collaboration**

- **Collaborate with anyone, anywhere** — Share session links instantly
- **Real-time edits** — See everyone's changes as they happen
- **No accounts required** — Just wallets for authentication
- **WebSocket-powered sync** — Seamless teamwork experience

## 🛠️ Tech Stack

### Blockchain & Decentralization

- **Mantle Network** — Fast, secure, and sustainable L2 blockchain for document anchoring
- **Mantle Smart Contracts** — Document metadata, ownership, and access control
- **IPFS (InterPlanetary File System)** — Decentralized storage for documents and drawings
- **MNT** — Native cryptocurrency for transaction fees

### Backend

- **Go** — High-performance backend API
- **WebSockets** — Real-time bidirectional communication for live collaboration
- **JWT Authentication** — Secure token-based auth

### Frontend

- **Next.js 15** — React framework with App Router
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Modern utility-first styling with Neobrutalism design
- **Ethers.js** — Mantle blockchain interaction
- **Excalidraw** — Open-source whiteboard library

### AI Integration

- **OpenAI API** — AI-powered writing assistance (rewrite, continue, summarize, expand, grammar fix)
- **AI Chat Assistant** — Context-aware document help

### Security

- **End-to-end encryption** — Client-side encryption before transmission
- **Wallet-based authentication** — Mantle wallet integration
- **Zero-knowledge architecture** — Server cannot decrypt user data

## 🎯 Usage

### 🔐 Connect Your Wallet

1. **Click "Connect Wallet"** on the homepage
2. **Approve the connection** in your Mantle wallet
3. **Register your profile** (first-time users)
4. **Start creating** — Your wallet is your identity

### 📝 Creating a New Document/Whiteboard Session

1. **Choose your tool**: DeCollab Docs or DeCollab Whiteboard
2. **Click "Create New Session"**
3. **Start creating** — Your work is automatically encrypted and saved
4. **Share the session URL** with collaborators for real-time collaboration

### 🤝 Joining an Existing Session

1. **Get the session ID** from a collaborator
2. **Click "Join Existing Session"**
3. **Enter the session ID**
4. **Collaborate in real-time** — See live cursors and instant updates

### 🤖 Using AI Writing Features (Docs Only)

1. **Select text** in your document
2. **Choose an AI action**: Rewrite, Continue, Summarize, Expand, or Fix Grammar
3. **Review AI suggestions** and accept or modify
4. **Use AI Chat** for context-aware assistance

### 💾 Saving & Accessing Your Work

1. **Auto-save** — Documents automatically saved to IPFS
2. **Blockchain anchoring** — Click save to anchor to Mantle blockchain
3. **Access your library** — View all your documents from your profile
4. **Cross-device sync** — Access from anywhere with your wallet

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

## 🎥 Demo & Links

- **Live Demo**: [Coming Soon]
- **Video Demo**: [Coming Soon]
- **Mantle Contract**: `0x80b865423DfAA4AD644871Ae11c2500Ba84e2C62` (Sepolia Testnet)

## 🌟 Key Highlights

1. **⚡ Mantle Integration** — Leverages Mantle's fast finality and low-cost transactions for document anchoring
2. **🔒 Privacy-First** — End-to-end encryption ensures complete data privacy
3. **🌐 IPFS Storage** — Decentralized, permanent storage for all content
4. **🤖 AI-Powered** — Advanced AI writing assistance integrated seamlessly
5. **🚀 Real-time Collaboration** — WebSocket-powered live editing with instant updates
6. **♻️ Sustainable** — Built on Mantle's energy-efficient blockchain
7. **💼 Production-Ready** — Full-featured application ready for real-world use

## 👨‍💻 Authors

**Yash Raj** & **Vansh**

## ⭐ Show Your Support

Give a ⭐️ if this project helped you or if you believe in decentralized collaboration!

## 🙏 Acknowledgments

- **Mantle** — For providing a fast, secure, and sustainable blockchain platform
- **IPFS** — For decentralized storage infrastructure
- **OpenAI** — For AI capabilities
- **Excalidraw** — For the amazing whiteboard integration.

---

<div align="center">
   <p>Built with ❤️ by <strong>Yash Raj & Vansh</strong></p>
   <p><em>🌐 Decentralized Real-Time Collaboration • 🔒 Privacy-First • ⚡ Powered by Mantle</em></p>
</div>
