"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Award, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  Loader2, 
  Play, 
  RotateCcw,
  Sparkles,
  Target,
  AlertTriangle,
  CircleDot,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TopicSelector from "@/components/interview/topic-selector";
import { useInterviewStore } from "@/lib/store/interview-store";

export default function DashboardPage() {
  const router = useRouter();
  const startSessionStore = useInterviewStore((state) => state.startSession);

  const [sessions, setSessions] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetGoal, setTargetGoal] = useState(3);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: "0.0",
    tracksCovered: 0,
  });

  useEffect(() => {
    const savedGoal = localStorage.getItem("conquer_weekly_goal");
    if (savedGoal) setTargetGoal(parseInt(savedGoal) || 3);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);

          // Calculate stats
          const completed = data.filter((s: any) => s.status === "COMPLETED");
          const totalCompleted = completed.length;
          
          let avg = "0.0";
          if (totalCompleted > 0) {
            const sum = completed.reduce((acc: number, curr: any) => acc + (curr.overallScore || 0), 0);
            avg = (sum / totalCompleted).toFixed(1);
          }

          const uniqueTopics = new Set(data.map((s: any) => s.topic));

          setStats({
            total: totalCompleted,
            avgScore: avg,
            tracksCovered: uniqueTopics.size,
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) {
          const data = await res.json();
          setProgressData(data);
        }
      } catch (e) {
        console.error("Failed to load progress data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchProgress();
  }, []);

  const handleResume = (session: any) => {
    startSessionStore(session.id, session.topic, session.difficulty);
    router.push("/interview");
  };

  const handleReview = (sessionId: string) => {
    router.push(`/history?sessionId=${sessionId}`);
  };

  const handleTrainGaps = async (weakestTopic: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: weakestTopic,
          difficulty: "Medium",
          mode: "WEAKNESS_TRAINER",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start weakness trainer session");
      }

      const session = await response.json();
      startSessionStore(
        session.id,
        session.topic,
        session.difficulty,
        session.mode,
        session.subTopic
      );
      router.push("/interview");
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm font-light">Loading stats & workspace...</p>
      </div>
    );
  }

  const recentSessions = sessions.slice(0, 3);
  const hasActiveSession = sessions.some(s => s.status === "ACTIVE");

  // Calculate weekly target progress (completed sessions in past 7 days)
  const completedThisWeek = sessions.filter((s: any) => {
    if (s.status !== "COMPLETED") return false;
    const createdDate = new Date(s.createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdDate >= oneWeekAgo;
  }).length;

  const weeklyProgressPercentage = Math.min(100, Math.round((completedThisWeek / targetGoal) * 100));

  // Extract top 3 weak areas
  const allWeakAreas = progressData.flatMap((p: any) => 
    (p.weakAreas || []).map((w: string) => ({ topic: p.topic, text: w }))
  ).slice(0, 3);

  // Identify weakest topic (lowest avgScore) with recorded gaps
  const weakestTopicRecord = progressData
    .filter(p => p.weakAreas && p.weakAreas.length > 0)
    .sort((a, b) => a.avgScore - b.avgScore)[0];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10 pb-24">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-x-4">
          <div className="relative w-12 h-12 shrink-0 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Image
              src="/logo-ai.png"
              alt="AI Vibe Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
              Conquer Prep Workspace
            </h2>
            <p className="text-muted-foreground text-sm font-light">
              Practice adaptive technical interviews and track your progress metrics.
            </p>
          </div>
        </div>
        {hasActiveSession && (
          <div className="inline-flex items-center gap-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold animate-pulse">
            <Sparkles className="w-4 h-4" /> Active session in progress!
          </div>
        )}
      </div>

      {/* Stats Cards Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900/40 dark:via-neutral-900/10 dark:to-neutral-950/40 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Mock Interviews
            </CardTitle>
            <Calendar className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Completed evaluations saved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900/40 dark:via-neutral-900/10 dark:to-neutral-950/40 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Overall Score Average
            </CardTitle>
            <Award className="w-4 h-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-baseline gap-x-0.5">
              {stats.avgScore}
              <span className="text-sm font-light text-muted-foreground">/10</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Weighted across core rubrics</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900/40 dark:via-neutral-900/10 dark:to-neutral-950/40 border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tracks Practiced
            </CardTitle>
            <Trophy className="w-4 h-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tracksCovered}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Unique technical areas loaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Resume Tracker & Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Topic Selector Area (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <TopicSelector />
        </div>

        {/* Right Sidebar Column (Recent Activity + Gaps Snapshot + Weekly Goals) */}
        <div className="space-y-6 h-fit">
          {/* Recent Activity Card */}
          <div className="space-y-3.5">
            <h3 className="text-lg font-bold text-foreground/80 pl-1">
              Recent Activity
            </h3>
            {recentSessions.length === 0 ? (
              <Card className="bg-card/50 border-dashed border-neutral-850 dark:border-neutral-800 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <Trophy className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-sm text-neutral-400 font-light">No sessions recorded yet.</p>
                <p className="text-xs text-muted-foreground mt-1 px-4 leading-relaxed">
                  Choose an interview track on the left to begin your first prep turn.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const isCompleted = session.status === "COMPLETED";
                  const dateLabel = new Date(session.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <Card 
                      key={session.id} 
                      className="bg-card border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-all duration-300 overflow-hidden"
                    >
                      <div className="p-4 flex flex-col justify-between h-full gap-y-3">
                        <div className="flex justify-between items-start gap-x-2">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold truncate max-w-[170px] text-foreground">
                              {session.topic}
                            </h4>
                            <div className="flex items-center gap-x-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium border border-neutral-200 dark:border-neutral-800">
                                {session.difficulty}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {dateLabel}
                              </span>
                            </div>
                          </div>
                          {isCompleted ? (
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-foreground">
                                {session.overallScore?.toFixed(1) || "0.0"}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-light">/10</span>
                            </div>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold uppercase animate-pulse">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-3">
                          <span className="text-[10px] text-muted-foreground font-light">
                            {isCompleted ? `${session.totalTurns} Turns` : "Unfinished"}
                          </span>
                          {isCompleted ? (
                            <button
                              onClick={() => handleReview(session.id)}
                              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-x-0.5 transition cursor-pointer"
                            >
                              Review Scorecard <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResume(session)}
                              className="px-3.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-x-1 transition cursor-pointer active:scale-97"
                            >
                              <Play className="w-3 h-3 fill-current" /> Resume
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gaps Snapshot Card (Whitespace Solution) */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground/80 pl-1">
              Ailment Snapshot
            </h3>
            <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-card space-y-4">
              <div className="flex items-center gap-x-2">
                <Target className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Top Gaps to Practice</span>
              </div>

              {allWeakAreas.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs text-muted-foreground font-light">No weaknesses logged yet! Keep practice active.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <ul className="space-y-2">
                    {allWeakAreas.map((gap, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex items-start gap-x-2.5 leading-relaxed bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800">
                        <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-neutral-600 dark:text-neutral-400 block text-[10px] uppercase">
                            {gap.topic}
                          </span>
                          {gap.text}
                        </div>
                      </li>
                    ))}
                  </ul>

                  {weakestTopicRecord && (
                    <button
                      onClick={() => handleTrainGaps(weakestTopicRecord.topic)}
                      className="w-full py-2 rounded-xl border border-rose-500/25 hover:bg-rose-500/5 text-rose-500 font-bold text-xs flex items-center justify-center gap-x-1.5 transition cursor-pointer"
                    >
                      <CircleDot className="w-3.5 h-3.5 animate-pulse" />
                      Practice Gaps: {weakestTopicRecord.topic.split(" ")[0]}...
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Weekly Goals Progress (Whitespace Solution) */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground/80 pl-1">
              Weekly Performance Target
            </h3>
            <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-card flex items-center justify-between gap-x-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Mock Goal Progress</span>
                <p className="text-2xl font-black text-foreground">
                  {completedThisWeek} <span className="text-xs font-light text-muted-foreground">/ {targetGoal} sessions</span>
                </p>
                <p className="text-[10px] text-muted-foreground font-light leading-relaxed">
                  {completedThisWeek >= targetGoal ? "🎯 Weekly goal achieved! Excellent work." : "Keep it active. Complete your weekly sessions."}
                </p>
              </div>

              {/* Progress Circle Visual */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-neutral-200 dark:stroke-neutral-800 fill-none"
                    strokeWidth="5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-indigo-600 dark:stroke-indigo-500 fill-none transition-all duration-550"
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - weeklyProgressPercentage / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-foreground">
                  {weeklyProgressPercentage}%
                </div>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}