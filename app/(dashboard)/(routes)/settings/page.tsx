"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Shield,
  Key,
  User,
  CheckCircle,
  Loader2,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const [role, setRole] = useState("Fullstack Engineer");
  const [experience, setExperience] = useState("Mid-level");
  const [difficulty, setDifficulty] = useState("Medium");
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [customPersona, setCustomPersona] = useState("");
  const [customKey, setCustomKey] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("conquer_pref_role");
    const savedExp = localStorage.getItem("conquer_pref_exp");
    const savedDiff = localStorage.getItem("conquer_pref_diff");
    const savedGoal = localStorage.getItem("conquer_weekly_goal");
    const savedPersona = localStorage.getItem("conquer_pref_persona");
    const savedKey = localStorage.getItem("conquer_pref_key");

    if (savedRole) setRole(savedRole);
    if (savedExp) setExperience(savedExp);
    if (savedDiff) setDifficulty(savedDiff);
    if (savedGoal) setWeeklyGoal(parseInt(savedGoal) || 3);
    if (savedPersona) setCustomPersona(savedPersona);
    if (savedKey) setCustomKey(savedKey);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      localStorage.setItem("conquer_pref_role", role);
      localStorage.setItem("conquer_pref_exp", experience);
      localStorage.setItem("conquer_pref_diff", difficulty);
      localStorage.setItem("conquer_weekly_goal", weeklyGoal.toString());
      localStorage.setItem("conquer_pref_persona", customPersona);
      localStorage.setItem("conquer_pref_key", customKey);
      
      setIsSaving(false);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 2500);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-10 pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-850 pb-6 space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-950 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Configure your mock interview preferences, target calibration, and API preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-x-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/15">
              <User className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Interview Profile</h3>
              <p className="text-xs text-muted-foreground font-light">
                Configure your target domain to personalize the default questions.
              </p>
            </div>
          </div>

          <Card className="p-6 border-neutral-200 dark:border-neutral-900 bg-white dark:bg-card space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Target Engineering Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Fullstack Engineer">Fullstack Engineer</option>
                  <option value="Mobile Engineer (iOS/Android)">Mobile Engineer (iOS/Android)</option>
                  <option value="DevOps / SRE Engineer">DevOps / SRE Engineer</option>
                  <option value="Machine Learning / AI Engineer">Machine Learning / AI Engineer</option>
                </select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Target Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Junior (0-2 years)">Junior (0-2 years)</option>
                  <option value="Mid-level (2-5 years)">Mid-level (2-5 years)</option>
                  <option value="Senior (5+ years)">Senior (5+ years)</option>
                  <option value="Staff / Principal Developer">Staff / Principal Developer</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Calibration Preferences Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-x-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/15">
              <Sliders className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Mock Interview Calibration</h3>
              <p className="text-xs text-muted-foreground font-light">
                Configure your target parameters and interview difficulties.
              </p>
            </div>
          </div>

          <Card className="p-6 border-neutral-200 dark:border-neutral-900 bg-white dark:bg-card space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preferred Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Preferred Default Difficulty
                </label>
                <div className="flex gap-x-2">
                  {["Easy", "Medium", "Hard"].map((diff) => {
                    const isSelected = difficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none
                          ${isSelected
                            ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/10"
                            : "bg-white dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-muted-foreground hover:border-neutral-400 dark:hover:border-neutral-750"
                          }`}
                      >
                        {diff}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Mock Goal */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Target Weekly Mock Goal
                </label>
                <div className="flex items-center gap-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <span className="text-sm font-bold w-6 text-right">
                    {weeklyGoal}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-light">
                  Sessions recommended per week.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Custom Persona Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-x-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/15">
              <Sparkles className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Interviewer Persona</h3>
              <p className="text-xs text-muted-foreground font-light">
                Provide custom rules or styling instructions to override how the AI conducts mock sessions.
              </p>
            </div>
          </div>

          <Card className="p-6 border-neutral-200 dark:border-neutral-900 bg-white dark:bg-card space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Custom Guidelines / Persona Override
              </label>
              <textarea
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                placeholder="e.g. 'Act like a strict, old-school systems engineer. Focus heavily on memory leaks, low level optimization, and challenge my architectural assumptions.'"
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 placeholder-neutral-400 dark:placeholder-neutral-700 min-h-[90px] resize-y"
              />
              <p className="text-[10px] text-muted-foreground font-light">
                These rules will be appended to the AI interviewer&apos;s system prompt initialization.
              </p>
            </div>
          </Card>
        </div>

        {/* Security & Keys Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-x-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/15">
              <Key className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">API Credentials</h3>
              <p className="text-xs text-muted-foreground font-light">
                Optionally use your own custom Groq API Key for query generation.
              </p>
            </div>
          </div>

          <Card className="p-6 border-neutral-200 dark:border-neutral-900 bg-white dark:bg-card space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Custom Groq API Key
              </label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 placeholder-neutral-400 dark:placeholder-neutral-700"
              />
              <p className="text-[10px] text-muted-foreground font-light flex items-center gap-x-1.5 pt-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-500" />
                Your credentials are saved locally in your browser and never transit outside our mock API servers.
              </p>
            </div>
          </Card>
        </div>

        {/* Save button and alerts */}
        <div className="flex items-center gap-x-4 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold flex items-center justify-center gap-x-2 transition cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes
              </>
            ) : (
              "Save Settings"
            )}
          </button>

          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-x-1.5 text-xs text-emerald-600 dark:text-emerald-450 font-medium"
            >
              <CheckCircle className="w-4 h-4 text-emerald-550 dark:text-emerald-500" />
              Settings updated successfully!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
