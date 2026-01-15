"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Dynamic import to avoid SSR issues
let blockchainUtils: typeof import("../utils/blockchain") | null = null;

interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

interface WalletAuthContextType {
  walletConnection: WalletConnection | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  isLoading: boolean;
  isConnected: boolean;
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(
  undefined
);

export const useWalletAuth = () => {
  const context = useContext(WalletAuthContext);
  if (context === undefined) {
    throw new Error("useWalletAuth must be used within a WalletAuthProvider");
  }
  return context;
};

export const WalletAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [walletConnection, setWalletConnection] =
    useState<WalletConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true);

    // Dynamically import blockchain utilities
    import("../utils/blockchain")
      .then((blockchain) => {
        blockchainUtils = blockchain;
        checkExistingConnection();
      })
      .catch((error) => {
        console.error("Failed to load blockchain utilities:", error);
        setIsLoading(false);
      });
  }, []);

  const checkExistingConnection = async () => {
    if (!blockchainUtils || !isClient) return;

    console.log(
      "WalletAuthContext: Checking for existing wallet connection..."
    );
    try {
      const address = await blockchainUtils.getConnectedAddress();
      if (address) {
        // Get full wallet connection details
        const connection = await blockchainUtils.connectWallet();
        console.log(
          "WalletAuthContext: Existing connection found:",
          connection
        );
        setWalletConnection(connection);
      } else {
        console.log("WalletAuthContext: No existing wallet connection");
        setWalletConnection(null);
      }
    } catch (error) {
      console.error("WalletAuthContext: Error checking connection:", error);
      setWalletConnection(null);
    } finally {
      console.log("WalletAuthContext: Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const connect = async (): Promise<boolean> => {
    if (!blockchainUtils || !isClient) {
      console.error("Blockchain utilities not loaded");
      return false;
    }

    try {
      console.log("WalletAuthContext: Attempting to connect wallet...");
      const connection = await blockchainUtils.connectWallet();
      console.log(
        "WalletAuthContext: Wallet connected successfully:",
        connection
      );
      setWalletConnection(connection);

      // Store connection state in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", connection.address);
      }

      return true;
    } catch (error) {
      console.error("WalletAuthContext: Wallet connection failed:", error);
      setWalletConnection(null);
      return false;
    }
  };

  const disconnect = () => {
    console.log("WalletAuthContext: Disconnecting wallet...");
    setWalletConnection(null);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("walletAddress");
    }

    console.log("WalletAuthContext: Wallet disconnected");
  };

  const value: WalletAuthContextType = {
    walletConnection,
    connect,
    disconnect,
    isLoading,
    isConnected: !!walletConnection?.isConnected,
  };

  // Don't render until client-side
  if (!isClient) {
    return (
      <WalletAuthContext.Provider
        value={{
          walletConnection: null,
          connect: async () => false,
          disconnect: () => {},
          isLoading: true,
          isConnected: false,
        }}
      >
        {children}
      </WalletAuthContext.Provider>
    );
  }

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
};
