"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "../contexts/SimpleWalletContext";
import { getUserDocumentsFromChain, getDocumentFromChain } from "../utils/blockchain";
import { getFromIPFS } from "../utils/ipfs";
import { getEncryptionKey, generateEncryptionKey, storeEncryptionKey, decryptData } from "../utils/encryption";

interface BlockchainDocument {
  docId: string;
  cid: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { walletConnection, user, isConnected, disconnect } = useWalletAuth();
  const [userDocuments, setUserDocuments] = useState<
    Array<{ docId: string; document: BlockchainDocument }>
  >([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "drawings">("documents");

  useEffect(() => {
    // Redirect if not connected
    if (!isConnected || !walletConnection) {
      router.push("/");
    }
  }, [isConnected, walletConnection, router]);

  useEffect(() => {
    // Load user documents when wallet is connected
    if (isConnected && walletConnection?.address) {
      loadUserDocuments();
    }
  }, [isConnected, walletConnection]);

  const loadUserDocuments = async () => {
    if (!walletConnection?.address) return;

    setIsLoadingDocs(true);
    try {
      const docs = await getUserDocumentsFromChain(walletConnection.address);
      setUserDocuments(docs);
    } catch (error) {
      console.error("Failed to load user documents:", error);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Separate documents and drawings (lazy - only when tab is clicked)
  const separateDocumentsAndDrawings = async () => {
    const documents: Array<{ docId: string; document: BlockchainDocument }> = [];
    const drawings: Array<{ docId: string; document: BlockchainDocument }> = [];

    if (!walletConnection?.address) {
      return { documents: userDocuments, drawings: [] };
    }

    // Process documents in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < userDocuments.length; i += batchSize) {
      const batch = userDocuments.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ docId, document }) => {
          try {
            const docMetadata = await getDocumentFromChain(docId);
            if (docMetadata && docMetadata.cid) {
              const encryptedContent = await getFromIPFS(docMetadata.cid);

              // Check if content looks like it might be a drawing (quick check)
              // Drawings are JSON with "elements" key, so they're usually longer
              // For now, we'll try to decrypt a small portion or check the structure

              let encryptionKey = getEncryptionKey(docId, walletConnection.address);
              if (!encryptionKey) {
                const collaborators = [docMetadata.createdBy];
                encryptionKey = generateEncryptionKey(collaborators);
                storeEncryptionKey(docId, encryptionKey, collaborators);
              }

              try {
                const decryptedContent = await decryptData(encryptedContent, encryptionKey);

                // Quick check: if it starts with { and contains "elements", it's likely a drawing
                if (decryptedContent && decryptedContent.trim().startsWith("{") && decryptedContent.includes('"elements"')) {
                  try {
                    const parsedContent = JSON.parse(decryptedContent);
                    if (parsedContent.elements && parsedContent.appState) {
                      drawings.push({ docId, document });
                      return;
                    }
                  } catch (e) {
                    // Not valid JSON, treat as document
                    console.warn(`Could not parse as JSON for ${docId}:`, e);
                  }
                }

                // Default to document
                documents.push({ docId, document });
              } catch (e) {
                // If decryption fails, assume it's a text document
                // decryptData now returns the original data on failure, so we can still process it
                console.warn(`Could not process ${docId}, treating as document:`, e);
                documents.push({ docId, document });
              }
            } else {
              documents.push({ docId, document });
            }
          } catch (error) {
            // On error, default to document
            console.warn(`Error processing ${docId}, treating as document:`, error);
            documents.push({ docId, document });
          }
        })
      );
    }

