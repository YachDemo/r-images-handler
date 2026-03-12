import { create } from "zustand";

interface UIStore {
  theme: "light" | "dark" | "system";
  viewMode: "grid" | "list";
  thumbnailSize: number;
  sidebarWidth: number;
  propertiesPanelWidth: number;
  isPropertiesOpen: boolean;
  isQuickPreviewOpen: boolean;
  quickPreviewPath: string | null;
  isSettingsOpen: boolean;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setViewMode: (mode: "grid" | "list") => void;
  setThumbnailSize: (size: number) => void;
  setSidebarWidth: (width: number) => void;
  setPropertiesPanelWidth: (width: number) => void;
  setPropertiesOpen: (open: boolean) => void;
  toggleProperties: () => void;
  openQuickPreview: (path: string) => void;
  closeQuickPreview: () => void;
  setSettingsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: "system",
  viewMode: "grid",
  thumbnailSize: 150,
  sidebarWidth: 220,
  propertiesPanelWidth: 300,
  isPropertiesOpen: true,
  isQuickPreviewOpen: false,
  quickPreviewPath: null,
  isSettingsOpen: false,

  setTheme: (theme) => set({ theme }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setThumbnailSize: (size) => set({ thumbnailSize: size }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setPropertiesPanelWidth: (width) => set({ propertiesPanelWidth: width }),
  setPropertiesOpen: (open) => set({ isPropertiesOpen: open }),
  toggleProperties: () => set((state) => ({ isPropertiesOpen: !state.isPropertiesOpen })),
  openQuickPreview: (path) => set({ isQuickPreviewOpen: true, quickPreviewPath: path }),
  closeQuickPreview: () => set({ isQuickPreviewOpen: false, quickPreviewPath: null }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
