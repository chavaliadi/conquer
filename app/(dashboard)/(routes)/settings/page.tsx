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
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const [role, setRole] = useState("Fullstack Engineer");
  const [experience, setExperience] = useState("Mid-level");
  const [customKey, setCustomKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load preferences from localStorage on mount (mock preference storage)
  useEffect(() => {
    const savedRole = localStorage.getItem("conquer_pref_role");
    const savedExp = localStorage.getItem("conquer_pref_exp");
    const savedKey = localStorage.getItem("conquer_pref_key");
    if (savedRole) setRole(savedRole);
    if (savedExp) setExperience(savedExp);
    if (savedKey) setCustomKey(savedKey);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      localStorage.setItem("conquer_pref_role", role);
      localStorage.setItem("conquer_pref_exp", experience);
      localStorage.setItem("conquer_pref_key", customKey);
      setIsSaving(false);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 2500);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-10 pb-24">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Configure your mock interview preferences and API preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-x-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/15">
              <User className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Interview Profile</h3>
              <p className="text-xs text-muted-foreground font-light">
                Configure your target domain to personalize the default questions.
              </p>
            </div>
          </div>

          <Card className="p-6 border-neutral-900 bg-card space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Target Engineering Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
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
                  className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none"
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

        {/* Security & Keys Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-x-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/15">
              <Key className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">API Credentials</h3>
              <p className="text-xs text-muted-foreground font-light">
                Optionally use your own custom Groq API Key for query generation.
              </p>
            </div>
          </div>

          <Card className="p-6 border-neutral-900 bg-card space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Custom Groq API Key
              </label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 placeholder-neutral-700"
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
              className="flex items-center gap-x-1.5 text-xs text-emerald-450 font-medium"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Settings updated successfully!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
