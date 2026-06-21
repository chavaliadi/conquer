import { create } from "zustand";

interface InterviewState {
  activeSessionId: string | null;
  topic: string | null;
  difficulty: string | null;
  mode: "STANDARD" | "QUICK_FIRE" | "DEEP_DIVE" | "WEAKNESS_TRAINER" | null;
  subTopic: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | null;
  durationSeconds: number;
  timerActive: boolean;
  turnCount: number;
  startSession: (
    id: string,
    topic: string,
    difficulty: string,
    mode?: "STANDARD" | "QUICK_FIRE" | "DEEP_DIVE" | "WEAKNESS_TRAINER",
    subTopic?: string | null
  ) => void;
  endSession: (status?: "COMPLETED" | "ABANDONED") => void;
  incrementDuration: () => void;
  setTimerActive: (active: boolean) => void;
  incrementTurnCount: () => void;
  resetSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  activeSessionId: null,
  topic: null,
  difficulty: null,
  mode: null,
  subTopic: null,
  status: null,
  durationSeconds: 0,
  timerActive: false,
  turnCount: 0,

  startSession: (id, topic, difficulty, mode = "STANDARD", subTopic = null) =>
    set({
      activeSessionId: id,
      topic,
      difficulty,
      mode,
      subTopic,
      status: "ACTIVE",
      durationSeconds: mode === "QUICK_FIRE" ? 600 : 0,
      timerActive: true,
      turnCount: 0,
    }),

  endSession: (status = "COMPLETED") =>
    set({
      status,
      timerActive: false,
    }),

  incrementDuration: () =>
    set((state) => ({
      durationSeconds:
        state.mode === "QUICK_FIRE"
          ? Math.max(0, state.durationSeconds - 1)
          : state.durationSeconds + 1,
    })),

  setTimerActive: (active) =>
    set({
      timerActive: active,
    }),

  incrementTurnCount: () =>
    set((state) => ({
      turnCount: state.turnCount + 1,
    })),

  resetSession: () =>
    set({
      activeSessionId: null,
      topic: null,
      difficulty: null,
      mode: null,
      subTopic: null,
      status: null,
      durationSeconds: 0,
      timerActive: false,
      turnCount: 0,
    }),
}));
