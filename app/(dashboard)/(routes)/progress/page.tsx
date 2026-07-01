"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Loader2,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ProgressPage() {
  const router = useRouter();

  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) {
          const data = await res.json();
          setProgressData(data);
        }
      } catch (err) {
        console.error("Failed to load progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const getDaysAgo = (dateStr: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground text-sm font-light">Loading performance analytics...</p>
      </div>
    );
  }

  // Aggregate strengths and gaps from all categories
  const allStrengths = Array.from(
    new Set(progressData.flatMap((p) => p.strengths || []))
  ).slice(0, 6);

  const allWeakAreas = Array.from(
    new Set(progressData.flatMap((p) => p.weakAreas || []))
  ).slice(0, 6);

  const hasData = progressData.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10 pb-24">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
          Performance Analytics
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Track average grading across interview categories and review AI-aggregated gap areas.
        </p>
      </div>

      {!hasData ? (
        <Card className="border-dashed border-neutral-200 dark:border-neutral-800 p-16 text-center flex flex-col items-center justify-center min-h-[400px] bg-card">
          <Activity className="w-12 h-12 text-neutral-500 dark:text-neutral-600 mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-foreground">No Performance Analytics Yet</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md leading-relaxed font-light">
            Once you complete a mock interview track and receive grading scores, aggregated charts, strengths, and study advice will generate here.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-x-2 transition cursor-pointer active:scale-98 shadow-md shadow-indigo-600/25"
          >
            Start Your First Simulator Session <ArrowRight className="w-4 h-4" />
          </button>
        </Card>
      ) : (
        <div className="space-y-10">
          
          {/* Categories Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground/80 pl-1 flex items-center gap-x-2">
              <Layers className="w-5 h-5 text-indigo-500" /> Category Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {progressData.map((category) => {
                const score = category.avgScore || 0;
                
                // SVG Progress Circle math
                const radius = 34;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (score / 10) * circumference;

                // Color mappings
                let ringColor = "stroke-rose-500";
                let badgeBg = "bg-rose-500/10 text-rose-500";
                if (score >= 8) {
                  ringColor = "stroke-emerald-500";
                  badgeBg = "bg-emerald-500/10 text-emerald-500";
                } else if (score >= 6) {
                  ringColor = "stroke-indigo-500";
                  badgeBg = "bg-indigo-500/10 text-indigo-500";
                }

                return (
                  <Card key={category.id} className="bg-card border-neutral-200 dark:border-neutral-900 overflow-hidden relative group hover:border-neutral-300 dark:hover:border-neutral-800 transition duration-300">
                    <CardContent className="p-5 flex flex-col items-center justify-between h-full text-center gap-y-4">
                      
                      {/* SVG Score Ring */}
                      <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                        <svg className="w-full h-full transform -rotate-90">
                          {/* Inner track */}
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className="stroke-neutral-200 dark:stroke-neutral-800 fill-none"
                            strokeWidth="5"
                          />
                          {/* Colored offset progress track */}
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            className={`${ringColor} fill-none transition-all duration-500`}
                            strokeWidth="5"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-xl font-extrabold text-foreground">{score.toFixed(1)}</span>
                          <span className="text-[9px] text-muted-foreground block leading-none font-light">/10</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground truncate max-w-[170px] mx-auto">
                          {category.topic}
                        </h4>
                        <div className="flex items-center justify-center gap-x-2 text-[10px] text-muted-foreground font-light">
                          <span>{category.sessionsCount} session{category.sessionsCount === 1 ? "" : "s"}</span>
                          <span>•</span>
                          <span>{getDaysAgo(category.lastPracticed)}</span>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Aggregated Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Consolidated Strengths */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 pl-1 flex items-center gap-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Key Strengths Aligned
              </h3>
              <Card className="bg-card border-neutral-200 dark:border-neutral-900 p-6 min-h-[220px]">
                {allStrengths.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">No insights aggregated yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {allStrengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-x-3 text-xs text-foreground/85 leading-relaxed">
                        <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mt-0.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        {str}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* Consolidated Focus Areas / Gaps */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground/80 pl-1 flex items-center gap-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Improvement Gaps Logged
              </h3>
              <Card className="bg-card border-neutral-200 dark:border-neutral-900 p-6 min-h-[220px]">
                {allWeakAreas.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-12">No insights aggregated yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {allWeakAreas.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-x-3 text-xs text-foreground/85 leading-relaxed">
                        <div className="p-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mt-0.5 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        {gap}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

          </div>

          {/* V2 Call to Action Block */}
          <Card className="bg-gradient-to-br from-indigo-50/20 via-neutral-50 to-indigo-50/20 dark:from-indigo-950/20 dark:via-neutral-900 dark:to-indigo-950/20 border-indigo-200 dark:border-indigo-500/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h4 className="text-md font-bold text-foreground flex items-center justify-center md:justify-start gap-x-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Unlock AI Study Plans (V2 Preview)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-light max-w-xl">
                Ready to accelerate your practice? V2 will introduce resume-aware mock interviewing and personalized AI-generated 2-week study schedules directly tailored to improve the gap areas logged above.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-x-1.5 transition shrink-0 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-98"
            >
              Start Practice Session <ArrowRight className="w-4 h-4" />
            </button>
          </Card>

        </div>
      )}
    </div>
  );
}
