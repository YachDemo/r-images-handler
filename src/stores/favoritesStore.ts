import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  favorites: string[];
  recentPaths: string[];
  maxRecent: number;

  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
  addRecent: (path: string) => void;
  clearRecent: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentPaths: [],
      maxRecent: 10,

      addFavorite: (path) =>
        set((state) => {
          if (state.favorites.includes(path)) return state;
          return { favorites: [...state.favorites, path] };
        }),

      removeFavorite: (path) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f !== path),
        })),

      isFavorite: (path) => get().favorites.includes(path),

      addRecent: (path) =>
        set((state) => {
          const filtered = state.recentPaths.filter((p) => p !== path);
          return {
            recentPaths: [path, ...filtered].slice(0, state.maxRecent),
          };
        }),

      clearRecent: () => set({ recentPaths: [] }),
    }),
    {
      name: "r-images-favorites",
    }
  )
);
