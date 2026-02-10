import { create } from "zustand";

interface SelectionStore {
  selectedPaths: Set<string>;
  lastSelectedPath: string | null;

  select: (path: string) => void;
  toggleSelect: (path: string) => void;
  addToSelection: (path: string) => void;
  selectRange: (paths: string[], from: string, to: string) => void;
  selectAll: (paths: string[]) => void;
  clearSelection: () => void;
  isSelected: (path: string) => boolean;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedPaths: new Set<string>(),
  lastSelectedPath: null,

  select: (path) =>
    set({
      selectedPaths: new Set([path]),
      lastSelectedPath: path,
    }),

  toggleSelect: (path) =>
    set((state) => {
      const newSet = new Set(state.selectedPaths);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return { selectedPaths: newSet, lastSelectedPath: path };
    }),

  addToSelection: (path) =>
    set((state) => {
      const newSet = new Set(state.selectedPaths);
      newSet.add(path);
      return { selectedPaths: newSet, lastSelectedPath: path };
    }),

  selectRange: (paths, from, to) =>
    set(() => {
      const fromIndex = paths.indexOf(from);
      const toIndex = paths.indexOf(to);
      if (fromIndex === -1 || toIndex === -1) return {};

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangePaths = paths.slice(start, end + 1);

      return {
        selectedPaths: new Set(rangePaths),
        lastSelectedPath: to,
      };
    }),

  selectAll: (paths) =>
    set({
      selectedPaths: new Set(paths),
      lastSelectedPath: paths[paths.length - 1] || null,
    }),

  clearSelection: () =>
    set({
      selectedPaths: new Set(),
      lastSelectedPath: null,
    }),

  isSelected: (path) => get().selectedPaths.has(path),
}));
