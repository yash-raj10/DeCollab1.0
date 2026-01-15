"use client";
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import AIChatSidebar from "./AIChatSidebar";
import AIGenerateModal from "./AIGenerateModal";
import {
  rewriteText,
  continueText,
  expandText,
  summarizeText,
  makeShorter,
  explainText,
  translateText,
  generateFromPrompt,
  fixGrammar,
  generateHeading,
} from "../utils/openai";
import "./tiptap.css";

interface TiptapEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  editable?: boolean;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onUpdate,
  editable = true,
}) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({ message: "", type: "info", isVisible: false });

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
    ],
    content: content,
    editable: editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-full p-8",
      },
    },
  });

  // Update editor content when prop changes (for collaborative editing)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content);
      // Restore cursor position if valid
      if (
        from <= editor.state.doc.content.size &&
        to <= editor.state.doc.content.size
      ) {
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [content, editor]);

  // AI Action Handler
  const handleAIAction = async (action: string, customParam?: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    if (!selectedText && action !== "generate") {
      showToast("Please select some text first!", "error");
      return;
    }

    setIsAILoading(true);
    setAiAction(action);

    try {
      let response;

      switch (action) {
        case "rewrite":
          response = await rewriteText(selectedText);
          break;
        case "continue":
          response = await continueText(selectedText);
          break;
        case "expand":
          response = await expandText(selectedText);
          break;
        case "summarize":
          response = await summarizeText(selectedText);
          break;
        case "makeShorter":
          response = await makeShorter(selectedText);
          break;
        case "explain":
          response = await explainText(selectedText);
          break;
        case "translate":
          if (customParam) {
            response = await translateText(selectedText, customParam);
          }
          break;
        case "fixGrammar":
          response = await fixGrammar(selectedText);
          break;
        case "generateHeading":
          response = await generateHeading(selectedText);
          break;
        case "generate":
          if (customParam) {
            response = await generateFromPrompt(customParam);
          }
          break;
        default:
          return;
      }

      if (response && response.success && response.text) {
        if (action === "continue") {
          // For continue, append after selection
          editor
            .chain()
            .focus()
            .setTextSelection(to)
            .insertContent(" " + response.text)
            .run();
        } else if (action === "generateHeading") {
          // Insert heading before selection
          editor
            .chain()
            .focus()
            .setTextSelection(from)
            .insertContent(response.text + "\n\n")
            .run();
        } else if (action === "generate") {
          // Insert generated content at cursor
          editor.chain().focus().insertContent(response.text).run();
          setShowGenerateModal(false);
        } else {
          // Replace selected text
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent(response.text)
            .run();
        }
        showToast("AI content generated successfully!", "success");
      } else {
        showToast(response?.error || "Failed to generate text", "error");
      }
    } catch (error) {
      console.error("AI action failed:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsAILoading(false);
      setAiAction(null);
    }
  };

  const handleGenerateFromModal = (prompt: string) => {
    handleAIAction("generate", prompt);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor-wrapper h-full flex flex-col">
      {/* Toolbar */}
      {editable && (
        <div className="toolbar bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-bold ${
                editor.isActive("bold") ? "bg-gray-300" : "bg-white"
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors italic ${
                editor.isActive("italic") ? "bg-gray-300" : "bg-white"
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors underline ${
                editor.isActive("underline") ? "bg-gray-300" : "bg-white"
              }`}
              title="Underline (Ctrl+U)"
            >
              U
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors line-through ${
                editor.isActive("strike") ? "bg-gray-300" : "bg-white"
              }`}
              title="Strikethrough"
            >
              S
            </button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-bold text-lg ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-bold ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-semibold text-sm ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              title="Heading 3"
            >
              H3
            </button>
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive("paragraph") ? "bg-gray-300" : "bg-white"
              }`}
              title="Paragraph"
            >
              P
            </button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive("bulletList") ? "bg-gray-300" : "bg-white"
              }`}
              title="Bullet List"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive("orderedList") ? "bg-gray-300" : "bg-white"
              }`}
              title="Numbered List"
            >
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
                  d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                />
              </svg>
            </button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive({ textAlign: "left" })
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              title="Align Left"
            >
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
                  d="M4 6h16M4 12h10M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive({ textAlign: "center" })
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              title="Align Center"
            >
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
                  d="M4 6h16M7 12h10M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive({ textAlign: "right" })
                  ? "bg-gray-300"
                  : "bg-white"
              }`}
              title="Align Right"
            >
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
                  d="M4 6h16M10 12h10M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Code & Quote */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-mono text-sm ${
                editor.isActive("code") ? "bg-gray-300" : "bg-white"
              }`}
              title="Inline Code"
            >
              {"</>"}
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive("codeBlock") ? "bg-gray-300" : "bg-white"
              }`}
              title="Code Block"
            >
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
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`px-3 py-1.5 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive("blockquote") ? "bg-gray-300" : "bg-white"
              }`}
              title="Blockquote"
            >
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
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
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
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
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
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>

          {/* AI Features */}
          <div className="relative flex items-center gap-1.5 border-l-2 border-purple-300 pl-3 ml-2">
            {/* AI Badge */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md shadow-sm">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <span className="text-xs font-semibold">AI</span>
            </div>

            {/* AI Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAIAction("rewrite")}
                disabled={isAILoading}
                className="group relative px-2.5 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 font-medium text-xs border border-purple-200 hover:border-purple-300 hover:shadow-sm"
                title="Rewrite text"
              >
                <span className="flex items-center gap-1">
                  <span>🔄</span>
                  <span className="hidden sm:inline">Rewrite</span>
                </span>
              </button>
              
              <button
                onClick={() => handleAIAction("continue")}
                disabled={isAILoading}
                className="group relative px-2.5 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 font-medium text-xs border border-purple-200 hover:border-purple-300 hover:shadow-sm"
                title="Continue writing"
              >
                <span className="flex items-center gap-1">
                  <span>✍️</span>
                  <span className="hidden sm:inline">Continue</span>
                </span>
              </button>
              
              <button
                onClick={() => handleAIAction("summarize")}
                disabled={isAILoading}
                className="group relative px-2.5 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 font-medium text-xs border border-purple-200 hover:border-purple-300 hover:shadow-sm"
                title="Summarize text"
              >
                <span className="flex items-center gap-1">
                  <span>📝</span>
                  <span className="hidden sm:inline">Summarize</span>
                </span>
              </button>
              
              <button
                onClick={() => handleAIAction("expand")}
                disabled={isAILoading}
                className="group relative px-2.5 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 font-medium text-xs border border-purple-200 hover:border-purple-300 hover:shadow-sm"
                title="Expand with details"
              >
                <span className="flex items-center gap-1">
                  <span>📈</span>
                  <span className="hidden sm:inline">Expand</span>
                </span>
              </button>
              
              <button
                onClick={() => handleAIAction("fixGrammar")}
                disabled={isAILoading}
                className="group relative px-2.5 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 font-medium text-xs border border-purple-200 hover:border-purple-300 hover:shadow-sm"
                title="Fix grammar"
              >
                <span className="flex items-center gap-1">
                  <span>✅</span>
                  <span className="hidden sm:inline">Fix</span>
                </span>
              </button>
              
              <button
                onClick={() => setShowGenerateModal(true)}
                disabled={isAILoading}
                className="group relative px-2.5 py-1.5 rounded-md hover:bg-purple-50 active:bg-purple-100 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 font-medium text-xs border border-purple-200 hover:border-purple-300 hover:shadow-sm"
                title="Generate content"
              >
                <span className="flex items-center gap-1">
                  <span>🤖</span>
                  <span className="hidden sm:inline">Generate</span>
                </span>
              </button>
              
              <div className="w-px h-6 bg-purple-200 mx-1"></div>
              
              <button
                onClick={() => setIsAIChatOpen(!isAIChatOpen)}
                className={`group relative px-2.5 py-1.5 rounded-md transition-all font-medium text-xs border hover:shadow-sm ${
                  isAIChatOpen
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                }`}
                title="AI Chat Assistant"
              >
                <span className="flex items-center gap-1">
                  <span>💬</span>
                  <span className="hidden sm:inline">Ask AI</span>
                </span>
              </button>
            </div>
          </div>

          {/* AI Loading Indicator */}
          {isAILoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded text-purple-600 text-sm">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span>AI {aiAction}...</span>
            </div>
          )}
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-auto bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* AI Chat Sidebar */}
      <AIChatSidebar
        documentContent={editor.getText()}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      {/* AI Generate Modal */}
      <AIGenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateFromModal}
        isLoading={isAILoading && aiAction === "generate"}
      />

      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            <span className="text-xl">
              {toast.type === "success"
                ? "✅"
                : toast.type === "error"
                ? "❌"
                : "ℹ️"}
            </span>
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
