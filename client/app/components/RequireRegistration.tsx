"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWalletAuth } from "../contexts/SimpleWalletContext";

interface RequireRegistrationProps {
  children: React.ReactNode;
}

export default function RequireRegistration({
  children,
}: RequireRegistrationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { walletConnection, user, isConnected } = useWalletAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      // Skip check on registration page
      if (pathname === "/register") {
        setIsChecking(false);
        return;
      }

      // If wallet is connected but no user data, redirect to registration
      if (isConnected && walletConnection && !user) {
        const currentPath = pathname;
        router.push(`/register?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        setIsChecking(false);
      }
    };

    checkRegistration();
  }, [walletConnection, user, isConnected, pathname, router]);

  // Show loading state while checking
  if (isChecking && pathname !== "/register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Checking registration...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
