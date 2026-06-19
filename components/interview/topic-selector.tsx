"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Code2, Server, Users, Laptop, BrainCircuit, Loader2, FileText, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useInterviewStore } from "@/lib/store/interview-store";

const topics = [
  {
    id: "ds_algo",
    name: "Data Structures & Algorithms",
    description: "Classic CS algorithmic puzzles, complexity analysis, and problem-solving.",
    icon: Code2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "group-hover:border-blue-500/30",
  },
  {
    id: "system_design",
    name: "System Design",
    description: "Architecture, scalability, database choices, load balancing, and design paradigms.",
    icon: Server,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "group-hover:border-violet-500/30",
  },
  {
    id: "behavioral",
    name: "Behavioral",
    description: "STAR method stories, leadership principles, conflict resolution, and teamwork.",
    icon: Users,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "group-hover:border-amber-500/30",
  },
  {
    id: "frontend_backend",
    name: "Frontend/Backend",
    description: "Framework-specific technical questions, APIs, security, and rendering dynamics.",
    icon: Laptop,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "group-hover:border-emerald-500/30",
  },
];

const difficulties = ["Easy", "Medium", "Hard"];

export default function TopicSelector() {
  const router = useRouter();
  const startSession = useInterviewStore((state) => state.startSession);

  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  // Check if user has a resume uploaded
  useEffect(() => {
    const checkResume = async () => {
      try {
        const res = await fetch("/api/resume/upload");
        if (res.ok) {
          const data = await res.json();
          setHasResume(data.hasResume);
        }
      } catch {
        // Silent fail — not critical
      }
    };
    checkResume();
  }, []);

  const handleStart = async () => {
    if (!selectedTopic) return;
    setLoading(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const session = await response.json();
      startSession(session.id, session.topic, session.difficulty);
      router.push("/interview");
    } catch (error) {
      console.error("Failed to start session:", error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">

      {/* Resume-Aware Mode Status Badge */}
      {hasResume ? (
        <div className="flex items-center gap-x-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-400/90 font-light leading-relaxed">
            <span className="font-bold text-emerald-300">Resume-Aware Mode Active</span> — the AI will reference your uploaded resume to ask personalized technical questions.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-x-3 px-4 py-3 rounded-xl bg-neutral-900/50 border border-dashed border-neutral-800">
          <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            Upload your resume in{" "}
            <a href="/settings" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">Settings</a>{" "}
            to enable Resume-Aware interviews tailored to your background.
          </p>
        </div>
      )}

      {/* Step 1: Choose Topic */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-x-2 text-foreground/80">
          <BrainCircuit className="w-5 h-5 text-indigo-500" />
          Step 1: Choose Your Interview Track
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isSelected = selectedTopic === topic.name;

            return (
              <motion.div
                key={topic.id}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedTopic(topic.name)}
                className="cursor-pointer"
              >
                <Card
                  className={`p-5 flex gap-x-4 border transition-all duration-300 relative overflow-hidden group ${
                    isSelected
                      ? "border-indigo-500/80 bg-indigo-500/5 shadow-md shadow-indigo-500/10"
                      : "hover:border-neutral-300 dark:hover:border-neutral-700 bg-card"
                  }`}
                >
                  <div className={`p-3 rounded-xl h-fit w-fit ${topic.bgColor}`}>
                    <Icon className={`w-6 h-6 ${topic.color}`} />
                  </div>
                  <div className="space-y-1 pr-6">
                    <h4 className="font-semibold text-foreground">{topic.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Choose Difficulty */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-x-2 text-foreground/80">
          <BrainCircuit className="w-5 h-5 text-indigo-500" />
          Step 2: Choose Difficulty
        </h3>
        <div className="flex gap-4">
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff;
            let diffColor = "bg-neutral-500/10 text-neutral-500 hover:bg-neutral-500/20";
            if (isSelected) {
              if (diff === "Easy") diffColor = "bg-emerald-500 text-white shadow-md shadow-emerald-500/20";
              if (diff === "Medium") diffColor = "bg-indigo-500 text-white shadow-md shadow-indigo-500/20";
              if (diff === "Hard") diffColor = "bg-rose-500 text-white shadow-md shadow-rose-500/20";
            } else {
              if (diff === "Easy") diffColor = "border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5";
              if (diff === "Medium") diffColor = "border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5";
              if (diff === "Hard") diffColor = "border border-rose-500/20 text-rose-500 hover:bg-rose-500/5";
            }

            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                disabled={loading}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex-1 md:flex-initial md:px-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${diffColor}`}
              >
                {diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Start Button */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleStart}
          disabled={loading || !selectedTopic}
          className={`w-full md:w-auto px-10 py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-x-2 cursor-pointer ${
            selectedTopic
              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-98"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initializing Session...
            </>
          ) : (
            "Start Interview Simulator"
          )}
        </button>
      </div>
    </div>
  );
}
