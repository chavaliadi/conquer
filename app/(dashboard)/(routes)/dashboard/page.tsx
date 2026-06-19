"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Award, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  Loader2, 
  Play, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TopicSelector from "@/components/interview/topic-selector";
import { useInterviewStore } from "@/lib/store/interview-store";

export default function DashboardPage() {
  const router = useRouter();
  const startSessionStore = useInterviewStore((state) => state.startSession);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: "0.0",
    tracksCovered: 0,
  });

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

          // Count unique topics
          const uniqueTopics = new Set(data.map((s: any) => s.topic));

          setStats({
            total: totalCompleted,
            avgScore: avg,
            tracksCovered: uniqueTopics.size,
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleResume = (session: any) => {
    startSessionStore(session.id, session.topic, session.difficulty);
    router.push("/interview");
  };

  const handleReview = (sessionId: string) => {
    router.push(`/history?sessionId=${sessionId}`);
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10 pb-24">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            Conquer Prep Workspace
          </h2>
          <p className="text-muted-foreground text-sm font-light">
            Practice adaptive technical interviews and track your progress metrics.
          </p>
        </div>
        {hasActiveSession && (
          <div className="inline-flex items-center gap-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold animate-pulse">
            <Sparkles className="w-4 h-4" /> Active session in progress!
          </div>
        )}
      </div>

      {/* Stats Cards Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-neutral-900/40 via-neutral-900/10 to-neutral-950/40 border-neutral-800/80">
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

        <Card className="bg-gradient-to-br from-neutral-900/40 via-neutral-900/10 to-neutral-950/40 border-neutral-800/80">
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

        <Card className="bg-gradient-to-br from-neutral-900/40 via-neutral-900/10 to-neutral-950/40 border-neutral-800/80">
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

        {/* Recent Session Activity List (Right Column) */}
        <div className="space-y-4 h-fit">
          <h3 className="text-lg font-bold text-foreground/80 pl-1">
            Recent Activity
          </h3>
          {recentSessions.length === 0 ? (
            <Card className="bg-card/50 border-dashed border-neutral-800 p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
              <Trophy className="w-8 h-8 text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-400 font-light">No sessions recorded yet.</p>
              <p className="text-xs text-muted-foreground mt-1 px-4 leading-relaxed">
                Choose an interview track on the left to begin your first prep turn.
              </p>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {recentSessions.map((session) => {
                const isCompleted = session.status === "COMPLETED";
                const dateLabel = new Date(session.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <Card 
                    key={session.id} 
                    className="bg-card border-neutral-800 hover:border-neutral-700/80 transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-4 flex flex-col justify-between h-full gap-y-3">
                      <div className="flex justify-between items-start gap-x-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold truncate max-w-[170px] text-foreground">
                            {session.topic}
                          </h4>
                          <div className="flex items-center gap-x-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-muted-foreground font-medium">
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
                      <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
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

      </div>
    </div>
  );
}