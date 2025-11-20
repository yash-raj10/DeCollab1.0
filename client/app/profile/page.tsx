"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "../contexts/SimpleWalletContext";

export default function ProfilePage() {
  const router = useRouter();
  const { walletConnection, user, isConnected, disconnect } = useWalletAuth();

  useEffect(() => {
    // Redirect if not connected
    if (!isConnected || !walletConnection) {
      router.push("/");
    }
  }, [isConnected, walletConnection, router]);

  if (!walletConnection || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-32 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "6s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  DeCollab
                </h1>
                <p className="text-white/70 text-sm">My Profile</p>
              </div>
            </button>

            <button
              onClick={disconnect}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 font-medium border border-white/30 hover:border-white/50"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
            <p className="text-white/70">Your Profile</p>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            {/* Username */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <label className="block text-white/60 text-sm font-medium mb-2">
                Username
              </label>
              <p className="text-white text-lg font-semibold">{user.name}</p>
            </div>

            {/* Email */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <label className="block text-white/60 text-sm font-medium mb-2">
                Email Address
              </label>
              <p className="text-white text-lg font-semibold">{user.email}</p>
            </div>

            {/* Wallet Address */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <label className="block text-white/60 text-sm font-medium mb-2">
                Wallet Address
              </label>
              <div className="flex items-center justify-between">
                <p className="text-white text-lg font-mono break-all">
                  {walletConnection.address}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletConnection.address);
                  }}
                  className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-8 border-t border-white/20">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
