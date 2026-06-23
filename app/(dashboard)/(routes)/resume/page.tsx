"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resume, setResume] = useState<{
    hasResume: boolean;
    fileName: string | null;
    uploadedAt: string | null;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Load existing resume status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/resume/upload");
        if (res.ok) {
          const data = await res.json();
          setResume(data);
        }
      } catch (e) {
        console.error("Failed to load resume status:", e);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF files are accepted.");
      setUploadState("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File too large — maximum 5MB.");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Upload failed");
      }

      const data = await res.json();
      setUploadState("success");
      setResume({
        hasResume: true,
        fileName: data.fileName,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Upload failed. Please try again.");
      setUploadState("error");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/resume/upload", { method: "DELETE" });
      if (res.ok) {
        setResume({ hasResume: false, fileName: null, uploadedAt: null });
        setUploadState("idle");
      }
    } catch (e) {
      console.error("Failed to delete resume:", e);
    } finally {
      setDeleting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadState("dragging");
  };

  const handleDragLeave = () => {
    if (uploadState === "dragging") setUploadState("idle");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-10 pb-24">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Resume Manager
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Manage your professional resume profile to enable customized, resume-aware mock interviews.
        </p>
      </div>

      {/* Resume Upload Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-x-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/15">
            <FileText className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Resume Workspace</h3>
            <p className="text-xs text-muted-foreground font-light">
              Upload your PDF resume to configure Resume-Aware interview mode.
            </p>
          </div>
        </div>

        {/* Resume-Aware Info Banner */}
        <div className="flex items-start gap-x-3 p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
          <Sparkles className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          <p className="text-xs text-teal-300/80 leading-relaxed">
            By uploading your resume, the AI interviewer will tailer questions directly to your{" "}
            <span className="text-teal-300 font-semibold">projects, companies, and actual tech stack</span>{" "}
            to simulate a realistic, targeted industry panel interview.
          </p>
        </div>

        {loadingStatus ? (
          <div className="flex items-center justify-center h-40 gap-x-2 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading resume status...
          </div>
        ) : resume?.hasResume ? (
          /* Active Resume Card */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 border-emerald-500/15 bg-gradient-to-br from-emerald-950/20 via-card to-card space-y-5">
              <div className="flex items-start justify-between gap-x-4">
                <div className="flex items-start gap-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-x-2">
                      <span className="text-sm font-bold text-foreground truncate max-w-[260px]">
                        {resume.fileName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/10 uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-light">
                      Uploaded {resume.uploadedAt ? formatDate(resume.uploadedAt) : "recently"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-x-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 font-light">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Resume-Aware Mode is{" "}
                <span className="font-bold text-emerald-300">ACTIVE</span> — your next mock interviews will be personalized.
              </div>

              <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-teal-450 hover:text-teal-400 transition cursor-pointer"
                >
                  Replace Resume
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-x-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 transition cursor-pointer disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove Resume
                </button>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Drop Zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => uploadState === "idle" || uploadState === "error" ? fileInputRef.current?.click() : null}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 min-h-[220px] flex flex-col items-center justify-center gap-y-4 px-8 cursor-pointer select-none
              ${uploadState === "dragging"
                ? "border-teal-500 bg-teal-500/5 scale-[1.01]"
                : uploadState === "uploading"
                  ? "border-neutral-700 bg-card cursor-not-allowed"
                  : uploadState === "error"
                    ? "border-rose-500/40 bg-rose-500/5"
                    : "border-neutral-800 hover:border-neutral-700 bg-card hover:bg-neutral-900/40"
              }`}
          >
            <AnimatePresence mode="wait">
              {uploadState === "uploading" ? (
                <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-y-3">
                  <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                  <p className="text-sm text-muted-foreground font-light">Extracting text and validating resume content...</p>
                </motion.div>
              ) : uploadState === "error" ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-y-3 text-center">
                  <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-7 h-7 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-400">Upload Failed</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">{errorMessage}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadState("idle"); }}
                    className="text-xs text-teal-400 hover:text-teal-300 transition font-semibold flex items-center gap-x-1"
                  >
                    <X className="w-3 h-3" /> Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-y-3 text-center">
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${uploadState === "dragging" ? "bg-teal-500/15 border-teal-500/30" : "bg-neutral-900 border-neutral-800"}`}>
                    <Upload className={`w-8 h-8 transition-colors ${uploadState === "dragging" ? "text-teal-400" : "text-neutral-500"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {uploadState === "dragging" ? "Drop your PDF here" : "Drag & drop your resume"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or <span className="text-teal-400 font-semibold">click to browse</span> — PDF only, max 5MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
