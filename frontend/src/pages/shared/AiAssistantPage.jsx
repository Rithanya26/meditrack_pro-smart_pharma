import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Bot,
  Send,
  CalendarClock,
  Boxes,
  Stethoscope,
  Volume2,
  Copy,
  Check,
  Sliders,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { useChatbot } from "../../context/ChatbotContext";
import { useAuth } from "../../context/AuthContext";
import { chatbotEngine } from "../../services/chatbotEngine";
import ChatbotSettingsModal from "../../components/chatbot/ChatbotSettingsModal";
import FormattedMessage from "../../components/chatbot/FormattedMessage";

export default function AiAssistantPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    messages,
    loading,
    sendMessage,
    clearMessages,
    settings,
    speakText,
    isSpeaking,
    activeSpeechId,
  } = useChatbot();

  const [prompt, setPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [inventoryStats, setInventoryStats] = useState({
    totalMeds: 0,
    lowStock: 0,
    criticalExpiry: 0,
    expired: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const ctx = await chatbotEngine.getLiveContext();
        setInventoryStats({
          totalMeds: ctx.medicines.length,
          lowStock: ctx.lowStockBatches.length,
          criticalExpiry: ctx.batches.filter((b) => b.daysLeft > 0 && b.daysLeft <= 30).length,
          expired: ctx.expiredBatches.length,
        });
      } catch {
        // Ignore
      }
    }
    loadStats();
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    sendMessage(prompt);
    setPrompt("");
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-brand-700 via-indigo-700 to-brand-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MediTrack Chatbot</h1>
              <p className="text-xs text-brand-100">
                Advanced Clinical Pharmacy Decision Support, FEFO Allocation & Live Database Assistant
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition border border-white/20"
          >
            <Sliders className="w-4 h-4" />
            Engine Settings ({settings.provider})
          </button>
          <button
            onClick={clearMessages}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition border border-white/20"
          >
            Clear History
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-500/20 rounded-full blur-2xl" />
      </div>

      {/* Live System Context Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Catalog Medicines</p>
            <p className="text-lg font-bold text-slate-800">{inventoryStats.totalMeds}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Low Stock Batches</p>
            <p className="text-lg font-bold text-slate-800">{inventoryStats.lowStock}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Batches &lt;= 30d</p>
            <p className="text-lg font-bold text-rose-600">{inventoryStats.criticalExpiry}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">FEFO Enforcement</p>
            <p className="text-sm font-bold text-emerald-600">Active (100%)</p>
          </div>
        </div>
      </div>

      {/* Main Workspace: Full-Width High-Resolution Clinical Consultation Stream */}
      <div className="w-full card flex flex-col h-[700px] overflow-hidden border border-slate-200 shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-600" />
            <h2 className="text-sm font-bold text-slate-800">Clinical Consultation Stream</h2>
          </div>
          <span className="text-xs text-slate-500">
            Provider: <strong className="text-brand-600 capitalize">{settings.provider}</strong>
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            const isDanger = m.type === "danger";
            const isWarning = m.type === "warning";

            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? "bg-brand-600 text-white"
                      : "bg-gradient-to-br from-indigo-600 to-brand-600 text-white shadow-sm"
                  }`}
                >
                  {isUser ? user?.avatar || "U" : <Sparkles className="w-4 h-4 text-yellow-300" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs shadow-sm ${
                    isUser
                      ? "bg-brand-600 text-white rounded-tr-none"
                      : isDanger
                      ? "bg-rose-50 border border-rose-200 text-slate-800 rounded-tl-none ring-1 ring-rose-400/20"
                      : isWarning
                      ? "bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-none ring-1 ring-amber-400/20"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                  }`}
                >
                  <div className="text-sm">
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    ) : (
                      <FormattedMessage text={m.text} />
                    )}
                  </div>

                  {/* Action buttons embedded in assistant response */}
                  {!isUser && m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => navigate(act.path)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs border border-brand-200/60 transition"
                        >
                          <span>{act.label}</span>
                          <ArrowUpRight className="w-3 h-3 text-brand-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                    {!isUser && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakText(m.text, m.id)}
                          className="p-1 hover:text-slate-600"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="p-1 hover:text-slate-600"
                          title="Copy"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
              </div>
              <span className="animate-pulse font-medium">
                MediTrack AI is evaluating clinical evidence and database records...
              </span>
            </div>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-thin">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
            Popular Questions:
          </span>
          {[
            "⚠️ List expired medicines",
            "🛒 Auto reorder status & suggestions",
            "🏷️ FEFO batch for Paracetamol",
            "🏷️ FEFO batch for Dolo 650",
            "⏳ Batches expiring in 30 days",
            "📦 Show low stock medicines",
            "⚠️ Ibuprofen + Warfarin interaction",
            "🚨 Dispense Dolo 650 for 45 days check",
            "💊 How to dispense medicine?",
            "🏷️ What is FEFO?",
            "➕ How to add a medicine?",
            "📊 Explain demand forecasting formula",
            "🛡️ Admin vs Pharmacist roles",
            "📦 Show order received awaiting medicine",
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(item.replace(/^[^\s]+\s/, ""))}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-[11px] font-medium border border-slate-200 shadow-xs transition flex-shrink-0 disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Consultation Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about FEFO allocation, how to dispense, add medicine, batch lookup, drug interactions..."
              className="input text-xs py-2.5"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="btn btn-primary px-5 py-2.5 text-xs flex-shrink-0"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </form>
      </div>

      <ChatbotSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