    return { documents, drawings };
  };

  const [separatedDocs, setSeparatedDocs] = useState<{
    documents: Array<{ docId: string; document: BlockchainDocument }>;
    drawings: Array<{ docId: string; document: BlockchainDocument }>;
  }>({ documents: [], drawings: [] });

  // Separate documents and drawings when tab changes or documents load
  useEffect(() => {
    if (userDocuments.length > 0 && walletConnection?.address) {
      setIsLoadingDocs(true);
      separateDocumentsAndDrawings()
        .then(setSeparatedDocs)
        .catch((error) => {
          console.error("Error separating documents:", error);
          // On error, treat all as documents
          setSeparatedDocs({ documents: userDocuments, drawings: [] });
        })
        .finally(() => setIsLoadingDocs(false));
    } else {
      setSeparatedDocs({ documents: [], drawings: [] });
    }
  }, [userDocuments, walletConnection?.address]);

  const handleDocumentClick = async (docId: string, document: BlockchainDocument) => {
    // Try to determine if this is a drawing or text document
    // by checking the content structure
    try {
      if (!walletConnection?.address) {
        router.push(`/doc/${docId}`);
        return;
      }

      // Get document from blockchain
      const docMetadata = await getDocumentFromChain(docId);
      if (docMetadata && docMetadata.cid) {
        // Get encrypted content
        const encryptedContent = await getFromIPFS(docMetadata.cid);

        // Get encryption key
        let encryptionKey = getEncryptionKey(docId, walletConnection.address);
        if (!encryptionKey) {
          const collaborators = [docMetadata.createdBy];
          encryptionKey = generateEncryptionKey(collaborators);
          storeEncryptionKey(docId, encryptionKey, collaborators);
        }

        // Decrypt content
        try {
          const decryptedContent = await decryptData(encryptedContent, encryptionKey);
          const parsedContent = JSON.parse(decryptedContent);

          // Check if it's a drawing (has elements and appState)
          if (parsedContent.elements && parsedContent.appState) {
            // It's a drawing - route to excalidraw
            router.push(`/excalidraw/${docId}`);
            return;
          }
        } catch (e) {
          // If decryption fails or it's not JSON, assume it's a text document
          console.log("Could not parse as drawing, routing to doc editor");
        }
      }
    } catch (error) {
      console.error("Error determining document type:", error);
    }

    // Default to text document editor
    router.push(`/doc/${docId}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!walletConnection || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pastel-blue">
      {/* Neobrutalism Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-pastel-pink border-4 border-black transform rotate-12"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-pastel-yellow border-4 border-black transform -rotate-12"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-pastel-purple border-4 border-black transform rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-pastel-mint border-4 border-black transform -rotate-12"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-pastel-yellow border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
            >
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
                <p className="text-black/80 text-sm font-bold">My Profile</p>
              </div>
            </button>

            <button
              onClick={disconnect}
              className="neobrutal-button bg-pastel-orange px-6 py-2 text-black"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="neobrutal-box bg-pastel-yellow p-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-28 h-28 bg-pastel-pink border-4 border-black flex items-center justify-center mx-auto mb-4">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-black uppercase mb-2">{user.name}</h1>
            <p className="text-black/80 font-bold">Your Profile</p>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            {/* Username */}
            <div className="neobrutal-box bg-pastel-blue p-6">
              <label className="block text-black/70 text-sm font-black uppercase mb-2">
                Username
              </label>
              <p className="text-black text-lg font-black">{user.name}</p>
            </div>

            {/* Email */}
            <div className="neobrutal-box bg-pastel-mint p-6">
              <label className="block text-black/70 text-sm font-black uppercase mb-2">
                Email Address
              </label>
              <p className="text-black text-lg font-black">{user.email}</p>
            </div>

            {/* Wallet Address */}
            <div className="neobrutal-box bg-pastel-purple p-6">
              <label className="block text-black/70 text-sm font-black uppercase mb-2">
                Wallet Address
              </label>
              <div className="flex items-center justify-between">
                <p className="text-black text-lg font-mono break-all font-black">
                  {walletConnection.address}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletConnection.address);
                  }}
                  className="ml-4 neobrutal-button bg-pastel-pink p-2"
                  title="Copy to clipboard"
                >
                  <svg
                    className="w-5 h-5 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs for Documents and Drawings */}
          <div className="mt-8 pt-8 border-t-4 border-black">
            {/* Tab Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`neobrutal-button px-6 py-3 text-black font-black uppercase ${activeTab === "documents" ? "bg-pastel-blue" : "bg-pastel-yellow"
                    }`}
                >
                  📝 Documents
                </button>
                <button
                  onClick={() => setActiveTab("drawings")}
                  className={`neobrutal-button px-6 py-3 text-black font-black uppercase ${activeTab === "drawings" ? "bg-pastel-pink" : "bg-pastel-yellow"
                    }`}
                >
                  🎨 Drawings
                </button>
              </div>
              <button
                onClick={loadUserDocuments}
                disabled={isLoadingDocs}
                className={`neobrutal-button px-4 py-2 text-black flex items-center space-x-2 ${isLoadingDocs ? "bg-pastel-yellow opacity-50 cursor-not-allowed" : "bg-pastel-green"
                  }`}
                title="Refresh"
              >
                <svg
                  className={`w-4 h-4 ${isLoadingDocs ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="font-black">{isLoadingDocs ? "Loading..." : "Refresh"}</span>
              </button>
            </div>

            {/* Tab Content */}
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin"></div>
                <span className="ml-3 text-black/80 font-bold">Loading...</span>
              </div>
            ) : (
              <>
                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <>
                    {separatedDocs.documents.length === 0 ? (
                      <div className="neobrutal-box bg-pastel-blue p-8 text-center">
                        <svg
                          className="w-16 h-16 text-black/50 mx-auto mb-4"
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
                        <p className="text-black/80 text-lg font-bold">
                          No documents found. Create your first document to get started!
                        </p>
                        <button
                          onClick={() => router.push("/doc")}
                          className="mt-4 neobrutal-button bg-pastel-pink px-6 py-2 text-black font-black uppercase"
                        >
                          Create New Document
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {separatedDocs.documents.map(({ docId, document }, index) => (
                          <button
                            key={docId}
                            onClick={() => handleDocumentClick(docId, document)}
                            className={`neobrutal-box p-6 text-left group cursor-pointer ${index % 4 === 0 ? "bg-pastel-pink" :
                              index % 4 === 1 ? "bg-pastel-blue" :
                                index % 4 === 2 ? "bg-pastel-mint" :
                                  "bg-pastel-lavender"
                              }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 border-4 border-black flex items-center justify-center ${index % 4 === 0 ? "bg-pastel-purple" :
                                  index % 4 === 1 ? "bg-pastel-yellow" :
                                    index % 4 === 2 ? "bg-pastel-orange" :
                                      "bg-pastel-green"
                                  }`}>
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
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-black font-black text-lg uppercase">
                                    Document {docId.substring(0, 8)}...
                                  </h3>
                                  <p className="text-black/70 text-sm font-mono font-bold">
                                    {docId}
                                  </p>
                                </div>
                              </div>
                              <svg
                                className="w-5 h-5 text-black group-hover:translate-x-1 transition-all"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t-2 border-black">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-black/70 font-bold">Created:</span>
                                <span className="text-black font-black">
                                  {formatDate(document.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-black/70 font-bold">Last Updated:</span>
                                <span className="text-black font-black">
                                  {formatDate(document.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Drawings Tab */}
                {activeTab === "drawings" && (
                  <>
                    {separatedDocs.drawings.length === 0 ? (
                      <div className="neobrutal-box bg-pastel-pink p-8 text-center">
                        <svg
                          className="w-16 h-16 text-black/50 mx-auto mb-4"
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
                        <p className="text-black/80 text-lg font-bold">
                          No drawings found. Create your first drawing to get started!
                        </p>
                        <button
                          onClick={() => router.push("/excalidraw")}
                          className="mt-4 neobrutal-button bg-pastel-purple px-6 py-2 text-black font-black uppercase"
                        >
                          Create New Drawing
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {separatedDocs.drawings.map(({ docId, document }, index) => (
                          <button
                            key={docId}
                            onClick={() => handleDocumentClick(docId, document)}
                            className={`neobrutal-box p-6 text-left group cursor-pointer ${index % 4 === 0 ? "bg-pastel-pink" :
                              index % 4 === 1 ? "bg-pastel-blue" :
                                index % 4 === 2 ? "bg-pastel-mint" :
                                  "bg-pastel-lavender"
                              }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 border-4 border-black flex items-center justify-center ${index % 4 === 0 ? "bg-pastel-purple" :
                                  index % 4 === 1 ? "bg-pastel-yellow" :
                                    index % 4 === 2 ? "bg-pastel-orange" :
                                      "bg-pastel-green"
                                  }`}>
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
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-black font-black text-lg uppercase">
                                    Drawing {docId.substring(0, 8)}...
                                  </h3>
                                  <p className="text-black/70 text-sm font-mono font-bold">
                                    {docId}
                                  </p>
                                </div>
                              </div>
                              <svg
                                className="w-5 h-5 text-black group-hover:translate-x-1 transition-all"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                            <div className="space-y-2 mt-4 pt-4 border-t-2 border-black">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-black/70 font-bold">Created:</span>
                                <span className="text-black font-black">
                                  {formatDate(document.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-black/70 font-bold">Last Updated:</span>
                                <span className="text-black font-black">
                                  {formatDate(document.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-8 border-t-4 border-black">
            <button
              onClick={() => router.push("/")}
              className="w-full neobrutal-button bg-pastel-pink py-3 px-6 text-black font-black uppercase text-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
