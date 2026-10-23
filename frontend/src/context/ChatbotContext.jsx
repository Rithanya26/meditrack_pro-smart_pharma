import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { chatbotEngine } from "../services/chatbotEngine";
import { soundEffects } from "../utils/audioEffects";
import { useAuth } from "./AuthContext";

const ChatbotContext = createContext(null);

const STORAGE_KEY_MESSAGES = "meditrack_chatbot_messages";
const STORAGE_KEY_SETTINGS = "meditrack_chatbot_settings";

const defaultSettings = {
  provider: "local", // "local" | "gemini" | "openai"
  geminiKey: "",
  openaiKey: "",
  geminiModel: "gemini-1.5-flash",
  openaiModel: "gpt-4o-mini",
  soundEnabled: true,
  speechEnabled: false,
};

const initialWelcomeMessage = {
  id: "welcome-msg",
  sender: "bot",
  text: `👋 **Welcome to MediTrack Chatbot**\n\n` +
    `I am your intelligent clinical pharmacy assistant, synchronized in real-time with your inventory, batch expirations, FEFO allocations, and drug interactions.\n\n` +
    `How can I assist your shift today?`,
  type: "info",
  timestamp: new Date().toISOString(),
  actions: [
    { label: "Check Expiry Radar", path: "/pharmacist/expiry-alerts" },
    { label: "FEFO Dispensing", path: "/pharmacist/dispense" },
    { label: "Low Stock Alert", path: "/admin/inventory" },
  ],
};

export function ChatbotProvider({ children }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState(null);

  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Load messages from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [initialWelcomeMessage];
  });

  // Sync sound setting
  useEffect(() => {
    soundEffects.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages.slice(-50)));
    } catch {
      // Ignore quota error
    }
  }, [messages]);

  // Persist settings
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Web Speech API - Speech to Text
  const recognitionRef = useRef(null);
  const onSpeechTranscriptRef = useRef(null);

  const startListening = useCallback((onTranscript) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    onSpeechTranscriptRef.current = onTranscript;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (onSpeechTranscriptRef.current) {
          onSpeechTranscriptRef.current(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Text to Speech
  const speakText = useCallback((text, messageId) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking && activeSpeechId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown syntax for speech
    const cleanText = text
      .replace(/[#*_`~$\\]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeechId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, activeSpeechId]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechId(null);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || loading) return;

      const userMsg = {
        id: "msg-" + Date.now(),
        sender: "user",
        text: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      soundEffects.playSend();
      setLoading(true);

      try {
        let botResponse;

        // Cloud LLM mode if configured
        if (settings.provider === "gemini" && settings.geminiKey) {
          try {
            botResponse = await chatbotEngine.callCloudLLM({
              apiKey: settings.geminiKey,
              provider: "gemini",
              model: settings.geminiModel,
              query: trimmed,
              user,
              history: messages,
            });
          } catch (cloudErr) {
            console.warn("Cloud Gemini failed, falling back to local engine:", cloudErr);
            botResponse = await chatbotEngine.processLocalQuery(trimmed, user);
            botResponse.text = `*(Gemini API unavailable: ${cloudErr.message}. Switched to built-in MediTrack Clinical Engine)*\n\n` + botResponse.text;
          }
        } else if (settings.provider === "openai" && settings.openaiKey) {
          try {
            botResponse = await chatbotEngine.callCloudLLM({
              apiKey: settings.openaiKey,
              provider: "openai",
              model: settings.openaiModel,
              query: trimmed,
              user,
              history: messages,
            });
          } catch (cloudErr) {
            console.warn("Cloud OpenAI failed, falling back to local engine:", cloudErr);
            botResponse = await chatbotEngine.processLocalQuery(trimmed, user);
            botResponse.text = `*(OpenAI API unavailable: ${cloudErr.message}. Switched to built-in MediTrack Clinical Engine)*\n\n` + botResponse.text;
          }
        } else {
          // Default built-in smart local clinical engine
          botResponse = await chatbotEngine.processLocalQuery(trimmed, user);
        }

        const botMsg = {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: botResponse.text,
          type: botResponse.type || "info",
          actions: botResponse.actions || [],
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);

        if (botResponse.type === "danger" || botResponse.type === "warning") {
          soundEffects.playWarning();
        } else {
          soundEffects.playReceive();
        }

        // Auto speak if speechEnabled
        if (settings.speechEnabled) {
          speakText(botResponse.text, botMsg.id);
        }
      } catch (err) {
        const errorMsg = {
          id: "err-" + Date.now(),
          sender: "bot",
          text: `⚠️ An error occurred while processing your query: ${err.message}`,
          type: "danger",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        soundEffects.playWarning();
      } finally {
        setLoading(false);
      }
    },
    [loading, settings, user, messages, speakText]
  );

  const clearMessages = useCallback(() => {
    stopSpeaking();
    setMessages([initialWelcomeMessage]);
    try {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
    } catch {
      // Ignore
    }
  }, [stopSpeaking]);

  const openChatbot = useCallback(
    (initialPrompt) => {
      setIsOpen(true);
      if (initialPrompt) {
        setTimeout(() => {
          sendMessage(initialPrompt);
        }, 300);
      }
    },
    [sendMessage]
  );

  const closeChatbot = useCallback(() => {
    stopSpeaking();
    setIsOpen(false);
  }, [stopSpeaking]);

  const toggleChatbot = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  const value = {
    isOpen,
    isExpanded,
    setIsExpanded,
    openChatbot,
    closeChatbot,
    toggleChatbot,
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
  };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return ctx;
}
