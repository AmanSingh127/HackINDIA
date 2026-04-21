"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Bot, User, CheckCircle } from "lucide-react";
import { MAX_QUESTION_COUNT } from "@/lib/interview-config";

type Message = {
  id: string;
  role: "user" | "model";
  text: string;
};

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [interviewStatus, setInterviewStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED">("PENDING");
  const [finalSummary, setFinalSummary] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = useCallback(async (customInput?: string, isInitial: boolean = false) => {
    const textToSend = isInitial ? "START_INTERVIEW" : (customInput ?? "");
    
    if (!textToSend.trim()) return;

    if (!isInitial) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: textToSend }]);
      setInput("");
    }
    setLoading(true);

    try {
      const modelMessageId = crypto.randomUUID();
      setMessages((prev) => {
        return [...prev, { id: modelMessageId, role: "model", text: "" }];
      });

      const res = await fetch("/api/interview/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: textToSend, isInitial }),
      });
      if (!res.ok || !res.body) {
        throw new Error("Failed to start streaming interview response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let doneEventSeen = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        const events = buffered.split("\n\n");
        buffered = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.slice(6)) as
            | { type: "chunk"; text: string }
            | { type: "done"; status: "PENDING" | "IN_PROGRESS" | "COMPLETED"; finalSummary?: string | null }
            | { type: "error"; error: string };

          if (payload.type === "chunk") {
            setMessages((prev) =>
              prev.map((msg, index) =>
                msg.id === modelMessageId ? { ...msg, text: msg.text + payload.text } : msg
              )
            );
          }

          if (payload.type === "done") {
            doneEventSeen = true;
            if (payload.status === "COMPLETED") {
              setInterviewStatus("COMPLETED");
              if (payload.finalSummary) setFinalSummary(payload.finalSummary);
            }
          }

          if (payload.type === "error") {
            throw new Error(payload.error);
          }
        }
      }

      if (buffered.trim()) {
        const dataLine = buffered
          .split("\n")
          .find((line) => line.startsWith("data: "));
        if (dataLine) {
          const payload = JSON.parse(dataLine.slice(6)) as
            | { type: "chunk"; text: string }
            | { type: "done"; status: "PENDING" | "IN_PROGRESS" | "COMPLETED"; finalSummary?: string | null }
            | { type: "error"; error: string };
          if (payload.type === "chunk") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === modelMessageId ? { ...msg, text: msg.text + payload.text } : msg
              )
            );
          }
          if (payload.type === "done") {
            doneEventSeen = true;
            if (payload.status === "COMPLETED") {
              setInterviewStatus("COMPLETED");
              if (payload.finalSummary) setFinalSummary(payload.finalSummary);
            }
          }
          if (payload.type === "error") {
            throw new Error(payload.error);
          }
        }
      }

      if (!doneEventSeen) {
        throw new Error("Streaming response ended unexpectedly");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to fetch AI response");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Load initial state
  useEffect(() => {
    const initInterview = async () => {
      try {
        const res = await fetch(`/api/interview/chat?sessionId=${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        
        const data = await res.json();
        setInterviewStatus(data.status);
        
        if (data.transcript && data.transcript.length > 0) {
          setMessages(
            data.transcript.map((msg: { role: "user" | "model"; text: string }) => ({
              id: crypto.randomUUID(),
              role: msg.role,
              text: msg.text,
            }))
          );
        } else {
          // If no transcript, the AI needs to send the first message
          handleSendMessage("", true);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to initialize interview.");
      } finally {
        setLoading(false);
      }
    };
    initInterview();
  }, [sessionId, handleSendMessage]);

  const completeInterview = async () => {
    setLoading(true);
    try {
      await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setInterviewStatus("COMPLETED");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Connecting to AI Interviewer...</p>
        </div>
      </div>
    );
  }

  if (interviewStatus === "COMPLETED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Interview Completed</h2>
          <p className="text-slate-400 mb-8">
            Thank you for your time. The AI has evaluated your responses and the results have been sent to the recruiter.
          </p>
          {finalSummary && (
            <div className="text-left bg-slate-900/70 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Final Summary</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{finalSummary}</p>
            </div>
          )}
          <button 
            onClick={() => router.push("/")}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-3xl flex-1 flex flex-col bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Interviewer</h2>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Auto-finish after {MAX_QUESTION_COUNT} candidate responses
              </p>
            </div>
          </div>
          <button
            onClick={completeInterview}
            className="text-sm px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
          >
            End Interview
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-indigo-500/20 text-indigo-400"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-none"
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Bot size={16} />
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/80 border-t border-white/10 backdrop-blur-xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Type your response..."
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 text-white rounded-full transition-colors flex items-center justify-center"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
