import { useState } from "react";
import { X, Sparkles, Key, Volume2, Mic, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { useChatbot } from "../../context/ChatbotContext";

export default function ChatbotSettingsModal({ isOpen, onClose }) {
  const { settings, updateSettings } = useChatbot();
  const [provider, setProvider] = useState(settings.provider || "local");
  const [geminiKey, setGeminiKey] = useState(settings.geminiKey || "");
  const [openaiKey, setOpenaiKey] = useState(settings.openaiKey || "");
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || "gemini-1.5-flash");
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel || "gpt-4o-mini");
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [speechEnabled, setSpeechEnabled] = useState(settings.speechEnabled ?? false);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({
      provider,
      geminiKey: geminiKey.trim(),
      openaiKey: openaiKey.trim(),
      geminiModel,
      openaiModel,
      soundEnabled,
      speechEnabled,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleTestKey = async () => {
    setTestStatus({ testing: true, message: "Validating API key..." });
    try {
      if (provider === "gemini") {
        if (!geminiKey.trim()) throw new Error("Please enter a Google Gemini API Key");
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}: Invalid key or model`);
        setTestStatus({ success: true, message: "Gemini API key is valid and working!" });
      } else if (provider === "openai") {
        if (!openaiKey.trim()) throw new Error("Please enter an OpenAI API Key");
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${openaiKey.trim()}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: Invalid OpenAI key`);
        setTestStatus({ success: true, message: "OpenAI API key is valid and working!" });
      } else {
        setTestStatus({ success: true, message: "Local Clinical Engine is always active and ready." });
      }
    } catch (err) {
      setTestStatus({ error: true, message: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Chatbot Settings</h3>
              <p className="text-xs text-brand-100">Configure AI Providers, Models & Speech</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Intelligence Engine Provider
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setProvider("local")}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  provider === "local"
                    ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800">Built-in Local</span>
                  {provider === "local" && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </div>
                <span className="text-[11px] text-slate-500">Offline & Zero API Key required</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider("gemini")}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  provider === "gemini"
                    ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800">Google Gemini</span>
                  {provider === "gemini" && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </div>
                <span className="text-[11px] text-slate-500">Gemini 1.5 / 2.0 Flash</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider("openai")}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                  provider === "openai"
                    ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800">OpenAI</span>
                  {provider === "openai" && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </div>
                <span className="text-[11px] text-slate-500">GPT-4o / GPT-4o-mini</span>
              </button>
            </div>
          </div>

          {/* Gemini Settings */}
          {provider === "gemini" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-9 pr-16 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-600 hover:text-brand-800 font-medium px-1.5 py-0.5"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Your key is stored locally in your browser. Get a key at Google AI Studio.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (In-depth Clinical Analysis)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Latest)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenAI Settings */}
          {provider === "openai" && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full pl-9 pr-16 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 font-mono"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-600 hover:text-brand-800 font-medium px-1.5 py-0.5"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Model</label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Cost-efficient & Fast)</option>
                  <option value="gpt-4o">gpt-4o (High Accuracy)</option>
                </select>
              </div>
            </div>
          )}

          {provider === "local" && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <span className="font-semibold">Built-in Clinical Knowledge Engine is Active.</span> It operates
                100% locally with instant responses, full access to your pharmacy database, FEFO batch allocations,
                and drug-drug interaction safety matrices with zero latency.
              </div>
            </div>
          )}

          {/* Test connection result */}
          {testStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testStatus.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : testStatus.error
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {testStatus.success ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : testStatus.error ? (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              ) : null}
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Preferences */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Audio & Speech Preferences
            </label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Sound Effects</p>
                  <p className="text-[11px] text-slate-500">Play subtle chimes on message arrival</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Auto Voice Readout</p>
                  <p className="text-[11px] text-slate-500">Automatically read recommendations aloud</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={(e) => setSpeechEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          {provider !== "local" ? (
            <button
              type="button"
              onClick={handleTestKey}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Test Connection
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
