"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { throttle, debounce } from "./utils";
import Toast from "./components/Toast";
import { buildWebSocketUrl } from "./config/api";
import { uploadToIPFS, getFromIPFS } from "./utils/ipfs";
import {
  createDocumentOnChain,
  updateDocumentOnChain,
  getDocumentFromChain,
  getUserDocumentsFromChain,
  generateDocumentId,
  getTransactionUrl,
} from "./utils/blockchain";
import { useWalletAuth } from "./contexts/SimpleWalletContext";
import TiptapEditor from "./components/TiptapEditor";

type UserDataType = {
  userId: string | null;
  userName: string | null;
  userColor: string | null;
};

interface UserCursor {
  userData: UserDataType;
  position: { x: number; y: number };
}

interface ContentPayload {
  content: string;
  position: { x: number; y: number };
  userData: UserDataType;
}

interface UserMessage {
  type: string;
  data: {
    userData: UserDataType;
  };
}

interface ContentMessage {
  type: string;
  data: ContentPayload;
}

interface DocPageProps {
  sessionId?: string;
}

interface BlockchainDoc {
  id: string;
  docId: string;
  updatedAt: string;
  content: string;
  cid: string;
  createdBy: string;
  createdAt: number;
  transactionHash?: string;
}

const DocPage: React.FC<DocPageProps> = ({ sessionId = "default" }) => {
  const router = useRouter();
  const { walletConnection, connect, disconnect, isConnected, isLoading, user } =
    useWalletAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isClient, setIsClient] = useState(false);
  const contentArea = useRef<HTMLDivElement | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const userDataRef = useRef<UserDataType>({
    userId: null,
    userName: "",
    userColor: "",
  });
  const [userCursors, setUserCursors] = useState<Array<UserCursor>>([]);
  const [users, setUsers] = useState<Array<UserDataType>>([]);
  const [currentUser, setCurrentUser] = useState<UserDataType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userDocuments, setUserDocuments] = useState<Array<BlockchainDoc>>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<BlockchainDoc | null>(null);
  const [showDocDetails, setShowDocDetails] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const throttleRef = useRef(
    throttle((payload: ContentPayload) => {
      console.log("throttle", payload);
      ws.current?.send(
        JSON.stringify({
          type: "content",
          data: payload,
        })
      );
    }, 200)
  );

  const debounceRef = useRef(
    debounce((payload: ContentPayload) => {
      console.log("debounce", payload);
      ws.current?.send(
        JSON.stringify({
          type: "content",
          data: payload,
        })
      );
    }, 400)
  );

  const applyRemoteUpdate = (remoteContent: string): void => {
    console.log(
      "applyRemoteUpdate called with content length:",
      remoteContent?.length
    );
    console.log("isClient:", isClient);

    if (!isClient) {
      console.log("Skipping update - isClient not ready");
      return;
    }

    try {
      console.log(
        "Setting editor content to:",
        remoteContent.substring(0, 100) + "..."
      );
      setEditorContent(remoteContent);
    } catch (error) {
      console.error("Error applying remote update:", error);
    }
  };

  const handleUserCursors = (data: ContentPayload) => {
    const userId = data.userData.userId;

    setUserCursors((prevCursors) => {
      // Remove previous cursor for this user
      const filterCursorPositions = prevCursors.filter(
        (items: UserCursor) => items.userData.userId !== userId
      );

      // Don't show your own cursor
      if (userDataRef.current.userId === userId) {
        return filterCursorPositions;
      }

      // Add new cursor position for this user
      const newCursor: UserCursor = {
        userData: data.userData,
        position: { ...data.position },
      };

      return [...filterCursorPositions, newCursor];
    });

    // Auto-remove cursor after 3 seconds of inactivity
    setTimeout(() => {
      setUserCursors((prevCursors) =>
        prevCursors.filter((cursor) => cursor.userData.userId !== userId)
      );
    }, 3000);
  };

  const addNewUser = (userData: UserDataType) => {
    // Don't add yourself to the users list
    if (userData.userId === userDataRef.current.userId) {
      return;
    }

    setUsers((prevUsers) => {
      // Check if user already exists to avoid duplicates
      const userExists = prevUsers.some(
        (user) => user.userId === userData.userId
      );
      if (userExists) {
        return prevUsers;
      }
      return [...prevUsers, userData];
    });
  };

  const removeUser = (userData: UserDataType) => {
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.userId !== userData.userId)
    );
  };

  const handleServerResponse = useCallback(
    (event: MessageEvent) => {
      try {
        const ParsedData = JSON.parse(event.data);
        const eventType = ParsedData.type;

        console.log("Received message:", eventType, ParsedData);

        if (eventType === "content") {
          const contentMsg = ParsedData as ContentMessage;
          console.log(
            "Content message from:",
            contentMsg.data.userData.userId,
            "My ID:",
            userDataRef.current?.userId
          );

          // Always apply remote updates if they're from a different user
          // Also apply if we don't have a userId yet (initial load)
          if (
            !userDataRef.current?.userId ||
            contentMsg.data.userData.userId !== userDataRef.current?.userId
          ) {
            console.log("Applying remote content update");
            applyRemoteUpdate(contentMsg.data.content);
            handleUserCursors(contentMsg.data);
          } else {
            console.log("Ignoring my own content message");
          }
        }

        if (eventType === "user-data") {
          const userMsg = ParsedData as UserMessage;
          userDataRef.current = userMsg.data.userData;
          console.log("My user data:", userDataRef.current);
        }

        if (eventType === "user-added") {
          const userMsg = ParsedData as UserMessage;
          addNewUser(userMsg.data.userData);
          console.log("User added:", userMsg.data.userData);
        }

        if (eventType === "user-removed") {
          const userMsg = ParsedData as UserMessage;
          removeUser(userMsg.data.userData);
          console.log("User removed:", userMsg.data.userData);
        }
      } catch (error) {
        console.error("Error parsing JSON message:", error);
        console.error("Raw message data:", event.data);
        console.error("Message length:", event.data.length);

        // Try to handle concatenated JSON messages
        try {
          const rawData = event.data;
          const messages = rawData
            .split("}{")
            .map((msg: string, index: number, array: string[]) => {
              if (index === 0 && array.length > 1) {
                return msg + "}";
              } else if (index === array.length - 1 && array.length > 1) {
                return "{" + msg;
              } else if (array.length > 1) {
                return "{" + msg + "}";
              }
              return msg;
            });

          console.log(
            "Attempting to parse",
            messages.length,
            "separate messages"
          );

          messages.forEach((messageStr: string, index: number) => {
            try {
              const ParsedData = JSON.parse(messageStr);
              console.log(`Message ${index + 1}:`, ParsedData);
              // Process the message (you can add the same logic here as above)
            } catch (parseError) {
              console.error(`Error parsing message ${index + 1}:`, parseError);
            }
          });
        } catch (splitError) {
          console.error("Error splitting concatenated messages:", splitError);
        }
      }
    },
    [isClient]
  );

  useEffect(() => {
    //(Hydration error fix)
    setIsClient(true);
    // Check if wallet is already connected
    checkWalletConnection();
  }, []);

  // Check wallet connection status
  const checkWalletConnection = async () => {
    try {
      if (walletConnection?.address) {
        // Wallet is already connected through context
        console.log("Wallet already connected:", walletConnection.address);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  // Connect wallet function
  const handleConnectWallet = async () => {
    try {
      showToast("Connecting wallet...", "info");
      await connect();
      showToast(
        `Wallet connected: ${walletConnection?.address?.substring(0, 8)}...`,
        "success"
      );
      console.log("Wallet connected:", walletConnection);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to connect wallet",
        "error"
      );
    }
  };

  useEffect(() => {
    if (!isClient || !walletConnection?.isConnected) return;

    // Load saved document when component mounts
    loadDocument();

    const username = user?.name || walletConnection?.address;
    if (!username) {
      console.error("No username found");
      return;
    }

    ws.current = new WebSocket(buildWebSocketUrl(sessionId, username));

    ws.current.addEventListener("open", () => {
      console.log("WebSocket connection established");
      setIsSocketConnected(true);
    });

    ws.current.addEventListener("close", () => {
      console.log("WebSocket connection closed");
      setIsSocketConnected(false);
    });

    ws.current.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      setIsSocketConnected(false);
    });

    ws.current.addEventListener("message", handleServerResponse);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [isClient, sessionId, handleServerResponse, walletConnection]);

  const handleEditorUpdate = (html: string) => {
    if (!isClient) {
      return;
    }

    setEditorContent(html);

    // Get cursor position safely
    let position = { x: 0, y: 0 };
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.top > 0) {
          position = { x: rect.left, y: rect.top };
        }
      }
    } catch (error) {
      // Silently handle selection errors (e.g., when editor is not focused)
      console.debug("Could not get selection range:", error);
    }

    const payload: ContentPayload = {
      content: html,
      position: position,
      userData: userDataRef.current,
    };

    throttleRef.current(payload);
    debounceRef.current(payload);
  };

  // Save document function using IPFS + Blockchain
  const saveDocument = async () => {
    if (!isClient) return;

    // Check if wallet is connected
    if (!isConnected || !walletConnection?.address) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    // Check if document has content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = editorContent;
    const textContent = tempDiv.textContent?.trim() || "";
    if (textContent.length === 0) {
      showToast("Please write something before saving", "error");
      return;
    }

    setIsSaving(true);
    showToast("Saving to IPFS and blockchain...", "info");

    try {
      // Step 1: Upload content to "IPFS" (Supabase)
      showToast("Storing content...", "info");
      const ipfsResult = await uploadToIPFS(editorContent);
      console.log("Content storage result:", ipfsResult);

      // Use document ID as CID for blockchain storage
      const cid = ipfsResult.cid;

      // Step 2: Check if document already exists on blockchain
      const existingDoc = await getDocumentFromChain(sessionId);

      let blockchainResult;
      if (existingDoc) {
        // Update existing document
        showToast("Updating on blockchain...", "info");
        blockchainResult = await updateDocumentOnChain(sessionId, cid);
      } else {
        // Create new document
        showToast("Creating on blockchain...", "info");
        blockchainResult = await createDocumentOnChain(sessionId, cid);
      }

      if (blockchainResult.success) {
        showToast(
          `Document saved successfully! TX: ${blockchainResult.transactionHash?.substring(
            0,
            10
          )}...`,
          "success"
        );
        console.log("Save successful:", {
          documentId: cid,
          blockchain: blockchainResult,
        });
      } else {
        showToast(
          blockchainResult.error || "Failed to save to blockchain",
          "error"
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast(
        `Failed to save document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Load document function using blockchain + IPFS
  const loadDocument = useCallback(async () => {
    if (!isClient) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Get document metadata from blockchain
      const docMetadata = await getDocumentFromChain(sessionId);
      if (docMetadata && docMetadata.cid) {
        // Get actual content from storage
        showToast("Loading document content...", "info");
        const content = await getFromIPFS(docMetadata.cid);

        if (content) {
          setEditorContent(content);
          console.log("Document loaded from blockchain + storage:", {
            docId: sessionId,
            documentId: docMetadata.cid,
            contentLength: content.length,
          });
        }
      }
      // If document doesn't exist on blockchain, that's fine - start with empty document
    } catch (error) {
      console.error("Load error:", error);
      showToast("Failed to load document content", "error");
    }
  }, [isClient, sessionId]);

  // Get user documents function using blockchain
  const getUserDocuments = async (): Promise<BlockchainDoc[]> => {
    if (!isClient || !walletConnection?.address) return [];

    try {
      // Get user documents from blockchain using wallet address
      const blockchainDocs = await getUserDocumentsFromChain(
        walletConnection.address
      );

      // Transform to match the expected format
      return blockchainDocs.map(({ docId, document }) => ({
        id: docId,
        docId: docId,
        updatedAt: new Date(document.updatedAt).toISOString(),
        content: `Doc: ${docId.substring(0, 8)}...`,
        cid: document.cid,
        createdBy: document.createdBy,
        createdAt: document.createdAt,
      }));
    } catch (error) {
      console.error("Error fetching documents from blockchain:", error);
      return [];
    }
  };

  // Load user documents for sidebar
  const loadUserDocuments = async () => {
    const docs = await getUserDocuments();
    setUserDocuments(docs);
  };

  // Load a specific document using blockchain
  const loadSpecificDocument = async (docId: string) => {
    if (!isClient || !walletConnection?.address) return;

    try {
      // Get document metadata from blockchain
      const documentData = await getDocumentFromChain(docId);

      if (documentData && documentData.createdBy === walletConnection.address) {
        // Load content from IPFS
        showToast("Loading document content...", "info");
        const content = await getFromIPFS(documentData.cid);

        if (content) {
          setEditorContent(content);
        }

        // Update the URL to reflect the new document
        window.history.pushState({}, "", `/doc/${docId}`);
        setShowSidebar(false);
        showToast("Document loaded successfully", "success");
      } else {
        console.error("Document not found or access denied");
        showToast("Document not found or you don't have access", "error");
      }
    } catch (error) {
      console.error("Load error:", error);
      showToast("Failed to load document", "error");
    }
  };

  // Show document details with blockchain information
  const showDocumentDetails = async (doc: BlockchainDoc) => {
    try {
      // Get full document details from blockchain
      const blockchainDoc = await getDocumentFromChain(doc.docId);
      if (blockchainDoc) {
        const fullDoc: BlockchainDoc = {
          ...doc,
          createdBy: blockchainDoc.createdBy,
          createdAt: blockchainDoc.createdAt,
          updatedAt: new Date(blockchainDoc.updatedAt).toISOString(),
        };
        setSelectedDocument(fullDoc);
        setShowDocDetails(true);
      }
    } catch (error) {
      console.error("Error getting document details:", error);
      showToast("Failed to get document details", "error");
    }
  };

  // Toast helper function
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast((prev: any) => ({ ...prev, isVisible: false }));
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-900 to-emerald-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            <span className="text-white text-lg">
              Loading Document Editor...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 via-teal-900 to-emerald-800 relative min-h-screen flex flex-col text-black overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-32 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-400/15 to-green-400/15 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "6s" }}
        ></div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          ></div>

          {/* Sidebar Content */}
          <div className="relative z-10 w-80 bg-white/10 backdrop-blur-md border-r border-white/20 shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">My Documents</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {userDocuments.length === 0 ? (
                  <div className="text-white/60 text-center py-8">
                    {!isConnected
                      ? "Connect your wallet to view documents"
                      : "No saved documents yet"}
                  </div>
                ) : (
                  userDocuments.map((doc: BlockchainDoc) => (
                    <div
                      key={doc.id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-medium text-sm">
                            {doc.docId.substring(0, 8)}...
                          </h3>
                          <p className="text-white/60 text-xs">
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => loadSpecificDocument(doc.docId)}
                          className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 rounded-lg text-xs transition-colors border border-blue-400/30"
                        >
                          Load Document
                        </button>
                        <button
                          onClick={() => showDocumentDetails(doc)}
                          className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-100 rounded-lg text-xs transition-colors border border-green-400/30"
                        >
                          📊 Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphism Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/10 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 font-medium border border-white/30 hover:border-white/50"
              title="Go back to home"
            >
              ← Back
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Collabify - Doc Online
                </h1>
                <p className="text-white/70 text-sm">
                  Collaborative Document Editor
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Wallet Connection Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-orange-400"
                  } shadow-lg`}
                ></span>
                <span className="text-white font-medium">
                  {isConnected
                    ? `${walletConnection?.address?.substring(
                        0,
                        6
                      )}...${walletConnection?.address?.substring(
                        walletConnection.address.length - 4
                      )}`
                    : "Wallet"}
                </span>
              </div>
              {!isConnected ? (
                <button
                  onClick={handleConnectWallet}
                  className="text-orange-300 hover:text-white transition-colors text-sm px-2 py-1 bg-orange-500/20 rounded-lg"
                >
                  Connect
                </button>
              ) : (
                <span className="text-green-300 text-sm">Connected</span>
              )}
            </div>

            {/* Save Button and Status */}
            <div className="flex items-center gap-3">
              {/* My Documents Button */}
              <button
                onClick={() => {
                  if (!isConnected) {
                    showToast("Please connect your wallet first", "error");
                    return;
                  }
                  setShowSidebar(!showSidebar);
                  if (!showSidebar) {
                    loadUserDocuments();
                  }
                }}
                className={`px-4 py-2 backdrop-blur-sm rounded-xl transition-all duration-200 font-medium border shadow-lg ${
                  isConnected
                    ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border-blue-400/30 hover:border-blue-400/50"
                    : "bg-gray-500/20 text-gray-300 border-gray-400/30 cursor-not-allowed"
                }`}
                title={
                  isConnected
                    ? "My saved documents"
                    : "Connect wallet to view documents"
                }
                disabled={!isConnected}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h1a2 2 0 011 1v2M7 7h10"
                    />
                  </svg>
                  My Docs
                </div>
              </button>

              <button
                onClick={saveDocument}
                disabled={isSaving || !isConnected}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 border ${
                  isSaving || !isConnected
                    ? "bg-gray-400/20 text-gray-300 cursor-not-allowed border-gray-400/30"
                    : "bg-green-500/20 hover:bg-green-500/30 text-green-100 border-green-400/30 hover:border-green-400/50 shadow-lg hover:shadow-xl"
                }`}
                title={
                  !isConnected
                    ? "Connect wallet to save documents"
                    : "Save document"
                }
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1 0h4m-4 0V4h4v3"
                      />
                    </svg>
                    Save
                  </div>
                )}
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
              <span className="text-sm text-white/80">Session ID:</span>
              <span className="font-mono text-white font-medium ml-2">
                {sessionId}
              </span>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/doc/${sessionId}`
                    );
                  }
                }}
                className="ml-3 text-blue-300 hover:text-white transition-colors"
                title="Copy session link"
              >
                📋
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {users.map((user: UserDataType, index: number) => (
                  <div
                    key={user.userId}
                    className={`text-white px-3 py-2 rounded-xl backdrop-blur-sm border border-white/20 text-sm font-medium ${
                      index > 0 && "-ml-2"
                    } hover:scale-105 transition-transform`}
                    style={{
                      background: `${user.userColor || "#666"}40`,
                      borderColor: user.userColor || "#666",
                    }}
                    title={user.userName ?? ""}
                  >
                    {user.userName || "Guest"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="h-[1124px] w-[784px]" ref={contentArea}>
            <TiptapEditor
              content={editorContent}
              onUpdate={handleEditorUpdate}
              editable={true}
            />
          </div>

          {/* User Cursors */}
          {userCursors.map((item: UserCursor, index: number) => {
            if (!contentArea.current) return null;

            const ContainerRect = contentArea.current.getBoundingClientRect();
            const relativeX = item.position.x - ContainerRect.left - 20;
            const relativeY = item.position.y - ContainerRect.top;

            return (
              <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: `${relativeX}px`,
                  top: `${relativeY}px`,
                  zIndex: 1000,
                }}
              >
                <div
                  className="text-white px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg backdrop-blur-sm border border-white/20"
                  style={{
                    backgroundColor: item.userData.userColor ?? "#666",
                  }}
                >
                  {item.userData.userName}
                </div>
                <div
                  className="w-0.5 h-4 mt-1"
                  style={{
                    backgroundColor: item.userData.userColor ?? "#666",
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>

      {/* Document Details Modal */}
      {showDocDetails && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDocDetails(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Document Details
              </h2>
              <button
                onClick={() => setShowDocDetails(false)}
                className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Document ID */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-white/70 mb-2">
                  Document ID
                </h3>
                <div className="flex items-center justify-between">
                  <code className="text-white font-mono text-sm bg-black/20 px-3 py-2 rounded-lg">
                    {selectedDocument.docId}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(selectedDocument.docId)
                    }
                    className="text-blue-300 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Storage CID */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-white/70 mb-2">
                  Storage ID (CID)
                </h3>
                <div className="flex items-center justify-between">
                  <code className="text-white font-mono text-sm bg-black/20 px-3 py-2 rounded-lg">
                    {selectedDocument.cid}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(selectedDocument.cid)
                    }
                    className="text-blue-300 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Owner Address */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-white/70 mb-2">
                  Owner Address
                </h3>
                <div className="flex items-center justify-between">
                  <code className="text-white font-mono text-sm bg-black/20 px-3 py-2 rounded-lg">
                    {selectedDocument.createdBy}
                  </code>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedDocument.createdBy
                        )
                      }
                      className="text-blue-300 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                    <a
                      href={`https://explorer.testnet.rootstock.io/address/${selectedDocument.createdBy}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-300 hover:text-white transition-colors"
                      title="View on blockchain explorer"
                    >
                      🔗
                    </a>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-2">
                    Created
                  </h3>
                  <p className="text-white">
                    {new Date(selectedDocument.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-2">
                    Last Updated
                  </h3>
                  <p className="text-white">
                    {new Date(selectedDocument.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transaction Hash */}
              {selectedDocument.transactionHash && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-2">
                    Transaction Hash
                  </h3>
                  <div className="flex items-center justify-between">
                    <code className="text-white font-mono text-sm bg-black/20 px-3 py-2 rounded-lg">
                      {selectedDocument.transactionHash}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedDocument.transactionHash!
                          )
                        }
                        className="text-blue-300 hover:text-white transition-colors"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                      <a
                        href={getTransactionUrl(
                          selectedDocument.transactionHash
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-300 hover:text-white transition-colors"
                        title="View transaction on explorer"
                      >
                        🔗
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    loadSpecificDocument(selectedDocument.docId);
                    setShowDocDetails(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 rounded-xl transition-all duration-200 font-medium border border-blue-400/30 hover:border-blue-400/50"
                >
                  Load Document
                </button>
                <button
                  onClick={() => setShowDocDetails(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 font-medium border border-white/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={toast.type === "error" ? 5000 : 3000}
      />
    </div>
  );
};

export default DocPage;

//test
