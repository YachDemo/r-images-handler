import { create } from "zustand";

type BatchDialogType = "rename" | "convert" | "resize" | "collage" | "watermark" | null;

interface BatchStore {
  activeDialog: BatchDialogType;
  isProcessing: boolean;
  progress: number;
  total: number;

  openRenameDialog: () => void;
  openConvertDialog: () => void;
  openResizeDialog: () => void;
  openCollageDialog: () => void;
  openWatermarkDialog: () => void;
  closeDialog: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setProgress: (progress: number, total: number) => void;
}

export const useBatchStore = create<BatchStore>((set) => ({
  activeDialog: null,
  isProcessing: false,
  progress: 0,
  total: 0,

  openRenameDialog: () => set({ activeDialog: "rename" }),
  openConvertDialog: () => set({ activeDialog: "convert" }),
  openResizeDialog: () => set({ activeDialog: "resize" }),
  openCollageDialog: () => set({ activeDialog: "collage" }),
  openWatermarkDialog: () => set({ activeDialog: "watermark" }),
  closeDialog: () => set({ activeDialog: null, isProcessing: false, progress: 0, total: 0 }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progress, total) => set({ progress, total }),
}));
