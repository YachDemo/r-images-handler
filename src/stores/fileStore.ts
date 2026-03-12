import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ExifInfo {
  cameraModel?: string;
  fNumber?: string;
  iso?: string;
  shutterSpeed?: string;
  focalLength?: string;
}

export interface ImageFileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  sizeFormatted: string;
  width: number;
  height: number;
  modified: number;
  modifiedFormatted: string;
  thumbnailPath: string | null;
  exif?: ExifInfo;
}

export interface FileNode {
  path: string;
  name: string;
  isDir: boolean;
  children: FileNode[] | null;
  expanded: boolean;
}

interface FileStore {
  rootPaths: string[];
  selectedPath: string | null;
  folderTrees: FileNode[]; // 存储多个根目录的树结构
  images: ImageFileInfo[];
  isLoading: boolean;
  error: string | null;

  addRootPath: (path: string) => void;
  removeRootPath: (path: string) => void;
  setRootPaths: (paths: string[]) => void;
  setSelectedPath: (path: string | null) => void;
  setFolderTrees: (trees: FileNode[]) => void;
  setImages: (images: ImageFileInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleFolderExpanded: (rootIndex: number, path: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      rootPaths: [],
      selectedPath: null,
      folderTrees: [],
      images: [],
      isLoading: false,
      error: null,
      refreshKey: 0,

      addRootPath: (path) => set((state) => ({ 
        rootPaths: state.rootPaths.includes(path) ? state.rootPaths : [...state.rootPaths, path],
        selectedPath: state.selectedPath || path
      })),
      
      removeRootPath: (path) => set((state) => ({
        rootPaths: state.rootPaths.filter(p => p !== path),
        folderTrees: state.folderTrees.filter(t => t.path !== path),
        selectedPath: state.selectedPath === path ? null : state.selectedPath
      })),

      setRootPaths: (paths) => set({ rootPaths: paths }),
      setSelectedPath: (path) => set({ selectedPath: path }),
      setFolderTrees: (trees) => set({ folderTrees: trees }),
      setImages: (images) => set({ images }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
      
      toggleFolderExpanded: (rootIndex, path) =>
        set((state) => {
          const newTrees = [...state.folderTrees];
          const tree = newTrees[rootIndex];
          if (!tree) return state;

          const toggleNode = (node: FileNode): FileNode => {
            if (node.path === path) {
              return { ...node, expanded: !node.expanded };
            }
            if (node.children) {
              return { ...node, children: node.children.map(toggleNode) };
            }
            return node;
          };

          newTrees[rootIndex] = toggleNode(tree);
          return { folderTrees: newTrees };
        }),
    }),
    {
      name: "r-image-studio-files",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ rootPaths: state.rootPaths, selectedPath: state.selectedPath }),
    }
  )
);
