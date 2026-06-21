import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import PrintTrigger from "./print-trigger";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintSessionPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  // Fetch session data (print page checks isPublic just like the public route, or we can check auth. Since it might be printed by the user, we can support either)
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id));

  if (!session) {
    return notFound();
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
    <div className="bg-white text-neutral-900 p-8 max-w-4xl mx-auto font-sans leading-relaxed text-sm">
      {/* Header */}
      <div className="border-b-2 border-neutral-800 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">Conquer Mock Interview Report</h1>
          <p className="text-neutral-500 text-xs mt-1">
            Session ID: {session.id} • Completed on {new Date(session.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-neutral-600">OVERALL SCORE</span>
          <div className="text-3xl font-extrabold text-indigo-700">{session.overallScore} / 10</div>
        </div>
      </div>

      {/* Metadata Table */}
      <table className="w-full border-collapse mb-8 text-xs text-neutral-700">
        <tbody>
          <tr>
            <td className="py-2 pr-4 font-bold border-b border-neutral-200 w-1/4">Track Topic:</td>
            <td className="py-2 border-b border-neutral-200">{session.topic}</td>
            <td className="py-2 px-4 font-bold border-b border-neutral-200 w-1/4">Difficulty:</td>
            <td className="py-2 border-b border-neutral-200">{session.difficulty}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-bold border-b border-neutral-200">Session Mode:</td>
            <td className="py-2 border-b border-neutral-200">{session.mode}</td>
            <td className="py-2 px-4 font-bold border-b border-neutral-200">Duration:</td>
            <td className="py-2 border-b border-neutral-200">{formatTime(session.durationSeconds)}</td>
          </tr>
        </tbody>
      </table>

      {/* Dimension Scores */}
      <div className="mb-8">
        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 border-b border-neutral-300 pb-1.5 mb-3">
          Dimension Scores Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries(dimScores).map(([dim, score]: [string, any]) => {
            const displayName = dim
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());

            return (
              <div key={dim} className="flex justify-between items-center py-1 border-b border-neutral-100 text-xs">
                <span className="text-neutral-600">{displayName}</span>
                <span className="font-bold text-neutral-900">{score} / 10</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-2 gap-x-8 mb-8">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-emerald-300 pb-1.5 mb-3">
            Key Strengths
          </h3>
          <ul className="list-disc pl-4 space-y-2 text-xs text-neutral-700">
            {(report.strengths || []).map((strength: string, i: number) => (
              <li key={i}>{strength}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-rose-800 border-b border-rose-300 pb-1.5 mb-3">
            Improvement Gap Areas
          </h3>
          <ul className="list-disc pl-4 space-y-2 text-xs text-neutral-700">
            {(report.gaps || []).map((gap: string, i: number) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Suggestions */}
      <div className="mb-8">
        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 border-b border-neutral-300 pb-1.5 mb-3">
          Concrete Improvement Suggestions
        </h3>
        <ul className="list-decimal pl-4 space-y-2 text-xs text-neutral-700">
          {(report.suggestions || []).map((sugg: string, i: number) => (
            <li key={i}>{sugg}</li>
          ))}
        </ul>
      </div>

      {/* Uncovered Topics */}
      {report.topicsNotCovered && report.topicsNotCovered.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 border-b border-neutral-300 pb-1.5 mb-3">
            Recommended Topics for Review
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {report.topicsNotCovered.join(", ")}
          </p>
        </div>
      )}

      {/* Chat Transcript */}
      <div className="page-break-before">
        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 border-b-2 border-neutral-800 pb-1.5 mb-4">
          Complete Conversation Transcript
        </h3>
        <div className="space-y-4">
          {history
            .filter((m) => m.role !== "system")
            .map((message) => {
              const isAI = message.role === "assistant";
              return (
                <div key={message.id} className="text-xs border-l-2 border-neutral-200 pl-4 py-1">
                  <div className="font-bold text-neutral-600 mb-1">
                    {isAI ? "INTERVIEWER (AI)" : "CANDIDATE (User)"}
                  </div>
                  <div className="text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  {!isAI && message.answerScore !== null && (
                    <div className="mt-2 text-neutral-500 bg-neutral-50 p-2 rounded border border-neutral-100 flex flex-col gap-y-1">
                      <div>
                        <strong>Question Score:</strong> {message.answerScore}/10
                      </div>
                      {message.feedback && (
                        <div>
                          <strong>Feedback:</strong> {message.feedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Client Trigger for PDF generation */}
      <PrintTrigger />
    </div>
  );
}
