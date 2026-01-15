"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { API_ENDPOINTS } from "../config/api";

interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  walletAddress: string;
}

interface WalletAuthContextType {
  walletConnection: WalletConnection | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  isLoading: boolean;
  isConnected: boolean;
  user: User | null;
  checkUserRegistration: (walletAddress: string) => Promise<boolean>;
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
  const [user, setUser] = useState<User | null>(null);
  const hasCheckedRef = useRef(false);

  // Check if user is registered in MongoDB
  const checkUserRegistration = async (
    walletAddress: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.WALLET_CHECK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (data.exists && data.user) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        return true;
      } else {
        setUser(null);
        localStorage.removeItem("user");
        return false;
      }
    } catch (error) {
      console.error("Error checking user registration:", error);
      return false;
    }
  };

  // Auto-restore wallet connection and user data on mount
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const init = async () => {
      if (typeof window === "undefined" || !window.ethereum) {
        setIsLoading(false);
        return;
      }

      // Check if user manually disconnected
      const manuallyDisconnected = localStorage.getItem("manuallyDisconnected");
      if (manuallyDisconnected === "true") {
        setIsLoading(false);
        return;
      }

      try {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts && accounts.length > 0) {
          const chainId = (await window.ethereum.request({
            method: "eth_chainId",
          })) as string;
          setWalletConnection({
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            isConnected: true,
          });

          // Check DB once
          await checkUserRegistration(accounts[0]);
        }
      } catch (err) {
        console.error("Error:", err);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const connect = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.ethereum) {
      console.error("MetaMask not found");
      return false;
    }

    try {
      setIsLoading(true);

      // Request account access
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chain ID
      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;
      const chainIdDecimal = parseInt(chainId, 16);

      const connection: WalletConnection = {
        address: accounts[0],
        chainId: chainIdDecimal,
        isConnected: true,
      };

      setWalletConnection(connection);
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", connection.address);
      localStorage.removeItem("manuallyDisconnected");

      // Check DB once
      await checkUserRegistration(connection.address);

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
    setUser(null);
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.setItem("manuallyDisconnected", "true");
  };

  const value: WalletAuthContextType = {
    walletConnection,
    connect,
    disconnect,
    isLoading,
    isConnected: !!walletConnection?.isConnected,
    user,
    checkUserRegistration,
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
};
