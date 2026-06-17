// src/components/Chat.tsx
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Send, Bot, User, Sparkles, FileText } from "lucide-react";
import { AI_SERVICE_URL } from "./config";
import ReactMarkdown from "react-markdown";
import { getAuthItem } from "./utils/authStorage";

interface ChatProps {
  hasUploadedReports?: boolean;
}

type Sender = "user" | "bot";

interface Message {
  id: number;
  sender: Sender;
  text: string;
  timestamp: string;
}

interface LatestReportInfo {
  file_name: string;
  uploaded_at: string;
}

const API_BASE = AI_SERVICE_URL;

export default function Chat({ hasUploadedReports }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text:
        "Hello! I'm your AI health assistant. I use your latest lab report to answer questions. " +
        "Ask me about any test (like hemoglobin, cholesterol, glucose, TSH, etc.) or what you should focus on.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([
    "Summarize my latest lab report in simple words.",
    "Is there anything urgent in my latest lab report?",
    "Explain my latest hemoglobin result.",
    "Are my cholesterol and glucose values okay?",
    "What should I focus on improving based on my latest report?",
  ]);

  const [latestReport, setLatestReport] = useState<LatestReportInfo | null>(
    null
  );

  // -----------------------------
  // Fetch latest report + suggested questions
  // -----------------------------
  useEffect(() => {
  const email = getAuthItem("userEmail");
  if (!email) return;

  const fetchLatest = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/chat/latest-report?email=${encodeURIComponent(email)}`
      );

      if (!res.ok) {
        console.log("No latest report found");
        return;
      }

      const data = await res.json();
      if (data?.report) {
        setLatestReport({
          file_name: data.report.file_name,
          uploaded_at: data.report.uploaded_at,
        });
      }

      if (Array.isArray(data?.suggested_questions)) {
        setQuickQuestions(data.suggested_questions);
      }
    } catch (err) {
      console.error("Error fetching latest report:", err);
    }
  };

  fetchLatest();
}, []);



  // helper to format time
  const nowTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // -----------------------------
  // Send message to backend chat
  // -----------------------------
  const sendToBackend = async (msg: string) => {
  try {
    const email = getAuthItem("userEmail");
    
    if (!email) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Please sign in to use the chat feature.",
          timestamp: nowTime(),
        },
      ]);
      setIsTyping(false);
      return;
    }

    console.log("Sending to AI:", { question: msg, email });

    const res = await fetch(`${API_BASE}/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: msg, email }),
    });

    console.log("Response status:", res.status);

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("AI Response:", data);
    
    const answer = data.answer || "Sorry — I couldn't process that.";

    // Add bot message to UI
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "bot",
        text: answer,
        timestamp: nowTime(),
      },
    ]);

    setIsTyping(false);
  } catch (err: any) {
    console.error("Chat error:", err);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "bot",
        text: `Error: ${err.message || "Could not contact AI. Please try again."}`,
        timestamp: nowTime(),
      },
    ]);
    setIsTyping(false);
  }
};





  // -----------------------------
  // Handlers
  // -----------------------------
  const handleSendMessage = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
      timestamp: nowTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    sendToBackend(trimmed);
  };

  const handleQuickQuestion = (question: string) => {
    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: question,
      timestamp: nowTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    sendToBackend(question);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar hasUploadedReports={hasUploadedReports} />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-gray-900 mb-2">AI Health Assistant</h1>
          <p className="text-lg text-gray-600">
            I answer questions using your <strong>latest lab report</strong>.
          </p>

          {latestReport && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-sm text-blue-700 border border-blue-100">
              <FileText className="w-4 h-4" />
              <span>
                Using latest report:{" "}
                <strong>{latestReport.file_name}</strong> (
                {new Date(latestReport.uploaded_at).toLocaleDateString()})
              </span>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col"
          style={{ height: "600px" }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.map((message, index) => (
              <div key={message.id}>
                <div
                  className={`flex items-start gap-4 ${
                    message.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "bot"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600"
                        : "bg-gray-200"
                    }`}
                  >
                    {message.sender === "bot" ? (
                      <Bot className="w-6 h-6 text-white" />
                    ) : (
                      <User className="w-6 h-6 text-gray-600" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`flex-1 ${
                      message.sender === "user"
                        ? "flex flex-col items-end"
                        : ""
                    }`}
                  >
                    <div
                      className={`px-6 py-4 rounded-2xl max-w-2xl ${
                        message.sender === "bot"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {message.sender === "bot" ? (
                        <div className="markdown-content [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-3 [&>li]:mb-1 [&_strong]:font-semibold">
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{message.text}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-2">
                      {message.timestamp}
                    </span>
                  </div>
                </div>

                {/* Quick Questions: only after last bot message */}
                {message.sender === "bot" &&
                  index === messages.length - 1 &&
                  !isTyping && (
                    <div className="mt-6 ml-14">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Quick Questions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((question, qIndex) => (
                          <button
                            key={qIndex}
                            onClick={() => handleQuickQuestion(question)}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="px-6 py-4 rounded-2xl bg-gray-100">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex gap-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your question here..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed self-start"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This AI assistant provides general
            information and should not replace professional medical advice.
            Always consult with your healthcare provider for medical decisions
            and interpretation of your lab results.
          </p>
        </div>
      </div>
    </div>
  );
}
