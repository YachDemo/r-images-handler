import { create } from "zustand";

export type BatchDialogType = "rename" | "convert" | "resize" | "collage" | "watermark" | null;

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface BatchTask {
  id: string;
  type: BatchDialogType;
  status: TaskStatus;
  progress: number;
  total: number;
  message: string;
  error?: string;
  startTime: number;
  endTime?: number;
}

interface BatchStore {
  activeDialog: BatchDialogType;
  tasks: BatchTask[];
  
  // Dialog management
  openRenameDialog: () => void;
  openConvertDialog: () => void;
  openResizeDialog: () => void;
  openCollageDialog: () => void;
  openWatermarkDialog: () => void;
  closeDialog: () => void;
  
  // Task management
  addTask: (type: BatchDialogType, total: number) => string;
  updateTask: (id: string, updates: Partial<BatchTask>) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
}

export const useBatchStore = create<BatchStore>((set) => ({
  activeDialog: null,
  tasks: [],

  openRenameDialog: () => set({ activeDialog: "rename" }),
  openConvertDialog: () => set({ activeDialog: "convert" }),
  openResizeDialog: () => set({ activeDialog: "resize" }),
  openCollageDialog: () => set({ activeDialog: "collage" }),
  openWatermarkDialog: () => set({ activeDialog: "watermark" }),
  closeDialog: () => set({ activeDialog: null }),

  addTask: (type, total) => {
    const id = crypto.randomUUID();
    const newTask: BatchTask = {
      id,
      type,
      status: "pending",
      progress: 0,
      total,
      message: "准备中...",
      startTime: Date.now(),
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    return id;
  },

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  clearCompletedTasks: () =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.status === "running" || t.status === "pending"),
    })),
}));
