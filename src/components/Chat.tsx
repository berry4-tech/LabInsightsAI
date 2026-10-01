// src/components/Chat.tsx
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Send, Bot, User, Sparkles, FileText, Wrench, ShieldCheck } from "lucide-react";
import { AI_SERVICE_URL } from "./config";
import ReactMarkdown from "react-markdown";
import { getAuthItem, getAuthToken } from "./utils/authStorage";

interface ChatProps {
  hasUploadedReports?: boolean;
}

type Sender = "user" | "bot";

interface Message {
  id: number;
  sender: Sender;
  text: string;
  timestamp: string;
  steps?: string[]; // tools the agent used for this answer
}

// Action the agent wants to take, waiting for the patient's approval
interface PendingAction {
  type: "doctor_request";
  doctor: { name: string; email: string; specialization: string };
  message: string;
  warning?: string | null;
}

interface AgentResponse {
  status: "done" | "awaiting_approval";
  answer?: string;
  pending_action?: PendingAction;
  trace?: { tool: string }[];
  thread_id: string;
}

const STEP_LABELS: Record<string, string> = {
  get_latest_report: "Read latest report",
  get_test_history: "Compared past reports",
  search_report_text: "Searched report text",
  find_doctors: "Looked up doctors",
  request_doctor_review: "Prepared doctor request",
};

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

  // Agent conversation state
  const [threadId, setThreadId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [editedRequest, setEditedRequest] = useState("");

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
  // Talk to the agent (falls back to the original RAG endpoint)
  // -----------------------------
  const addBotMessage = (text: string, steps?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, sender: "bot", text, timestamp: nowTime(), steps },
    ]);
  };

  const handleAgentResponse = (data: AgentResponse) => {
    setThreadId(data.thread_id);
    const steps = (data.trace || []).map((t) => STEP_LABELS[t.tool] || t.tool);

    if (data.status === "awaiting_approval" && data.pending_action) {
      addBotMessage(
        "I've drafted a request for a doctor to review your results. Nothing is sent until you approve it below.",
        steps
      );
      setPendingAction(data.pending_action);
      setEditedRequest(data.pending_action.message);
    } else {
      addBotMessage(data.answer || "Sorry, I couldn't process that.", steps);
    }
  };

  const callAgent = async (path: string, body: object) => {
    const token = getAuthToken();
    return fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  };

  const sendToBackend = async (msg: string) => {
    try {
      const email = getAuthItem("userEmail");
      const token = getAuthToken();

      if (!email || !token) {
        addBotMessage("Please sign in to use the chat feature.");
        return;
      }

      const res = await callAgent("/agent/chat", { message: msg, thread_id: threadId });

      if (res.status === 404 && !threadId) {
        // Agent not deployed on this AI service yet: use the original RAG chat
        const legacy = await fetch(`${API_BASE}/chat/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: msg, email }),
        });
        const legacyData = await legacy.json();
        addBotMessage(legacyData.answer || "Sorry, I couldn't process that.");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      handleAgentResponse(data);
    } catch (err: any) {
      console.error("Chat error:", err);
      addBotMessage(`Error: ${err.message || "Could not contact AI. Please try again."}`);
    } finally {
      setIsTyping(false);
    }
  };

  // Patient approves or cancels the drafted doctor request
  const handleDecision = async (approved: boolean) => {
    if (!threadId) return;
    setPendingAction(null);
    setIsTyping(true);
    try {
      const res = await callAgent("/agent/resume", {
        thread_id: threadId,
        approved,
        message: editedRequest,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      handleAgentResponse(data);
    } catch (err: any) {
      addBotMessage(`Error: ${err.message || "Could not reach the assistant."}`);
    } finally {
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
    setPendingAction(null);
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
    setPendingAction(null);
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
                    {message.steps && message.steps.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <Wrench className="w-3 h-3" />
                        <span>{message.steps.join(" → ")}</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500 mt-2">
                      {message.timestamp}
                    </span>
                  </div>
                </div>

                {/* Quick Questions: only after last bot message */}
                {message.sender === "bot" &&
                  index === messages.length - 1 &&
                  !isTyping &&
                  !pendingAction && (
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

            {/* Human-in-the-loop approval card */}
            {pendingAction && !isTyping && (
              <div className="ml-14 max-w-2xl border border-blue-200 bg-blue-50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-blue-800">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-semibold">Approve doctor request?</span>
                </div>
                <p className="text-sm text-gray-800 mb-1">
                  <strong>{pendingAction.doctor.name}</strong>
                  {" · "}
                  {pendingAction.doctor.specialization}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  They'll be able to see your uploaded reports if they accept.
                </p>
                {pendingAction.warning && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    {pendingAction.warning}
                  </p>
                )}
                <label className="text-xs font-medium text-gray-700">Message to the doctor</label>
                <textarea
                  value={editedRequest}
                  onChange={(e) => setEditedRequest(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full mt-1 mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision(true)}
                    disabled={!editedRequest.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Approve and send
                  </button>
                  <button
                    onClick={() => handleDecision(false)}
                    className="px-4 py-2 bg-white text-gray-700 text-sm border border-gray-300 rounded-xl hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
