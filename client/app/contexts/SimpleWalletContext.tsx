"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [isLoading, setIsLoading] = useState(false);

  // Auto-restore wallet connection on mount
  useEffect(() => {
    const restoreConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;
      try {
        // Check if already connected
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts && accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          const chainIdDecimal = parseInt(chainId, 16);
          setWalletConnection({
            address: accounts[0],
            chainId: chainIdDecimal,
            isConnected: true,
          });
        }
      } catch (err) {
        // Ignore
      }
    };
    restoreConnection();
  }, []);

  const connect = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      console.error("MetaMask not found");
      return false;
    }

    try {
      setIsLoading(true);

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const chainIdDecimal = parseInt(chainId, 16);

      const connection: WalletConnection = {
        address: accounts[0],
        chainId: chainIdDecimal,
        isConnected: true,
      };

      setWalletConnection(connection);

      // Store in localStorage
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", connection.address);

      return true;
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setWalletConnection(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setWalletConnection(null);
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
  };

  const value: WalletAuthContextType = {
    walletConnection,
    connect,
    disconnect,
    isLoading,
    isConnected: !!walletConnection?.isConnected,
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
};
