import React from "react";
import TopicSelector from "@/components/interview/topic-selector";

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="text-center space-y-3 pt-6 max-w-2xl mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Conquer
        </h2>
        <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
          Simulate demanding technical interviews in real-time. Pick an interview track and difficulty to begin.
        </p>
      </div>
      <TopicSelector />
    </div>
  );
}