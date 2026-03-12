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

export interface FilterOptions {
  formats: string[];
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  minSize: number; // in bytes
  maxSize: number; // in bytes
  startDate: string | null;
  endDate: string | null;
}

interface FileStore {
  rootPaths: string[];
  selectedPath: string | null;
  folderTrees: FileNode[]; // 存储多个根目录的树结构
  images: ImageFileInfo[];
  isLoading: boolean;
  error: string | null;

  // 搜索与过滤
  searchQuery: string;
  filterOptions: FilterOptions;
  setSearchQuery: (query: string) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  getFilteredImages: () => ImageFileInfo[];

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

const initialFilterOptions: FilterOptions = {
  formats: [],
  minWidth: 0,
  minHeight: 0,
  maxWidth: 0,
  maxHeight: 0,
  minSize: 0,
  maxSize: 0,
  startDate: null,
  endDate: null,
};

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

      // 搜索与过滤
      searchQuery: "",
      filterOptions: initialFilterOptions,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilterOptions: (options) => set((state) => ({ 
        filterOptions: { ...state.filterOptions, ...options } 
      })),
      resetFilters: () => set({ searchQuery: "", filterOptions: initialFilterOptions }),
      
      getFilteredImages: () => {
        const { images, searchQuery, filterOptions } = get();
        let filtered = images;

        // 搜索查询
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(img => 
            img.name.toLowerCase().includes(query) || 
            img.path.toLowerCase().includes(query)
          );
        }

        // 格式过滤
        if (filterOptions.formats.length > 0) {
          filtered = filtered.filter(img => 
            filterOptions.formats.includes(img.extension.toLowerCase().replace(".", ""))
          );
        }

        // 尺寸过滤
        if (filterOptions.minWidth > 0) {
          filtered = filtered.filter(img => img.width >= filterOptions.minWidth);
        }
        if (filterOptions.maxWidth > 0) {
          filtered = filtered.filter(img => img.width <= filterOptions.maxWidth);
        }
        if (filterOptions.minHeight > 0) {
          filtered = filtered.filter(img => img.height >= filterOptions.minHeight);
        }
        if (filterOptions.maxHeight > 0) {
          filtered = filtered.filter(img => img.height <= filterOptions.maxHeight);
        }

        // 大小过滤 (MB to Bytes)
        if (filterOptions.minSize > 0) {
          filtered = filtered.filter(img => img.size >= filterOptions.minSize);
        }
        if (filterOptions.maxSize > 0) {
          filtered = filtered.filter(img => img.size <= filterOptions.maxSize);
        }

        // 日期过滤
        if (filterOptions.startDate) {
          const start = new Date(filterOptions.startDate).getTime();
          filtered = filtered.filter(img => img.modified >= start);
        }
        if (filterOptions.endDate) {
          const end = new Date(filterOptions.endDate).getTime();
          filtered = filtered.filter(img => img.modified <= end);
        }

        return filtered;
      },

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
