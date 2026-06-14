import { pgTable, uuid, text, integer, doublePrecision, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  name: text("name"),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  topic: text("topic").notNull(), // e.g. "Data Structures & Algorithms", "System Design", "Behavioral", "Frontend/Backend"
  difficulty: text("difficulty").notNull(), // "Easy", "Medium", "Hard"
  status: text("status").default("ACTIVE").notNull(), // "ACTIVE" | "COMPLETED" | "ABANDONED"
  totalTurns: integer("total_turns").default(0).notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  overallScore: doublePrecision("overall_score"),
  report: jsonb("report"), // Stores { dimensionScores: { depth: 8, specificity: 7... }, strengths: [], gaps: [], suggestions: [], topicsNotCovered: [] }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  turnNumber: integer("turn_number").notNull(),
  isFollowUp: boolean("is_follow_up").default(false).notNull(),
  topicTag: text("topic_tag"), // e.g., "databases", "algorithms", "caching"
  answerScore: doublePrecision("answer_score"), // 0-10 score (V2 per-question evaluation)
  feedback: text("feedback"), // V2 per-question feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  topic: text("topic").notNull(),
  avgScore: doublePrecision("avg_score").default(0).notNull(),
  sessionsCount: integer("sessions_count").default(0).notNull(),
  weakAreas: jsonb("weak_areas").default(sql`'[]'::jsonb`).notNull(), // string[]
  strengths: jsonb("strengths").default(sql`'[]'::jsonb`).notNull(), // string[]
  lastPracticed: timestamp("last_practiced").defaultNow().notNull(),
});
