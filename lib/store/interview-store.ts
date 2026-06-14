import { create } from "zustand";

interface InterviewState {
  activeSessionId: string | null;
  topic: string | null;
  difficulty: string | null;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | null;
  durationSeconds: number;
  timerActive: boolean;
  turnCount: number;
  startSession: (id: string, topic: string, difficulty: string) => void;
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
  status: null,
  durationSeconds: 0,
  timerActive: false,
  turnCount: 0,

  startSession: (id, topic, difficulty) =>
    set({
      activeSessionId: id,
      topic,
      difficulty,
      status: "ACTIVE",
      durationSeconds: 0,
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
      durationSeconds: state.durationSeconds + 1,
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
      status: null,
      durationSeconds: 0,
      timerActive: false,
      turnCount: 0,
    }),
}));
