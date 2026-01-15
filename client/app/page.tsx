"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "./contexts/SimpleWalletContext";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const {
    walletConnection,
    connect,
    disconnect,
    isConnected,
    user,
    isLoading,
  } = useWalletAuth();
  const [joinSessionId, setJoinSessionId] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinType, setJoinType] = useState<"excalidraw" | "doc">("excalidraw");
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: string;
      top: string;
      animationDelay: string;
      animationDuration: string;
    }>
  >([]);

  useEffect(() => {
    // Generate particles on client-side only to avoid hydration mismatch
    const generatedParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  const generateId = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const handleConnect = async () => {
    const connected = await connect();
    if (connected) {
      // Wait a bit for user state to update
      setTimeout(() => {
        if (!user) {
          router.push("/register");
        }
      }, 500);
    }
  };

  const createNewSession = async (type: "excalidraw" | "doc") => {
    if (!isConnected || !walletConnection) {
      // Show wallet connection prompt
      const connected = await connect();
      if (!connected) {
        return; // User cancelled or connection failed
      }
    }

    // Check if user is registered
    if (!user) {
      // Redirect to registration page
      const sessionId = generateId();
      router.push(
        `/register?redirect=${encodeURIComponent(`/${type}/${sessionId}`)}`
      );
      return;
    }

    const sessionId = generateId();
    router.push(`/${type}/${sessionId}`);
  };

  const joinSession = async () => {
    if (!joinSessionId.trim()) return;

    if (!isConnected || !walletConnection) {
      // Show wallet connection prompt
      const connected = await connect();
      if (!connected) {
        return; // User cancelled or connection failed
      }
    }

    // Check if user is registered
    if (!user) {
      // Redirect to registration page
      router.push(
        `/register?redirect=${encodeURIComponent(
          `/${joinType}/${joinSessionId.trim()}`
        )}`
      );
      setShowJoinModal(false);
      setJoinSessionId("");
      return;
    }

    router.push(`/${joinType}/${joinSessionId.trim()}`);
    setShowJoinModal(false);
    setJoinSessionId("");
  };

  const openJoinModal = (type: "excalidraw" | "doc") => {
    setJoinType(type);
    setShowJoinModal(true);
  };

  return (
    <div className="min-h-screen bg-pastel-blue relative overflow-hidden">
      {/* Neobrutalism Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-40 h-40 bg-pastel-pink border-4 border-black transform rotate-12"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-pastel-yellow border-4 border-black transform -rotate-12"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-pastel-purple border-4 border-black transform rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-44 h-44 bg-pastel-mint border-4 border-black transform -rotate-12"></div>
        <div className="absolute top-1/2 left-1/2 w-28 h-28 bg-pastel-orange border-4 border-black transform rotate-12"></div>
      </div>

      {/* Neobrutalism Header */}
      <header className="relative z-10 bg-pastel-yellow border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-pastel-purple border-4 border-black flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-black text-black uppercase tracking-tight">
                  DeCollab
                </h1>
                <p className="text-black/80 text-sm font-bold">
                  Decentralized Real-time Collaboration on Mantle
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isConnected && walletConnection ? (
                <div className="flex items-center gap-4">
                  {user && (
                    <button
                      onClick={() => router.push("/profile")}
                      className="neobrutal-button bg-pastel-blue px-6 py-2 text-black flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      My Profile
                    </button>
                  )}
                  <div className="neobrutal-box bg-pastel-green px-4 py-2 flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 border-2 border-black rounded-full"></div>
                    <span className="text-black font-black text-sm">
                      {walletConnection.address.substring(0, 6)}...
                      {walletConnection.address.substring(
                        walletConnection.address.length - 4
                      )}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="neobrutal-button bg-pastel-orange px-6 py-2 text-black"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="neobrutal-button bg-pastel-pink px-6 py-2 text-black flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-block neobrutal-box bg-pastel-lavender px-4 py-2 text-black text-sm font-black uppercase mb-6">
                🌐 Decentralized Collaboration, Redefined
              </span>
              <h1 className="text-6xl md:text-7xl font-black mb-6 text-black uppercase leading-tight">
                Collaborate
                <br />
                <span className="text-black">On-Chain. In Real-Time.</span>
              </h1>
              <p className="text-xl md:text-2xl text-black/90 max-w-3xl mx-auto leading-relaxed font-bold">
                DeCollab is a decentralized platform for real-time document and
                whiteboard collaboration powered by AI and built on the Mantle
                network. Your work is{" "}
                <span className="bg-pastel-yellow px-2 py-1 border-2 border-black font-black">
                  end-to-end encrypted
                </span>
                , secured on-chain with IPFS storage, settled with efficient MNT
                transactions, enhanced by intelligent writing assistance,
                accessible from anywhere, and owned by you. No central servers,
                no limits. just pure, private, AI-powered, peer-driven creation.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => createNewSession("doc")}
                className="neobrutal-button bg-pastel-blue px-8 py-4 text-black text-lg flex items-center justify-center gap-2"
              >
                📝 Start Writing
                <span className="relative inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-emerald-400 text-white text-xs font-black px-4 py-1.5 uppercase shadow-xl ring-2 ring-amber-300 animate-pulse">
                  AI ✨
                </span>
              </button>

              <button
                onClick={() => createNewSession("excalidraw")}
                className="neobrutal-button bg-pastel-pink px-8 py-4 text-black text-lg flex items-center justify-center gap-2"
              >
                🎨 Start Drawing
                <span className="bg-pastel-orange border-2 border-black text-black text-xs font-black px-2 py-1 uppercase">
                  Beta
                </span>
              </button>
            </div>

            {/* Floating Scroll Indicator */}
            <div className="flex justify-center">
              <div
                className="animate-bounce cursor-pointer group flex flex-col items-center"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <div className="neobrutal-box bg-pastel-yellow p-3 w-14 h-14 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
                <span className="text-black text-sm font-black mt-2 uppercase">
                  Explore Features
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-black uppercase mb-6">
                Why DeCollab?
              </h2>
              <p className="text-xl text-black/90 max-w-2xl mx-auto font-bold">
                Own your work. Collaborate globally. Trust the Mantle network.
              </p>
            </div>

            {/* AI Features Highlight */}
            <div className="neobrutal-box bg-pastel-lavender p-8 mb-16">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-emerald-400 px-6 py-2 border-4 border-black text-white mb-4 shadow-xl ring-2 ring-amber-300 animate-pulse">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  <span className="font-black text-sm uppercase tracking-wide">
                    AI-POWERED WRITING
                  </span>
                </div>
                <h3 className="text-4xl font-black text-black uppercase mb-4">
                  Intelligent Writing Assistant Built-In
                </h3>
                <p className="text-black/90 text-lg max-w-2xl mx-auto font-bold">
                  Transform your writing with advanced AI features. From
                  rewriting and expanding text to grammar fixes and smart
                  continuations all integrated seamlessly into your
                  collaborative workspace.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="neobrutal-box bg-pastel-pink p-6">
                  <div className="text-3xl mb-3">🔄</div>
                  <h4 className="text-black font-black mb-2 uppercase">
                    Smart Rewriting
                  </h4>
                  <p className="text-black/80 text-sm font-bold">
                    Instantly rewrite any text with improved clarity and style
                  </p>
                </div>

                <div className="neobrutal-box bg-pastel-blue p-6">
                  <div className="text-3xl mb-3">✍️</div>
                  <h4 className="text-black font-black mb-2 uppercase">
                    Continue Writing
                  </h4>
                  <p className="text-black/80 text-sm font-bold">
                    AI continues your thoughts and completes your sentences
                    naturally
                  </p>
                </div>

                <div className="neobrutal-box bg-pastel-yellow p-6">
                  <div className="text-3xl mb-3">📝</div>
                  <h4 className="text-black font-black mb-2 uppercase">
                    Smart Summarize
                  </h4>
                  <p className="text-black/80 text-sm font-bold">
                    Condense long text into clear, concise summaries
                  </p>
                </div>

                <div className="neobrutal-box bg-pastel-mint p-6">
                  <div className="text-3xl mb-3">📈</div>
                  <h4 className="text-black font-black mb-2 uppercase">
                    Expand Ideas
                  </h4>
                  <p className="text-black/80 text-sm font-bold">
                    Add depth and detail to your concepts with AI expansion
                  </p>
                </div>

                <div className="neobrutal-box bg-pastel-orange p-6">
                  <div className="text-3xl mb-3">✅</div>
                  <h4 className="text-black font-black mb-2 uppercase">
                    Grammar Fix
                  </h4>
                  <p className="text-black/80 text-sm font-bold">
                    Automatically correct grammar and improve readability
                  </p>
                </div>

                <div className="neobrutal-box bg-pastel-purple p-6">
                  <div className="text-3xl mb-3">💬</div>
                  <h4 className="text-black font-black mb-2 uppercase">
                    AI Chat Assistant
                  </h4>
                  <p className="text-black/80 text-sm font-bold">
                    Ask questions and get help with your document content
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Cards - 3x2 Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Row 1 */}

              <div className="neobrutal-box bg-pastel-pink p-8">
                <div className="w-20 h-20 bg-pastel-purple border-4 border-black flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black uppercase mb-4">
                  On-Chain Real-time Collaboration
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  All edits and sessions are secured and timestamped on the
                  blockchain. Experience true ownership and transparency as you
                  collaborate live with your team.
                </p>
              </div>

              <div className="neobrutal-box bg-pastel-mint p-8">
                <div className="w-20 h-20 bg-pastel-green border-4 border-black flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1 0h4m-4 0V4h4v3"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black uppercase mb-4">
                  IPFS Decentralized Storage
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  Your documents and drawings are stored on IPFS (InterPlanetary
                  File System), a decentralized storage network. No single point
                  of failure, no vendor lock-in just your data, always
                  accessible and permanently distributed.
                </p>
              </div>

              <div className="neobrutal-box bg-pastel-yellow p-8">
                <div className="w-20 h-20 bg-pastel-orange border-4 border-black flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black uppercase mb-4">
                  End-to-End Encryption
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  Your data is encrypted before it leaves your device. Only you
                  and your collaborators can access your content. Complete
                  privacy and security guaranteed. no one else can read your
                  work, not even us.
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="neobrutal-box bg-pastel-blue p-8">
                <div className="w-20 h-20 bg-pastel-yellow border-4 border-black flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black uppercase mb-4">
                  Blockchain Storage
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  All documents are anchored to the Mantle blockchain.
                  Immutable, timestamped, and permanently stored with
                  MNT-secured transactions. Authenticate with your wallet no
                  email, no passwords just cryptographic security.
                </p>
              </div>
              <div className="neobrutal-box bg-pastel-orange p-8">
                <div className="w-20 h-20 bg-pastel-yellow border-4 border-black flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1a2 2 0 011 1v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black uppercase mb-4">
                  Real-Time Collaboration
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  Collaborate in real-time with live cursor tracking and instant
                  updates. See what others are typing or drawing as it happens.
                  WebSocket-powered sync for seamless teamwork.
                </p>
              </div>

              <div className="neobrutal-box bg-pastel-lavender p-8">
                <div className="w-20 h-20 bg-pastel-purple border-4 border-black flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-black uppercase mb-4">
                  Multi-user, Borderless
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  Collaborate with anyone, anywhere. Share session links and see
                  everyone&apos;s edits in real-time no accounts, just wallets.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Collaboration Tools */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-black uppercase mb-6">
                Get Started!
              </h2>
              <p className="text-xl text-black/90 max-w-2xl mx-auto font-bold">
                Pick your tool and start collaborating on-chain
              </p>
            </div>

            {/* Enhanced Options Cards */}
            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Doc Online Option */}
              <div className="neobrutal-box bg-pastel-blue p-8">
                <div className="text-center">
                  <div className="w-28 h-28 bg-pastel-mint border-4 border-black mx-auto mb-8 flex items-center justify-center">
                    <svg
                      className="w-14 h-14 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-black text-black uppercase mb-4">
                    DeCollab Docs
                  </h2>
                  <p className="text-black/90 mb-8 leading-relaxed text-lg font-bold">
                    Decentralized document editor with on-chain saving. Write,
                    edit, and own your documents. Access your work from any
                    device and collaborate in real-time with live cursor
                    tracking.
                  </p>
                  <div className="flex justify-center flex-wrap gap-3 text-sm mb-8">
                    <span className="neobrutal-box bg-pastel-green px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      Live editing
                    </span>
                    <span className="neobrutal-box bg-pastel-orange px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      Live cursors
                    </span>
                    <span className="neobrutal-box bg-pastel-mint px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      Blockchain save
                    </span>
                    <span className="neobrutal-box bg-pastel-yellow px-3 py-1 text-black font-black text-xs uppercase border-2 border-black shadow-lg">
                      🔒 End-to-End Encrypted
                    </span>
                    <span className="neobrutal-box bg-pastel-blue px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      AI-powered
                    </span>
                  </div>
                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={() => createNewSession("doc")}
                      className="w-full neobrutal-button bg-pastel-mint py-4 px-6 text-black text-lg font-black uppercase"
                    >
                      📝 Create New Session
                    </button>
                    <button
                      onClick={() => openJoinModal("doc")}
                      className="w-full neobrutal-button bg-pastel-blue py-4 px-6 text-black text-lg font-black uppercase"
                    >
                      📎 Join Existing Session
                    </button>
                  </div>

                  {/* Doc Online Demo GIF */}
                  <div className="mt-8 rounded-2xl overflow-hidden border border-white/20 shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-500">
                    <Image
                      src="/doc.gif"
                      alt="Doc Online Demo - Collaborative document editing in action"
                      width={400}
                      height={250}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: "250px" }}
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              {/* ExcaliDraw Option */}
              <div className="neobrutal-box bg-pastel-pink p-8">
                <div className="text-center">
                  <div className="w-28 h-28 bg-pastel-purple border-4 border-black mx-auto mb-8 flex items-center justify-center">
                    <svg
                      className="w-14 h-14 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-4xl font-black text-black uppercase mb-4 flex items-center justify-center gap-3">
                    DeCollab Whiteboard
                    <span className="neobrutal-box bg-pastel-orange px-2 py-1 text-black text-xs font-black uppercase">
                      Beta
                    </span>
                  </h2>
                  <p className="text-black/90 mb-8 leading-relaxed text-lg font-bold">
                    Decentralized whiteboard for diagrams, sketches, and visual
                    brainstorms. Save your drawings on-chain and access them
                    from anywhere.{" "}
                    <span className="text-black font-black">
                      Real-time collaboration features are in beta.
                    </span>
                  </p>
                  <div className="flex justify-center flex-wrap gap-3 text-sm mb-8">
                    <span className="neobrutal-box bg-pastel-orange px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      Realtime sync(Beta)
                    </span>
                    <span className="neobrutal-box bg-pastel-mint px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      Multiuser cursors
                    </span>
                    <span className="neobrutal-box bg-pastel-purple px-3 py-1 text-black font-black text-xs uppercase">
                      <div className="w-2 h-2 bg-black inline-block mr-2"></div>
                      Blockchain save
                    </span>
                    <span className="neobrutal-box bg-pastel-yellow px-3 py-1 text-black font-black text-xs uppercase border-2 border-black shadow-lg">
                      🔒 End-to-End Encrypted
                    </span>
                  </div>
                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={() => createNewSession("excalidraw")}
                      className="w-full neobrutal-button bg-pastel-purple py-4 px-6 text-black text-lg font-black uppercase"
                    >
                      🎨 Create New Session
                    </button>
                    <button
                      onClick={() => openJoinModal("excalidraw")}
                      className="w-full neobrutal-button bg-pastel-lavender py-4 px-6 text-black text-lg font-black uppercase"
                    >
                      📎 Join Existing Session
                    </button>
                  </div>

                  {/* ExcaliDraw Demo GIF */}
                  <div className="mt-8 rounded-2xl overflow-hidden border border-white/20 shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-500">
                    <Image
                      src="/excali.gif"
                      alt="ExcaliDraw Demo - Collaborative whiteboard in action"
                      width={400}
                      height={250}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: "250px" }}
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center mt-16">
              <div className="neobrutal-box bg-pastel-yellow p-8 max-w-2xl mx-auto">
                <h3 className="text-3xl font-black text-black uppercase mb-4">
                  Create, Own & Collaborate
                </h3>
                <p className="text-black/90 leading-relaxed font-bold">
                  Start creating instantly. Your work is saved on-chain and
                  owned by your wallet. Share session links for instant
                  collaboration or access your decentralized library from any
                  device.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-pastel-purple border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-pastel-pink border-4 border-black flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-black uppercase">
                  DeCollab
                </h3>
              </div>
              <p className="text-black/90 mb-6 font-bold">
                Decentralized Real-Time Collaboration. Create, own, and share
                documents and drawings on-chain.
              </p>
            </div>

            <div>
              <h4 className="text-xl font-black text-black uppercase mb-4">
                Connect with the Creator
              </h4>
              <div className="flex space-x-4">
                <a
                  href="https://www.linkedin.com/in/yash-raj-in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neobrutal-box bg-pastel-blue w-12 h-12 flex items-center justify-center"
                  title="LinkedIn"
                >
                  <svg
                    className="w-6 h-6 text-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/ya_shtwt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neobrutal-box bg-pastel-yellow w-12 h-12 flex items-center justify-center"
                  title="X (Twitter)"
                >
                  <svg
                    className="w-6 h-6 text-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@yashraj.10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neobrutal-box bg-pastel-pink w-12 h-12 flex items-center justify-center"
                  title="YouTube"
                >
                  <svg
                    className="w-6 h-6 text-black"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t-4 border-black pt-8 text-center">
            <p className="text-black/80 text-sm font-black">
              © 2025 DeCollab. Built with ❤️ by Yash and Vansh!
            </p>
          </div>
        </div>
      </footer>

      {/* Enhanced Join Session Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="neobrutal-box bg-pastel-yellow p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div
                className={`w-20 h-20 mx-auto mb-4 border-4 border-black flex items-center justify-center ${
                  joinType === "excalidraw"
                    ? "bg-pastel-pink"
                    : "bg-pastel-blue"
                }`}
              >
                <svg
                  className="w-10 h-10 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  {joinType === "excalidraw" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  )}
                </svg>
              </div>
              <h3 className="text-3xl font-black text-black uppercase mb-2">
                Join {joinType === "excalidraw" ? "ExcaliDraw" : "Doc Online"}{" "}
                Session
              </h3>
              <p className="text-black/90 font-bold">
                Enter the session ID to join an existing collaborative session.
              </p>
            </div>
            <input
              type="text"
              value={joinSessionId}
              onChange={(e) => setJoinSessionId(e.target.value)}
              placeholder="Enter session ID..."
              className="w-full px-4 py-4 neobrutal-box bg-white border-4 border-black outline-none mb-6 text-black placeholder-black/60 text-center font-mono font-black"
              onKeyPress={(e) => e.key === "Enter" && joinSession()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 neobrutal-button bg-pastel-orange px-6 py-3 text-black font-black uppercase"
              >
                Cancel
              </button>
              <button
                onClick={joinSession}
                disabled={!joinSessionId.trim()}
                className={`flex-1 neobrutal-button px-6 py-3 text-black font-black uppercase ${
                  joinSessionId.trim()
                    ? joinType === "excalidraw"
                      ? "bg-pastel-pink"
                      : "bg-pastel-mint"
                    : "bg-pastel-yellow opacity-50 cursor-not-allowed"
                }`}
              >
                Join Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
