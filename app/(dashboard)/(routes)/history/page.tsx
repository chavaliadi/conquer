"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Filter,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  X,
  Clock,
  MessageSquare,
  Sparkles,
  Loader2,
  Share2,
  Globe,
  Copy,
  Check,
  Printer,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function HistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected session for review
  const [reviewSession, setReviewSession] = useState<any>(null);
  const [reviewMessages, setReviewMessages] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);

  // Sharing states
  const [copiedLink, setCopiedLink] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);

  const activeReviewId = searchParams.get("sessionId");

  const confirmDelete = async () => {
    if (!deleteSessionId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions?sessionId=${deleteSessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
        if (reviewSession?.id === deleteSessionId) {
          setReviewSession(null);
          setReviewMessages([]);
        }
      }
    } catch (e) {
      console.error("Failed to delete session:", e);
    } finally {
      setIsDeleting(false);
      setDeleteSessionId(null);
    }
  };

  // Load all sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const openReview = useCallback(async (session: any) => {
    setReviewSession(session);
    setLoadingReview(true);
    
    // Add query param to URL to preserve state
    if (searchParams.get("sessionId") !== session.id) {
      router.push(`/history?sessionId=${session.id}`);
    }

    try {
      const messagesRes = await fetch(`/api/interview?sessionId=${session.id}`);
      if (messagesRes.ok) {
        const msgs = await messagesRes.json();
        // filter out system prompt
        setReviewMessages(msgs.filter((m: any) => m.role !== "system"));
      }
    } catch (e) {
      console.error("Failed to load transcript:", e);
    } finally {
      setLoadingReview(false);
    }
  }, [router, searchParams]);

  // Handle auto-open or change of review session from URL search query parameter
  useEffect(() => {
    if (activeReviewId && sessions.length > 0) {
      const match = sessions.find((s) => s.id === activeReviewId);
      if (match && match.status === "COMPLETED") {
        openReview(match);
      }
    } else if (!activeReviewId) {
      setReviewSession(null);
      setReviewMessages([]);
    }
  }, [activeReviewId, sessions, openReview]);

  const closeReview = () => {
    setReviewSession(null);
    setReviewMessages([]);
    setCopiedLink(false);
    router.push("/history");
  };

  const togglePublicVisibility = async () => {
    if (!reviewSession) return;
    setTogglingPublic(true);
    const newStatus = !reviewSession.isPublic;
    try {
      const res = await fetch(`/api/sessions/${reviewSession.id}/public`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReviewSession(updated);
        setSessions((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, isPublic: updated.isPublic } : s))
        );
      }
    } catch (e) {
      console.error("Failed to toggle public visibility:", e);
    } finally {
      setTogglingPublic(false);
    }
  };

  const copyShareLink = () => {
    if (!reviewSession) return;
    const url = `${window.location.origin}/session/${reviewSession.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter Logic
  const filteredSessions = sessions.filter((s) => {
    const topicMatch = selectedTopic === "All" || s.topic === selectedTopic;
    const diffMatch = selectedDifficulty === "All" || s.difficulty === selectedDifficulty;
    return topicMatch && diffMatch;
  });

  const uniqueTopics = ["All", ...Array.from(new Set(sessions.map((s) => s.topic)))];
  const uniqueDifficulties = ["All", "Easy", "Medium", "Hard"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm font-light">Loading interview history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 pb-24 relative">
      
      {/* Header */}
      <div className="border-b border-neutral-850 pb-6 space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Session History
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Review your completed technical interview transcripts and grading scorecards.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-neutral-900/30 p-4 rounded-xl border border-neutral-900">
        <div className="flex items-center gap-x-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Filters
        </div>
        
        {/* Topic Filter */}
        <div className="flex flex-col gap-y-1">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase pl-1">Track</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {uniqueTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-col gap-y-1">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase pl-1">Difficulty</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {uniqueDifficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* Count Badge */}
        <div className="ml-auto text-xs text-muted-foreground font-light">
          Showing {filteredSessions.length} session{filteredSessions.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <Card className="border-dashed border-neutral-800 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <MessageSquare className="w-10 h-10 text-neutral-600 mb-2" />
          <p className="text-sm text-neutral-400 font-light">No interviews match the selected filters.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try resetting your filters or start a new mock interview on the dashboard.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const isCompleted = session.status === "COMPLETED";

            return (
              <motion.div
                key={session.id}
                whileHover={{ y: -2 }}
                onClick={() => isCompleted && openReview(session)}
                className={`group border border-neutral-900 rounded-2xl bg-card hover:border-neutral-800 p-5 flex flex-col justify-between gap-y-4 transition duration-300 relative overflow-hidden ${
                  isCompleted ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                }`}
              >
                <div className="flex justify-between items-start gap-x-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base truncate max-w-[200px] md:max-w-xs text-foreground group-hover:text-indigo-400 transition-colors">
                      {session.topic}
                    </h3>
                    <div className="flex items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 font-medium">
                        {session.difficulty}
                      </span>
                      <span>•</span>
                      <span>{formatDate(session.createdAt)}</span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-start gap-x-2 text-right">
                      <div>
                        <div className="text-xl font-extrabold text-foreground">
                          {session.overallScore?.toFixed(1) || "0.0"}
                          <span className="text-xs font-light text-muted-foreground">/10</span>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Graded
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionId(session.id);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                        title="Delete Mock Interview"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-x-2 text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold uppercase animate-pulse border border-amber-500/10">
                        Unfinished
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionId(session.id);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-900 pt-3 text-xs text-muted-foreground font-light">
                  <div className="flex items-center gap-x-3">
                    <span className="flex items-center gap-x-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      {formatDuration(session.durationSeconds)}
                    </span>
                    <span className="flex items-center gap-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                      {session.totalTurns} turns
                    </span>
                  </div>
                  {isCompleted && (
                    <span className="text-indigo-500 group-hover:text-indigo-400 font-semibold flex items-center gap-x-0.5 transition-colors">
                      Review Scorecard <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Slide Drawer Panel Overlay */}
      <AnimatePresence>
        {reviewSession && (
          <>
            {/* Dark backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeReview}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full md:w-[75%] lg:w-[60%] bg-[#0B0F19] border-l border-neutral-900 z-50 flex flex-col justify-between overflow-hidden shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="border-b border-neutral-900 p-5 flex items-center justify-between bg-card">
                <div>
                  <h3 className="font-extrabold text-lg text-foreground truncate max-w-[250px] md:max-w-md">
                    {reviewSession.topic}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-light">
                    {reviewSession.difficulty} Track • Completed {formatDate(reviewSession.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeReview}
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content Scroll Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                
                {/* Score Summary Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-gradient-to-br from-indigo-950/20 via-neutral-900 to-indigo-950/20 p-6 rounded-2xl border border-indigo-500/10">
                  <div className="flex flex-col items-center justify-center text-center sm:border-r border-neutral-900 sm:pr-4">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Overall Score</span>
                    <div className="text-4xl md:text-5xl font-extrabold text-foreground flex items-baseline gap-x-0.5">
                      {reviewSession.overallScore?.toFixed(1) || "0.0"}
                      <span className="text-sm font-light text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5 flex flex-col justify-center">
                    <span className="text-xs font-semibold text-foreground/80">Evaluation Performance Summary</span>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light">
                      This feedback scorecard was compiled by Llama 3.3 70B across six engineering dimensions based on the candidate&apos;s answers and technical details.
                    </p>
                  </div>
                </div>

                {/* Share & Print Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-neutral-900 text-xs">
                  <div className="flex items-center gap-x-6">
                    {/* Public Share Toggle */}
                    <div className="flex items-center gap-x-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-foreground/80">Public Sharing</span>
                      <button
                        onClick={togglePublicVisibility}
                        disabled={togglingPublic}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                          reviewSession.isPublic ? "bg-indigo-600 justify-end" : "bg-neutral-800 justify-start"
                        }`}
                      >
                        <motion.div
                          layout
                          className="w-4 h-4 rounded-full bg-white"
                        />
                      </button>
                    </div>

                    {/* Copy Link Button */}
                    {reviewSession.isPublic && (
                      <button
                        onClick={copyShareLink}
                        className="flex items-center gap-x-1.5 px-3 py-1 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/20 transition cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied Link
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Share Link
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={() => window.open(`/session/${reviewSession.id}/print`, "_blank")}
                    className="flex items-center gap-x-1.5 px-3 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:text-white transition cursor-pointer text-muted-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" /> Export PDF Report
                  </button>
                </div>

                {/* Main Tabs (Scorecard vs Transcript) */}
                <DrawerTabs 
                  scorecard={
                    <div className="space-y-6">
                      {/* Dimension Scores */}
                      <Card className="bg-card/30 border-neutral-900 p-5 space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-x-2">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Dimension breakdown
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          {Object.entries(reviewSession.report?.dimensionScores || {}).map(([dim, score]: [string, any]) => {
                            const displayName = dim
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase());
                            
                            let barColor = "bg-rose-500";
                            if (score >= 8) barColor = "bg-emerald-500";
                            else if (score >= 6) barColor = "bg-indigo-500";

                            return (
                              <div key={dim} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="text-muted-foreground">{displayName}</span>
                                  <span className="text-foreground">{score}/10</span>
                                </div>
                                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score * 10}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>

                      {/* Strengths & Gaps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-card border border-emerald-500/10 space-y-3">
                          <h4 className="text-sm font-semibold text-emerald-500 flex items-center gap-x-2">
                            <CheckCircle2 className="w-4 h-4" /> Core Strengths
                          </h4>
                          <ul className="space-y-2.5 text-xs text-foreground/80 pl-1">
                            {(reviewSession.report?.strengths || []).map((strength: string, i: number) => (
                              <li key={i} className="flex items-start gap-x-2 leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-rose-500/10 space-y-3">
                          <h4 className="text-sm font-semibold text-rose-500 flex items-center gap-x-2">
                            <AlertTriangle className="w-4 h-4" /> Focus Gaps
                          </h4>
                          <ul className="space-y-2.5 text-xs text-foreground/80 pl-1">
                            {(reviewSession.report?.gaps || []).map((gap: string, i: number) => (
                              <li key={i} className="flex items-start gap-x-2 leading-relaxed">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="p-5 rounded-xl bg-card border border-neutral-900 space-y-3">
                        <h4 className="text-sm font-semibold text-indigo-500 flex items-center gap-x-2">
                          <Lightbulb className="w-4 h-4" /> Study Recommendations
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(reviewSession.report?.suggestions || []).map((sugg: string, i: number) => (
                            <div key={i} className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-950 text-xs leading-relaxed text-foreground/90">
                              {sugg}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Uncovered Topics */}
                      {reviewSession.report?.topicsNotCovered && reviewSession.report.topicsNotCovered.length > 0 && (
                        <div className="space-y-2 pl-1">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Topics Left Uncovered
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {reviewSession.report.topicsNotCovered.map((t: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-850 text-[10px] text-muted-foreground font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  }
                  transcript={
                    <div className="space-y-4">
                      {loadingReview ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-y-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <span className="text-xs text-muted-foreground">Loading chat history...</span>
                        </div>
                      ) : reviewMessages.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No conversation logs found.</p>
                      ) : (
                        <div className="space-y-4 pl-1 pr-1 max-h-[500px] overflow-y-auto">
                          {reviewMessages.map((message) => {
                            const isAI = message.role === "assistant";
                            return (
                              <div
                                key={message.id}
                                className={`flex w-full ${isAI ? "justify-start" : "justify-end"}`}
                              >
                                <div
                                  className={`max-w-[90%] px-4 py-3 rounded-xl border leading-relaxed text-xs relative ${
                                    isAI
                                      ? "bg-neutral-950 border-neutral-900 text-foreground"
                                      : "bg-indigo-600 border-indigo-700 text-white"
                                  }`}
                                >
                                  {message.content.split("\n").map((para: string, idx: number) => (
                                    <p key={idx} className={para.trim() === "" ? "h-2" : "mb-1 last:mb-0"}>
                                      {para}
                                    </p>
                                  ))}

                                  {/* Answer Score badge for user responses */}
                                  {!isAI && message.answerScore !== null && message.answerScore !== undefined && (
                                    <div className="mt-2.5 flex flex-col gap-y-1 pt-2 border-t border-indigo-500/35 text-[10px]">
                                      <div className="flex items-center gap-x-2">
                                        <span className="text-indigo-200/90 font-medium">Answer Score:</span>
                                        <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                          message.answerScore >= 8
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : message.answerScore >= 6
                                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                        }`}>
                                          {message.answerScore}/10
                                        </span>
                                      </div>
                                      {message.feedback && (
                                        <p className="text-indigo-100/80 font-light leading-relaxed italic">
                                          &quot;{message.feedback}&quot;
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-neutral-900 p-4 bg-card flex justify-end">
                <button
                  onClick={closeReview}
                  className="px-5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-900 text-xs font-semibold text-foreground cursor-pointer transition"
                >
                  Close Review
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteSessionId && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteSessionId(null)}
              className="fixed inset-0 bg-black z-[100] cursor-pointer"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[#0F131E] border border-neutral-800 p-6 rounded-2xl z-[110] space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-foreground">Delete Session?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">
                  Permanently erase this mock interview evaluation scorecard and chat dialogue? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-x-3">
                <button
                  onClick={() => setDeleteSessionId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-xs font-semibold text-muted-foreground hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition cursor-pointer flex items-center gap-x-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom Drawer Tabs Component to toggle between Scorecard and Transcript
function DrawerTabs({ scorecard, transcript }: { scorecard: React.ReactNode; transcript: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<"scorecard" | "transcript">("scorecard");

  return (
    <div className="space-y-6">
      <div className="flex border-b border-neutral-900">
        <button
          onClick={() => setActiveTab("scorecard")}
          className={`flex-1 py-2.5 text-center text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
            activeTab === "scorecard" 
              ? "text-indigo-400 border-indigo-500" 
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Detailed Scorecard
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={`flex-1 py-2.5 text-center text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
            activeTab === "transcript" 
              ? "text-indigo-400 border-indigo-500" 
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Chat Transcript
        </button>
      </div>
      <div>
        {activeTab === "scorecard" ? scorecard : transcript}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm font-light">Loading interview history...</p>
      </div>
    }>
      <HistoryContent />
    </React.Suspense>
  );
}
