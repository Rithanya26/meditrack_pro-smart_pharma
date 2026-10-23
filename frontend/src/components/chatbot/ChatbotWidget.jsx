import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings,
  Trash2,
  Mic,
  MicOff,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useChatbot } from "../../context/ChatbotContext";
import { useAuth } from "../../context/AuthContext";
import ChatbotSettingsModal from "./ChatbotSettingsModal";

export default function ChatbotWidget() {
  const {
    isOpen,
    isExpanded,
    setIsExpanded,
    toggleChatbot,
    closeChatbot,
    messages,
    loading,
    sendMessage,
    clearMessages,
    settings,
    updateSettings,
    isListening,
    startListening,
    stopListening,
    isSpeaking,
    activeSpeechId,
    speakText,
    stopSpeaking,
  } = useChatbot();

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
      });
    }
  };

  const handleActionClick = (path) => {
    if (path) {
      navigate(path);
      // On mobile screen, close widget to let user see destination
      if (window.innerWidth < 768) {
        closeChatbot();
      }
    }
  };

  // Role-specific suggested prompts covering clinical, how-to, and inventory queries
  const pharmacistPrompts = [
    "📦 Show order received awaiting medicine",
    "💊 How to dispense medicine?",
    "🏷️ What is FEFO?",
    "🏷️ FEFO batch for Dolo 650",
    "⚠️ Ibuprofen + Warfarin interaction",
    "🚨 Dispense Dolo 650 for 45 days check",
    "💊 Tell me about Amoxicillin",
    "📷 How to scan barcode?",
    "⏳ Batches expiring in 30 days",
    "🛡️ Difference between Admin and Pharmacist",
  ];

  const adminPrompts = [
    "📦 Show order received awaiting medicine",
    "➕ How to add a medicine?",
    "🏷️ How to add a batch?",
    "📦 Show low stock medicines",
    "⏳ Which batches expire this month?",
    "⚖️ How to record damaged stock?",
    "📄 How to export reports?",
    "📊 Explain Croston-SBA forecasting",
    "🏷️ List all batches",
    "🛡️ Admin vs Pharmacist roles",
  ];

  const suggestedPrompts = user?.role === "admin" ? adminPrompts : pharmacistPrompts;

  // Simple Markdown renderer
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");

    return (
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-700">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Headers
          if (line.startsWith("### ")) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-xs mt-2 mb-1">
                {line.replace("### ", "")}
              </h4>
            );
          }
          if (line.startsWith("## ") || line.startsWith("# ")) {
            return (
              <h3 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1 border-b border-slate-100 pb-1">
                {line.replace(/^#+\s/, "")}
              </h3>
            );
          }

          // Blockquote
          if (line.startsWith("> ")) {
            return (
              <div
                key={idx}
                className="pl-2.5 py-1 my-1 border-l-2 border-brand-500 bg-brand-50/50 rounded-r text-[11px] text-slate-600 italic"
              >
                {line.replace("> ", "")}
              </div>
            );
          }

          // Bullet point
          if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
            const content = line.replace(/^[•\-*]\s+/, "");
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-brand-500 font-bold leading-none mt-1">•</span>
                <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }

          // Numbered list
          const numMatch = line.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-brand-600 font-semibold text-[11px]">{numMatch[1]}.</span>
                <span className="flex-1" dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str) => {
    return str
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-900'>$1</strong>")
      // Code / badges
      .replace(/`([^`]+)`/g, "<code class='px-1.5 py-0.5 rounded bg-slate-100 text-brand-700 font-mono text-[10.5px] border border-slate-200/80'>$1</code>")
      // Italics
      .replace(/\*([^*]+)\*/g, "<em class='italic text-slate-600'>$1</em>");
  };

  return (
    <>
      {/* Floating Trigger Button (when closed) */}
      {!isOpen && (
        <button
          onClick={toggleChatbot}
          id="meditrack-chatbot-trigger"
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-brand-500/20"
          title="Open MediTrack Chatbot"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-brand-700" />
          </div>
          <span className="text-xs font-bold tracking-wide">Chatbot</span>
          <div className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold">
            FEFO & Clinical
          </div>
        </button>
      )}

      {/* Main Chatbot Panel (when open) */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded
              ? "inset-4 sm:inset-10"
              : "bottom-5 right-5 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[88vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold truncate">MediTrack Chatbot</h3>
                  <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-semibold uppercase tracking-wider text-brand-100">
                    {settings.provider === "gemini"
                      ? "Gemini"
                      : settings.provider === "openai"
                      ? "OpenAI"
                      : "Local Brain"}
                  </span>
                </div>
                <p className="text-[10px] text-brand-100/90 truncate">
                  Clinical FEFO • Expiry Conflict • Safety Radar
                </p>
              </div>
            </div>

            {/* Header Tool Icons */}
            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title={settings.soundEnabled ? "Mute sounds" : "Unmute sounds"}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/50" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title="AI Settings & API Keys"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={clearMessages}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title={isExpanded ? "Restore size" : "Expand view"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={closeChatbot}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-header status bar */}
          <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Synchronized with Live Pharmacy Database
            </span>
            <span className="capitalize font-medium text-slate-600">
              {user?.role || "Staff"} View
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isDanger = msg.type === "danger";
              const isWarning = msg.type === "warning";
              const isSpeakingThis = isSpeaking && activeSpeechId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-brand-600 text-white"
                        : "bg-gradient-to-br from-indigo-600 to-brand-600 text-white shadow-sm"
                    }`}
                  >
                    {isUser ? user?.avatar || "U" : <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                      isUser
                        ? "bg-brand-600 text-white rounded-tr-none font-medium"
                        : isDanger
                        ? "bg-rose-50/90 border border-rose-200 text-slate-800 rounded-tl-none ring-1 ring-rose-400/20"
                        : isWarning
                        ? "bg-amber-50/90 border border-amber-200 text-slate-800 rounded-tl-none ring-1 ring-amber-400/20"
                        : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {/* Message Body */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      <div>{renderFormattedText(msg.text)}</div>
                    )}

                    {/* Action buttons embedded in assistant response */}
                    {!isUser && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                        {msg.actions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleActionClick(act.path)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-[11px] border border-brand-200/60 transition"
                          >
                            <span>{act.label}</span>
                            <ArrowUpRight className="w-3 h-3 text-brand-500" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Message Meta Footer */}
                    {!isUser && (
                      <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => speakText(msg.text, msg.id)}
                            className={`p-1 rounded hover:bg-slate-100 transition ${
                              isSpeakingThis ? "text-brand-600 bg-brand-50" : "text-slate-400"
                            }`}
                            title={isSpeakingThis ? "Stop speaking" : "Read aloud"}
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${isSpeakingThis ? "animate-pulse" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="p-1 rounded hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                            title="Copy to clipboard"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Loading indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-brand-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[11px] font-medium text-slate-500 ml-1.5">
                      Evaluating inventory & clinical safety...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Query Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-thin">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
              Suggestions:
            </span>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(prompt.replace(/^[^\s]+\s/, ""))}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-[11px] font-medium border border-slate-200/80 transition flex-shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200">
            {isListening && (
              <div className="mb-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-700 animate-pulse">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Listening... speak your pharmacy query
                </span>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-xs text-rose-800 font-bold hover:underline"
                >
                  Done
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 focus-within:bg-white transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about FEFO, drug interactions, expiry, stock..."
                rows={1}
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-24 py-1"
              />

              {/* Speech-to-Text Button */}
              <button
                type="button"
                onClick={handleVoiceClick}
                className={`p-1.5 rounded-lg transition ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                }`}
                title={isListening ? "Stop listening" : "Speak your query (Speech to text)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Shift+Enter for newline</span>
              <span>Clinical decision support tool</span>
            </div>
          </form>
        </div>
      )}

      {/* Settings Modal */}
      <ChatbotSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
