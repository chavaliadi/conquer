"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  Terminal, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-x-2.5">
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-44">
              <Image
                src="/logo-horizontal-dark.png"
                alt="Conquer Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-x-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-slate-300 hover:text-white text-sm font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 text-sm font-semibold transition-all">
              Register
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 max-w-3xl"
        >
          {/* Primary Logo Showcase */}
          <motion.div variants={itemVariants} className="flex justify-center mb-4">
            <div className="relative w-44 h-44 md:w-52 md:h-52 select-none pointer-events-none drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]">
              <Image
                src="/logo-primary.png"
                alt="Conquer Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Tagline Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Interview Simulation
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants} 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-br from-white via-slate-100 to-slate-500 bg-clip-text text-transparent"
          >
            Conquer Your Next <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Technical Interview
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants} 
            className="text-base md:text-lg text-slate-400 font-light leading-relaxed max-w-2xl mx-auto"
          >
            Conquer is not a simple quiz application. It is an adaptive simulation that grills you on system trade-offs, algorithms, and behavioral STAR alignment in real-time, delivering a structured dimension scorecard.
          </motion.p>

          {/* Call to Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto px-8 py-6 text-base bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl shadow-indigo-600/25 font-bold flex items-center justify-center gap-x-2 group transition-all duration-300">
                Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-base border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl font-semibold transition-all">
                Try Demo Mode
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 max-w-5xl"
        >
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition duration-300 flex flex-col items-center text-center space-y-4 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Adaptive AI Drilling</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Powered by Llama 3.3. Adapts dynamically, asking deep follow-up questions to test details, not just surface knowledge.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition duration-300 flex flex-col items-center text-center space-y-4 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">STAR & Depth Rubrics</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Scorecards graded across six criteria including communication, technical depth, follow-up handling, and specificity.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition duration-300 flex flex-col items-center text-center space-y-4 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Progress Analytics</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Track your scores and practice streaks over time. Discover structural weakness patterns and study plans.
            </p>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-y-4">
        <span>&copy; {new Date().getFullYear()} Conquer. Built by Adithya Chavali. All rights reserved.</span>
        <div className="flex gap-x-6">
          <a href="#" className="hover:text-slate-400 transition">Terms</a>
          <a href="#" className="hover:text-slate-400 transition">Privacy</a>
          <a href="#" className="hover:text-slate-400 transition">Github</a>
        </div>
      </footer>
    </div>
  );
}