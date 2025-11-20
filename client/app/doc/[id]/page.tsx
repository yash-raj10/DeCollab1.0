"use client";
import React, { useEffect, useState } from "react";
import DocPage from "../../DocPage";
import { useWalletAuth } from "../../contexts/SimpleWalletContext";
import Link from "next/link";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const resolvedParams = React.use(params);
  const { walletConnection, isLoading } = useWalletAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until we're on the client side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-emerald-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            <span className="text-white text-lg">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-emerald-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            <span className="text-white text-lg">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!walletConnection || !walletConnection.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-emerald-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-teal-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Wallet Connection Required
          </h1>
          <p className="text-white/80 mb-6 leading-relaxed">
            You need to connect your wallet to access collaborative document
            sessions.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go to Home & Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  return <DocPage sessionId={resolvedParams.id} />;
}
