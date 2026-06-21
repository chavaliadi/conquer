import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Timer,
  BookOpen,
  MessageSquareCode,
  ShieldAlert,
} from "lucide-react";

export const revalidate = 0; // Dynamic server rendering

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicSessionPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  // Fetch session data
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id));

  if (!session) {
    return notFound();
  }

  // Enforce privacy check
  if (!session.isPublic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-4 text-center">
        <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-4 animate-bounce">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Private Session</h2>
        <p className="text-muted-foreground text-sm font-light max-w-sm leading-relaxed">
          This mock interview evaluation is private. If you are the owner, please enable public sharing in your dashboard history panel.
        </p>
      </div>
    );
  }

  // Fetch transcript history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, id))
    .orderBy(asc(messages.createdAt));

  const report: any = session.report || {};
  const dimScores = report.dimensionScores || {};

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-foreground py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-10 pb-24">
        {/* Public Badge / Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2 text-indigo-500 font-bold text-lg">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>Conquer</span>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium">
            Shared Mock Evaluation
          </span>
        </div>

        {/* Evaluation Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Interview Evaluation</h1>
          <p className="text-muted-foreground text-sm md:text-base font-light">
            Topic: <span className="font-semibold text-foreground">{session.topic}</span> •{" "}
            {session.difficulty} Track • Completed in {formatTime(session.durationSeconds)}
          </p>
        </div>

        {/* Hero Score Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-900/10 p-8 rounded-2xl border border-indigo-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden md:col-span-1 min-h-[220px]">
            <div className="absolute top-0 right-0 p-3 text-indigo-400/20">
              <Sparkles className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              Overall Score
            </span>
            <div className="text-6xl md:text-7xl font-extrabold text-foreground mb-2 flex items-baseline gap-x-1">
              {session.overallScore}
              <span className="text-xl md:text-2xl font-light text-muted-foreground">/10</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Evaluated across 6 primary engineering dimensions
            </span>
          </div>

          {/* Dimension Scores */}
          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80 flex items-center gap-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Dimension Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(dimScores).map(([dim, score]: [string, any]) => {
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
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Strengths */}
          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/10">
            <h3 className="text-base font-semibold text-emerald-500 flex items-center gap-x-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Key Strengths
            </h3>
            <ul className="space-y-3">
              {(report.strengths || []).map((strength: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-foreground/85 flex items-start gap-x-3 leading-relaxed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Gap Areas */}
          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-rose-500/10">
            <h3 className="text-base font-semibold text-rose-500 flex items-center gap-x-2 mb-4">
              <AlertTriangle className="w-5 h-5" /> Gap Areas
            </h3>
            <ul className="space-y-3">
              {(report.gaps || []).map((gap: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-foreground/85 flex items-start gap-x-3 leading-relaxed"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actionable Suggestions */}
        <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border">
          <h3 className="text-base font-semibold text-indigo-500 flex items-center gap-x-2 mb-4">
            <Lightbulb className="w-5 h-5" /> Concrete Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(report.suggestions || []).map((sugg: string, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-neutral-500/5 border border-neutral-500/5 text-sm leading-relaxed text-foreground/90"
              >
                {sugg}
              </div>
            ))}
          </div>
        </div>

        {/* Topics Not Covered */}
        {report.topicsNotCovered && report.topicsNotCovered.length > 0 && (
          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-x-2">
              <BookOpen className="w-4 h-4" /> Recommended Topics to Review
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.topicsNotCovered.map((topicTag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-neutral-900 text-xs text-muted-foreground font-medium border border-border/40"
                >
                  {topicTag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chat Transcript Area */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-x-2 border-b border-border/40 pb-3">
            <MessageSquareCode className="w-5 h-5 text-indigo-500" /> Full Chat Transcript
          </h3>
          <div className="space-y-4">
            {history
              .filter((m) => m.role !== "system")
              .map((message) => {
                const isAI = message.role === "assistant";
                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${isAI ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] px-5 py-4 rounded-2xl border leading-relaxed text-sm ${
                        isAI
                          ? "bg-neutral-900/60 border-border text-foreground"
                          : "bg-indigo-950/40 border-indigo-800/40 text-foreground"
                      }`}
                    >
                      {message.content.split("\n").map((para, i) => (
                        <p key={i} className={para.trim() === "" ? "h-3" : "mb-2 last:mb-0"}>
                          {para}
                        </p>
                      ))}

                      {/* Display message score badges if present */}
                      {!isAI && message.answerScore !== null && (
                        <div className="mt-3 flex flex-col gap-y-1.5 pt-2.5 border-t border-border/20 text-xs">
                          <div className="flex items-center gap-x-2">
                            <span className="text-muted-foreground font-medium">Answer Score:</span>
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                message.answerScore >= 8
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                  : message.answerScore >= 6
                                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                              }`}
                            >
                              {message.answerScore}/10
                            </span>
                          </div>
                          {message.feedback && (
                            <p className="text-muted-foreground font-light leading-relaxed italic text-[11px]">
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
        </div>

        {/* Footer info */}
        <div className="text-center pt-8 text-xs text-muted-foreground font-light">
          Prepared using Conquer Interview Simulator. Create your own prep tracks at conquer.com
        </div>
      </div>
    </div>
  );
}
