import { create } from "zustand";

interface UIStore {
  theme: "light" | "dark" | "system";
  viewMode: "grid" | "list";
  thumbnailSize: number;
  sidebarWidth: number;
  propertiesPanelWidth: number;
  isQuickPreviewOpen: boolean;
  quickPreviewPath: string | null;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setViewMode: (mode: "grid" | "list") => void;
  setThumbnailSize: (size: number) => void;
  setSidebarWidth: (width: number) => void;
  setPropertiesPanelWidth: (width: number) => void;
  openQuickPreview: (path: string) => void;
  closeQuickPreview: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: "system",
  viewMode: "grid",
  thumbnailSize: 150,
  sidebarWidth: 220,
  propertiesPanelWidth: 280,
  isQuickPreviewOpen: false,
  quickPreviewPath: null,

  setTheme: (theme) => set({ theme }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setThumbnailSize: (size) => set({ thumbnailSize: size }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setPropertiesPanelWidth: (width) => set({ propertiesPanelWidth: width }),
  openQuickPreview: (path) => set({ isQuickPreviewOpen: true, quickPreviewPath: path }),
  closeQuickPreview: () => set({ isQuickPreviewOpen: false, quickPreviewPath: null }),
}));
