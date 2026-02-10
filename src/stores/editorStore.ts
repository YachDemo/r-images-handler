import { create } from "zustand";
import type { ImageFileInfo } from "./fileStore";

interface EditorStore {
  isEditing: boolean;
  currentImage: ImageFileInfo | null;
  previewUrl: string | null;
  originalUrl: string | null;

  // 编辑参数
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  saturation: number;

  isProcessing: boolean;
  hasChanges: boolean;

  // 操作方法
  openEditor: (image: ImageFileInfo) => void;
  closeEditor: () => void;
  setRotation: (degrees: number) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  toggleFlipH: () => void;
  toggleFlipV: () => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setPreviewUrl: (url: string | null) => void;
  setProcessing: (processing: boolean) => void;
  resetAll: () => void;
  markSaved: () => void;
}

const initialEditState = {
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export const useEditorStore = create<EditorStore>((set) => ({
  isEditing: false,
  currentImage: null,
  previewUrl: null,
  originalUrl: null,
  ...initialEditState,
  isProcessing: false,
  hasChanges: false,

  openEditor: (image) =>
    set({
      isEditing: true,
      currentImage: image,
      previewUrl: image.thumbnailPath,
      originalUrl: image.thumbnailPath,
      ...initialEditState,
      hasChanges: false,
    }),

  closeEditor: () =>
    set({
      isEditing: false,
      currentImage: null,
      previewUrl: null,
      originalUrl: null,
      ...initialEditState,
      hasChanges: false,
    }),

  setRotation: (degrees) =>
    set({ rotation: degrees % 360, hasChanges: true }),

  rotateLeft: () =>
    set((state) => ({
      rotation: (state.rotation - 90 + 360) % 360,
      hasChanges: true,
    })),

  rotateRight: () =>
    set((state) => ({
      rotation: (state.rotation + 90) % 360,
      hasChanges: true,
    })),

  toggleFlipH: () =>
    set((state) => ({ flipH: !state.flipH, hasChanges: true })),

  toggleFlipV: () =>
    set((state) => ({ flipV: !state.flipV, hasChanges: true })),

  setBrightness: (value) =>
    set({ brightness: value, hasChanges: true }),

  setContrast: (value) =>
    set({ contrast: value, hasChanges: true }),

  setSaturation: (value) =>
    set({ saturation: value, hasChanges: true }),

  setPreviewUrl: (url) =>
    set({ previewUrl: url }),

  setProcessing: (processing) =>
    set({ isProcessing: processing }),

  resetAll: () =>
    set((state) => ({
      ...initialEditState,
      previewUrl: state.originalUrl,
      hasChanges: false,
    })),

  markSaved: () =>
    set({ hasChanges: false }),
}));
