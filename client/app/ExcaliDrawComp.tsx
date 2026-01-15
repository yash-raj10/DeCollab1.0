"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import { useRouter } from "next/navigation";
import { throttle, debounce } from "./utils";
import Toast from "./components/Toast";
import { buildWebSocketUrl, buildDrawingUrl } from "./config/api";
import { useWalletAuth } from "./contexts/SimpleWalletContext";
import { uploadToIPFS, getFromIPFS } from "./utils/ipfs";
import {
  createDocumentOnChain,
  updateDocumentOnChain,
  getDocumentFromChain,
  generateDocumentId,
} from "./utils/blockchain";
import {
  encryptData,
  decryptData,
  generateEncryptionKey,
  getEncryptionKey,
  storeEncryptionKey,
  getCollaboratorAddresses,
  addCollaborator,
} from "./utils/encryption";

import "@excalidraw/excalidraw/index.css";

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

interface ExcalidrawWrapperProps {
  sessionId?: string;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
  sessionId = "default",
}) => {
  const router = useRouter();
  const { walletConnection, user } = useWalletAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const userDataRef = useRef<UserDataType>({
    userId: null,
    userName: "",
    userColor: "",
  });
  const [userCursors, setUserCursors] = useState<Array<UserCursor>>([]);
  const [users, setUsers] = useState<Array<UserDataType>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userDrawings, setUserDrawings] = useState<
    Array<{
      id: string;
      drawingId: string;
      updatedAt: string;
      content: string;
    }>
  >([]);
  const [currentElements, setCurrentElements] = useState<unknown[]>([]);
  const [currentAppState, setCurrentAppState] = useState<{
    collaborators: Map<string, unknown>;
    [key: string]: unknown;
  }>({
    collaborators: new Map(),
  });
  const [initialData, setInitialData] = useState<unknown>(null);
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
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "content",
            data: payload,
          })
        );
      }
    }, 100)
  );

  const debounceRef = useRef(
    debounce((payload: ContentPayload) => {
      console.log("debounce", payload);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "content",
            data: payload,
          })
        );
      }
    }, 300)
  );

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

  const handleServerResponse = useCallback((event: MessageEvent) => {
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

        if (contentMsg.data.userData.userId !== userDataRef.current?.userId) {
          console.log("Applying remote cursor update");
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

      // Handle drawing updates from other users
      if (eventType === "drawing-update") {
        const drawingMsg = ParsedData as {
          data: {
            elements: unknown;
            appState: unknown;
            userData: UserDataType;
            sessionId: string;
          };
        };

        // Only apply updates from other users
        if (
          drawingMsg.data.userData.userId !== userDataRef.current?.userId &&
          drawingMsg.data.sessionId === sessionId
        ) {
          console.log("Applying remote drawing update");
          setCurrentElements(drawingMsg.data.elements as unknown[]);
          setCurrentAppState({
            ...(drawingMsg.data.appState as { [key: string]: unknown }),
            collaborators: new Map(),
          });
        }
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
  }, []);

  useEffect(() => {
    //(Hydration error fix)
    setIsClient(true);
  }, []);

  // Toast helper functions
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Save drawing function with blockchain and encryption
  const saveDrawing = async () => {
    if (!isClient || currentElements.length === 0) {
      showToast("Please draw something before saving", "error");
      return;
    }

    if (!walletConnection?.address) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    setIsSaving(true);
    showToast("Saving drawing...", "info");

    try {
      // Serialize drawing data
      const serializableAppState = {
        ...currentAppState,
        collaborators: undefined,
      };

      const drawingData = {
        elements: currentElements,
        appState: serializableAppState,
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        userId: userDataRef.current.userId,
      };

      const drawingJson = JSON.stringify(drawingData);

      // Get or create encryption key
      let encryptionKey = getEncryptionKey(sessionId, walletConnection.address);
      let collaboratorAddresses = getCollaboratorAddresses(sessionId);

      // If no key exists, create one with current user
      if (!encryptionKey) {
        collaboratorAddresses = [walletConnection.address];
        encryptionKey = generateEncryptionKey(collaboratorAddresses);
        storeEncryptionKey(sessionId, encryptionKey, collaboratorAddresses);
      } else {
        // Add current user if not already in list
        if (!collaboratorAddresses.includes(walletConnection.address)) {
          addCollaborator(sessionId, walletConnection.address);
          collaboratorAddresses = getCollaboratorAddresses(sessionId);
          encryptionKey = generateEncryptionKey(collaboratorAddresses);
        }
      }

      // Encrypt the drawing data
      showToast("Encrypting drawing...", "info");
      const encryptedData = await encryptData(drawingJson, encryptionKey);

      // Upload encrypted data to IPFS
      showToast("Uploading to storage...", "info");
      const ipfsResult = await uploadToIPFS(encryptedData);
      const cid = ipfsResult.cid;

      // Save to blockchain
      showToast("Saving to blockchain...", "info");
      const existingDoc = await getDocumentFromChain(sessionId);

      let blockchainResult;
      if (existingDoc) {
        blockchainResult = await updateDocumentOnChain(sessionId, cid);
      } else {
        blockchainResult = await createDocumentOnChain(sessionId, cid);
      }

      if (blockchainResult.success) {
        showToast("Drawing saved successfully!", "success");
      } else {
        showToast(
          blockchainResult.error || "Failed to save to blockchain",
          "error"
        );
      }
    } catch (error: unknown) {
      console.error("Save error:", error);
      const err = error as { message?: string };
      showToast(err.message || "Failed to save drawing", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Load drawing function with blockchain and decryption
  const loadDrawing = useCallback(async () => {
    if (!isClient) return;

    try {
      const walletAddress = walletConnection?.address;
      if (!walletAddress) return;

      // Get document from blockchain
      const docMetadata = await getDocumentFromChain(sessionId);
      if (docMetadata && docMetadata.cid) {
        showToast("Loading drawing...", "info");

        // Get encrypted data from storage
        const encryptedData = await getFromIPFS(docMetadata.cid);

        // Get encryption key
        let encryptionKey = getEncryptionKey(sessionId, walletAddress);

        // If no key stored, try to derive from blockchain metadata
        if (!encryptionKey) {
          // Get all collaborators (we'll need to store this in blockchain or derive)
          // For now, use the creator's address
          const collaborators = [docMetadata.createdBy];
          encryptionKey = generateEncryptionKey(collaborators);
          storeEncryptionKey(sessionId, encryptionKey, collaborators);
        }

        // Decrypt the data
        try {
          const decryptedData = await decryptData(encryptedData, encryptionKey);
          const parsedContent = JSON.parse(decryptedData);

          if (parsedContent.elements) {
            setCurrentElements(parsedContent.elements);

            const appState = {
              ...parsedContent.appState,
              collaborators: new Map(),
            };
            setCurrentAppState(appState);

            setInitialData({
              elements: parsedContent.elements,
              appState: appState,
            });

            showToast("Drawing loaded successfully!", "success");
          }
        } catch (decryptError) {
          console.error("Decryption error:", decryptError);
          showToast("Failed to decrypt drawing - access denied", "error");
        }
      }
      // If drawing doesn't exist, start with empty drawing
    } catch (error) {
      console.error("Load error:", error);
      // Don't show error for missing drawings
    }
  }, [isClient, sessionId, walletConnection]); // Get user drawings function using blockchain
  const getUserDrawings = async () => {
    if (!isClient || !walletConnection?.address) return [];

    try {
      // Use the same function as documents - drawings are stored the same way
      const { getUserDocumentsFromChain } = await import("./utils/blockchain");
      const blockchainDocs = await getUserDocumentsFromChain(
        walletConnection.address
      );

      // Filter for drawings (you could add a type field, or use a naming convention)
      // For now, we'll return all documents as potential drawings
      return blockchainDocs.map(({ docId, document }) => ({
        id: docId,
        drawingId: docId,
        updatedAt: new Date(document.updatedAt * 1000).toISOString(),
        content: `Drawing: ${docId.substring(0, 8)}...`,
      }));
    } catch (error) {
      console.error("Error fetching drawings:", error);
      return [];
    }
  };

  // Load user drawings for sidebar
  const loadUserDrawings = async () => {
    const drawings = await getUserDrawings();
    setUserDrawings(drawings);
  };

  // Load a specific drawing using blockchain
  const loadSpecificDrawing = async (drawingId: string) => {
    if (!isClient || !walletConnection?.address) return;

    try {
      showToast("Loading drawing...", "info");

      // Get document from blockchain
      const docMetadata = await getDocumentFromChain(drawingId);
      if (docMetadata && docMetadata.cid) {
        // Get encrypted data
        const encryptedData = await getFromIPFS(docMetadata.cid);

        // Get encryption key
        let encryptionKey = getEncryptionKey(
          drawingId,
          walletConnection.address
        );
        if (!encryptionKey) {
          const collaborators = [docMetadata.createdBy];
          encryptionKey = generateEncryptionKey(collaborators);
          storeEncryptionKey(drawingId, encryptionKey, collaborators);
        }

        // Decrypt
        const decryptedData = await decryptData(encryptedData, encryptionKey);
        const parsedContent = JSON.parse(decryptedData);

        if (parsedContent.elements) {
          setCurrentElements(parsedContent.elements);
          const appState = {
            ...parsedContent.appState,
            collaborators: new Map(),
          };
          setCurrentAppState(appState);
          setInitialData({
            elements: parsedContent.elements,
            appState: appState,
          });

          // Update URL and close sidebar
          window.history.pushState({}, "", `/excalidraw/${drawingId}`);
          setShowSidebar(false);
          showToast("Drawing loaded successfully!", "success");
        }
      } else {
        showToast("Drawing not found", "error");
      }
    } catch (error: unknown) {
      console.error("Load error:", error);
      const err = error as { message?: string };
      showToast(err.message || "Failed to load drawing", "error");
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log("Initial data updated:", initialData);
    }
  }, [initialData]);

  useEffect(() => {
    const connectWebSocket = () => {
      if (!isClient) return;

      // Load saved drawing when component mounts
      loadDrawing();

      // Get username for websocket connection
      const username = user?.name || walletConnection?.address;
      if (!username) {
        console.error("No username found");
        return;
      }

      // Initialize user data with username for display
      userDataRef.current = {
        userId: walletConnection?.address || username,
        userName:
          user?.name ||
          `${walletConnection?.address?.slice(
            0,
            6
          )}...${walletConnection?.address?.slice(-4)}`,
        userColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      };

      // Include session ID and username in WebSocket connection
      const wsUrl = buildWebSocketUrl(sessionId, username);
      ws.current = new WebSocket(wsUrl);

      ws.current.addEventListener("open", () => {
        console.log(
          `WebSocket connection established for session: ${sessionId}`
        );
        setIsConnected(true);
      });

      ws.current.addEventListener("close", (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
        setIsConnected(false);
      });

      ws.current.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      });

      ws.current.addEventListener("message", handleServerResponse);

      return () => {
        if (ws.current) {
          console.log("Cleaning up WebSocket connection");
          ws.current.close();
          setIsConnected(false);
        }
      };
    };

    connectWebSocket();
  }, [
    isClient,
    sessionId,
    handleServerResponse,
    loadDrawing,
    walletConnection,
  ]);

  const handlePointerUpdate = (payload: unknown) => {
    const typedPayload = payload as { pointer?: { x?: number; y?: number } };
    if (
      typedPayload.pointer &&
      typedPayload.pointer.x !== undefined &&
      typedPayload.pointer.y !== undefined &&
      isConnected && // Only send if WebSocket is connected
      ws.current &&
      ws.current.readyState === WebSocket.OPEN
    ) {
      const position = {
        x: typedPayload.pointer.x,
        y: typedPayload.pointer.y,
      };

      const contentPayload: ContentPayload = {
        content: "", // Empty content string as requested
        position: position,
        userData: userDataRef.current,
      };

      throttleRef.current(contentPayload);
      debounceRef.current(contentPayload);
    }
  };

  // Handle Excalidraw changes and sync via WebSocket
  const handleExcalidrawChange = (elements: unknown, appState: unknown) => {
    // Update current state for saving
    setCurrentElements(elements as unknown[]);
    setCurrentAppState(
      appState as {
        collaborators: Map<string, unknown>;
        [key: string]: unknown;
      }
    );

    // Sync drawing changes via WebSocket for real-time collaboration
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isConnected) {
      try {
        const typedAppState = appState as { [key: string]: unknown };
        const serializableAppState = {
          ...typedAppState,
          collaborators: undefined,
        };

        const drawingUpdate = {
          type: "drawing-update",
          data: {
            elements: elements,
            appState: serializableAppState,
            userData: userDataRef.current,
            sessionId: sessionId,
          },
        };

        ws.current.send(JSON.stringify(drawingUpdate));
      } catch (error) {
        console.error("Error sending drawing update:", error);
      }
    }
  };

  console.info(
    convertToExcalidrawElements([
      {
        type: "rectangle",
        id: "rect-1",
        width: 186.47265625,
        height: 141.9765625,
        x: 0,
        y: 0,
      },
    ])
  );

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            <span className="text-white text-lg">Loading ExcaliDraw...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pastel-blue relative min-h-screen flex flex-col overflow-hidden">
      {/* Neobrutalism Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-pastel-pink border-4 border-black transform rotate-12"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-pastel-yellow border-4 border-black transform -rotate-12"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-pastel-purple border-4 border-black transform rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-pastel-mint border-4 border-black transform -rotate-12"></div>
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
          <div className="relative z-10 w-80 bg-pastel-yellow border-r-4 border-black overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black uppercase">
                  My Drawings
                </h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="neobrutal-button bg-pastel-pink p-2 text-black"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {userDrawings.length === 0 ? (
                  <div className="text-black/60 text-center py-8 font-bold">
                    No saved drawings yet
                  </div>
                ) : (
                  userDrawings.map(
                    (drawing: {
                      id: string;
                      drawingId: string;
                      updatedAt: string;
                    }) => (
                      <div
                        key={drawing.id}
                        className="neobrutal-box bg-pastel-blue p-4 cursor-pointer"
                        onClick={() => loadSpecificDrawing(drawing.drawingId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-black font-black text-sm">
                              Drawing: {drawing.drawingId.substring(0, 8)}...
                            </h3>
                            <p className="text-black/70 text-xs font-bold">
                              {new Date(drawing.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 text-black"
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
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Neobrutalism Header */}
      <header className="relative z-10 bg-pastel-yellow border-b-4 border-black">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="neobrutal-button bg-pastel-pink px-4 py-2 text-black"
              title="Go back to home"
            >
              ← Back
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-pastel-purple border-4 border-black flex items-center justify-center">
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
                <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                  Collabify - ExcaliDraw
                </h1>
                <p className="text-black/80 text-sm font-bold">
                  Collaborative Whiteboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Connection Status */}
            <div className="neobrutal-box bg-pastel-green px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 border-2 border-black ${
                    walletConnection?.isConnected
                      ? "bg-pastel-green"
                      : "bg-pastel-orange"
                  }`}
                ></span>
                <span className="text-black font-black text-sm">
                  {walletConnection?.isConnected
                    ? `${walletConnection?.address?.substring(
                        0,
                        6
                      )}...${walletConnection?.address?.substring(
                        walletConnection.address.length - 4
                      )}`
                    : "Wallet"}
                </span>
              </div>
              {!walletConnection?.isConnected ? (
                <span className="text-black text-xs font-bold bg-pastel-orange px-2 py-1 border-2 border-black">
                  Not Connected
                </span>
              ) : (
                <span className="text-black text-xs font-bold bg-pastel-mint px-2 py-1 border-2 border-black">
                  Connected
                </span>
              )}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              {/* Save Button */}
              <button
                onClick={saveDrawing}
                disabled={isSaving}
                className={`neobrutal-button px-4 py-2 text-black ${
                  isSaving
                    ? "bg-pastel-yellow opacity-50 cursor-not-allowed"
                    : "bg-pastel-mint"
                }`}
                title="Save drawing"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
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
                    Save
                  </div>
                )}
              </button>
            </div>

            <div className="neobrutal-box bg-pastel-orange px-4 py-2">
              <span className="text-sm text-black font-bold">Session ID:</span>
              <span className="font-mono text-black font-black ml-2">
                {sessionId}
              </span>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/excalidraw/${sessionId}`
                    );
                    showToast("Link copied!", "success");
                  }
                }}
                className="ml-3 text-black hover:opacity-70 transition-opacity border-2 border-black px-2 py-1 bg-pastel-pink font-bold"
                title="Copy session link"
              >
                📋
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {users.map((user: UserDataType, index: number) => (
                  <div
                    key={user.userId}
                    className={`neobrutal-box px-3 py-2 text-sm font-black text-black ${
                      index % 4 === 0
                        ? "bg-pastel-pink"
                        : index % 4 === 1
                        ? "bg-pastel-blue"
                        : index % 4 === 2
                        ? "bg-pastel-yellow"
                        : "bg-pastel-purple"
                    }`}
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

      <main className="relative z-10 flex-1 p-4">
        <div
          className="relative bg-white neobrutal-box m-4"
          style={{ height: "calc(100vh - 140px)" }}
        >
          <Excalidraw
            key={sessionId + (initialData ? "loaded" : "empty")}
            onPointerUpdate={handlePointerUpdate}
            onChange={handleExcalidrawChange}
            initialData={initialData as never}
          />

          {/* User Cursors */}
          {userCursors.map((item: UserCursor, index: number) => {
            return (
              <div
                key={index}
                className="absolute pointer-events-none"
                style={{
                  left: `${item.position.x}px`,
                  top: `${item.position.y}px`,
                  zIndex: 1000,
                }}
              >
                {/* Arrow Cursor */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="absolute -translate-x-0.5 -translate-y-0.5"
                >
                  {/* Arrow shadow for better visibility */}
                  <path
                    d="M5.5 4.5L5.5 17.5L9.5 13.5L13.5 17.5L15.5 15.5L11.5 11.5L15.5 7.5L5.5 4.5Z"
                    fill="rgba(0,0,0,0.2)"
                    transform="translate(1,1)"
                  />
                  {/* Main arrow */}
                  <path
                    d="M5 4L5 17L9 13L13 17L15 15L11 11L15 7L5 4Z"
                    fill={item.userData.userColor || "#666"}
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>

                {/* Name Label */}
                <div
                  className="absolute left-5 top-0 text-white px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg backdrop-blur-sm border border-white/20"
                  style={{
                    backgroundColor: item.userData.userColor || "#666",
                  }}
                >
                  {item.userData.userName}
                  {/* Small triangle pointing to cursor */}
                  <div
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent"
                    style={{
                      borderRightColor: item.userData.userColor || "#666",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default ExcalidrawWrapper;
