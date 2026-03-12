import { create } from "zustand";
import type { ImageFileInfo } from "./fileStore";
import { loadEditSequence, saveEditSequence } from "../services/dbService";

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
  openEditor: (image: ImageFileInfo) => Promise<void>;
  closeEditor: () => void;
  saveCurrentEdits: () => Promise<void>;
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

export const useEditorStore = create<EditorStore>((set, get) => ({
  isEditing: false,
  currentImage: null,
  previewUrl: null,
  originalUrl: null,
  ...initialEditState,
  isProcessing: false,
  hasChanges: false,

  openEditor: async (image) => {
    set({
      isEditing: true,
      currentImage: image,
      previewUrl: image.thumbnailPath,
      originalUrl: image.thumbnailPath,
      ...initialEditState,
      hasChanges: false,
    });

    // 异步加载编辑历史
    try {
      const history = await loadEditSequence(image.path);
      if (history && history.length > 0) {
        // 寻找最新的 fullState 类型记录
        const lastFullState = [...history].reverse().find(h => h.type === 'fullState');
        if (lastFullState) {
          set({
            ...lastFullState.params,
            hasChanges: false
          });
        }
      }
    } catch (error) {
      console.error("加载编辑历史失败:", error);
    }
  },

  closeEditor: () =>
    set({
      isEditing: false,
      currentImage: null,
      previewUrl: null,
      originalUrl: null,
      ...initialEditState,
      hasChanges: false,
    }),

  saveCurrentEdits: async () => {
    const { currentImage, rotation, flipH, flipV, brightness, contrast, saturation } = get();
    if (!currentImage) return;

    const stateToSave = {
      type: 'fullState',
      params: { rotation, flipH, flipV, brightness, contrast, saturation }
    };
    
    // 我们这里简化处理，只存一个最新的 fullState。
    // 如果之后需要无限撤销/重做，可以存整个 [EditOperation] 数组。
    await saveEditSequence(currentImage.path, [stateToSave]);
    set({ hasChanges: false });
  },

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
