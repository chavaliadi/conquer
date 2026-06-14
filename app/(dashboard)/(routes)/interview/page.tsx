"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Timer,
  ChevronLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useInterviewStore } from "@/lib/store/interview-store";

export default function InterviewPage() {
  const router = useRouter();
  const {
    activeSessionId,
    topic,
    difficulty,
    durationSeconds,
    timerActive,
    setTimerActive,
    incrementDuration,
    endSession,
    resetSession,
    startSession,
  } = useInterviewStore();

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [input, setInput] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Instantiating TextStreamChatTransport for compatibility with raw text stream from api/interview
  const transport = React.useMemo(() => {
    return new TextStreamChatTransport({
      api: "/api/interview",
      body: {
        sessionId: activeSessionId,
      },
    });
  }, [activeSessionId]);

  // Setup useChat hook
  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: () => {
      // Small delay to scroll down after text finishes streaming
      scrollToBottom();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({
      text: input,
    });
    setInput("");
  };

  // Client-side Session Restoration & Timer
  useEffect(() => {
    const initialize = async () => {
      let currentSessionId = activeSessionId;

      // If store is empty, fetch the latest active session from API
      if (!currentSessionId) {
        try {
          const res = await fetch("/api/sessions");
          if (res.ok) {
            const sessions = await res.json();
            const active = sessions.find((s: any) => s.status === "ACTIVE");
            if (active) {
              startSession(active.id, active.topic, active.difficulty);
              currentSessionId = active.id;
            } else {
              router.push("/dashboard");
              return;
            }
          } else {
            router.push("/dashboard");
            return;
          }
        } catch (e) {
          console.error("Failed to restore session:", e);
          router.push("/dashboard");
          return;
        }
      }

      // Load past messages for the session
      try {
        const historyRes = await fetch(`/api/interview?sessionId=${currentSessionId}`);
        if (historyRes.ok) {
          const pastMsgs = await historyRes.json();
          // Map schema format (role, content) to useChat Message format
          setMessages(
            pastMsgs.map((m: any) => ({
              id: String(m.id),
              role: m.role as "system" | "user" | "assistant",
              content: m.content,
              parts: [{ type: "text" as const, text: m.content }],
            }))
          );
        }
      } catch (e) {
        console.error("Failed to load message history:", e);
      } finally {
        setLoadingHistory(false);
      }
    };

    initialize();
  }, [activeSessionId, startSession, router, setMessages]);

  // Elapsed Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        incrementDuration();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, incrementDuration]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndInterview = async () => {
    if (!activeSessionId) return;
    setTimerActive(false);
    setEvaluating(true);

    try {
      const response = await fetch("/api/interview/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          durationSeconds: durationSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate interview");
      }

      const updatedSession = await response.json();
      setReport(updatedSession.report);
      endSession("COMPLETED");
    } catch (error) {
      console.error("Failed to evaluate interview:", error);
      alert("Something went wrong during evaluation. Please try again.");
      setTimerActive(true);
    } finally {
      setEvaluating(false);
    }
  };

  const handleBackToDashboard = () => {
    resetSession();
    router.push("/dashboard");
  };

  if (loadingHistory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm font-light">Loading interview workspace...</p>
      </div>
    );
  }

  // Render Scorecard/Report Screen
  if (report) {
    const dimScores = report.dimensionScores || {};
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24"
      >
        <div className="flex items-center gap-x-2 text-indigo-500 cursor-pointer text-sm font-medium hover:underline" onClick={handleBackToDashboard}>
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </div>

        {/* Evaluation Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Interview Scorecard</h2>
          <p className="text-muted-foreground text-sm">
            {topic} • {difficulty} Difficulty • Completed in {formatTime(durationSeconds)}
          </p>
        </div>

        {/* Hero Score Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Score Display */}
          <CardContainer className="bg-gradient-to-br from-indigo-900/30 via-slate-900 to-indigo-950/30 p-8 flex flex-col items-center justify-center text-center border-indigo-500/20 relative overflow-hidden md:col-span-1 min-h-[220px]">
            <div className="absolute top-0 right-0 p-3 text-indigo-400/30">
              <Sparkles className="w-16 h-16" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Overall Score</span>
            <div className="text-6xl md:text-7xl font-extrabold text-foreground mb-2 flex items-baseline gap-x-1">
              {report.overallScore}
              <span className="text-xl md:text-2xl font-light text-muted-foreground">/10</span>
            </div>
            <span className="text-xs text-muted-foreground text-center">
              Evaluated across 6 primary engineering dimensions
            </span>
          </CardContainer>

          {/* Dimension Breakdown */}
          <CardContainer className="bg-card p-6 md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80 flex items-center gap-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Dimension Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(dimScores).map(([dim, score]: [string, any]) => {
                // Formatting camelCase keys into display names
                const displayName = dim
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());
                
                // Color mapping based on score
                let barColor = "bg-rose-500";
                if (score >= 8) barColor = "bg-emerald-500";
                else if (score >= 6) barColor = "bg-indigo-500";

                return (
                  <div key={dim} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">{displayName}</span>
                      <span className="text-foreground">{score}/10</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score * 10}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContainer>
        </div>

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Strengths */}
          <CardContainer className="bg-card p-6 border-emerald-500/10">
            <h3 className="text-base font-semibold text-emerald-500 flex items-center gap-x-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Key Strengths
            </h3>
            <ul className="space-y-3">
              {(report.strengths || []).map((strength: string, i: number) => (
                <li key={i} className="text-sm text-foreground/85 flex items-start gap-x-3 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContainer>

          {/* Improvement Gaps */}
          <CardContainer className="bg-card p-6 border-rose-500/10">
            <h3 className="text-base font-semibold text-rose-500 flex items-center gap-x-2 mb-4">
              <AlertTriangle className="w-5 h-5" /> Gap Areas
            </h3>
            <ul className="space-y-3">
              {(report.gaps || []).map((gap: string, i: number) => (
                <li key={i} className="text-sm text-foreground/85 flex items-start gap-x-3 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </CardContainer>
        </div>

        {/* Actionable Suggestions */}
        <CardContainer className="bg-card p-6">
          <h3 className="text-base font-semibold text-indigo-500 flex items-center gap-x-2 mb-4">
            <Lightbulb className="w-5 h-5" /> Concrete Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(report.suggestions || []).map((sugg: string, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-neutral-500/5 border border-neutral-500/5 text-sm leading-relaxed text-foreground/90">
                {sugg}
              </div>
            ))}
          </div>
        </CardContainer>

        {/* Topics Not Covered */}
        {report.topicsNotCovered && report.topicsNotCovered.length > 0 && (
          <CardContainer className="bg-card p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Topics Uncovered / Worth Reviewing
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.topicsNotCovered.map((topicTag: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-muted-foreground font-medium">
                  {topicTag}
                </span>
              ))}
            </div>
          </CardContainer>
        )}

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleBackToDashboard}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-x-2 transition cursor-pointer active:scale-98 shadow-lg shadow-indigo-600/20"
          >
            Finish & Return <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Render active Chat Screen
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative bg-slate-950/20">
      
      {/* End Session Loading Modal overlay */}
      <AnimatePresence>
        {evaluating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-y-4"
          >
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <h3 className="text-lg font-semibold text-foreground">Evaluating Your Interview</h3>
            <p className="text-muted-foreground text-sm font-light text-center max-w-xs leading-relaxed px-4">
              Llama 3.3 70B is analyzing the full transcript against professional engineering rubrics...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interview Dashboard Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-card shadow-sm shrink-0">
        <div className="space-y-1">
          <h2 className="text-md font-semibold text-foreground truncate max-w-[200px] md:max-w-md">
            {topic}
          </h2>
          <p className="text-xs text-muted-foreground">
            {difficulty} Track
          </p>
        </div>
        <div className="flex items-center gap-x-4">
          {/* Timer Display */}
          <div className="flex items-center gap-x-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-semibold text-sm">
            <Timer className="w-4 h-4 animate-pulse" />
            {formatTime(durationSeconds)}
          </div>
          {/* End Interview */}
          <button
            onClick={handleEndInterview}
            className="px-4 py-1.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 font-semibold text-sm transition cursor-pointer"
          >
            End & Evaluate
          </button>
        </div>
      </div>

      {/* Messages Transcript Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-thin">
        {messages.filter(m => m.role !== "system").map((message) => {
          const isAI = message.role === "assistant";
          
          return (
            <div
              key={message.id}
              className={`flex w-full ${isAI ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] px-5 py-4 rounded-2xl border leading-relaxed text-sm ${
                  isAI
                    ? "bg-card border-border text-foreground"
                    : "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/10"
                }`}
              >
                {/* Format paragraphs/newlines simply */}
                {getMessageContent(message).split("\n").map((para: string, i: number) => (
                  <p key={i} className={para.trim() === "" ? "h-3" : "mb-2 last:mb-0"}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          );
        })}

        {/* Streaming / Typing Indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex w-full justify-start">
            <div className="max-w-[85%] px-5 py-4 rounded-2xl bg-card border border-border flex items-center gap-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-xs text-muted-foreground">Interviewer is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Reply Input Form */}
      <div className="p-4 border-t bg-card shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-x-4 relative">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              rows={2}
              placeholder="Type your structured answer here... (Shift+Enter for newline)"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 resize-none pr-12 scrollbar-none"
              onKeyDown={(e) => {
                // Submit form on Enter without Shift key
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                    handleSubmit(fakeEvent);
                  }
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-xl transition shrink-0 ${
              input.trim() && !isLoading
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/15 cursor-pointer"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="max-w-4xl mx-auto flex justify-between text-[10px] text-muted-foreground pt-1.5 px-1">
          <span>Press Enter to send</span>
          <span>Be detailed and use specific technical details.</span>
        </div>
      </div>
    </div>
  );
}

// Inline Styled Card Helper Component
function CardContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border transition-all duration-300 shadow-sm hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

// Helper to extract plain text content from a UIMessage
function getMessageContent(message: any): string {
  if (typeof message.content === "string" && message.content) {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  }
  return "";
}
