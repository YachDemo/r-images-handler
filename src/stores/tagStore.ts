import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TagStore {
  fileTags: Record<string, string[]>; // path -> tags
  allTags: string[]; // unique set of all tags used

  addTag: (path: string, tag: string) => void;
  removeTag: (path: string, tag: string) => void;
  getTags: (path: string) => string[];
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      fileTags: {},
      allTags: [],

      addTag: (path, tag) => {
        const { fileTags, allTags } = get();
        const currentTags = fileTags[path] || [];
        
        if (currentTags.includes(tag)) return;

        const newTags = [...currentTags, tag];
        const newAllTags = allTags.includes(tag) ? allTags : [...allTags, tag];

        set({
          fileTags: { ...fileTags, [path]: newTags },
          allTags: newAllTags,
        });
      },

      removeTag: (path, tag) => {
        const { fileTags } = get();
        const currentTags = fileTags[path] || [];
        
        const newTags = currentTags.filter((t) => t !== tag);
        
        set({
          fileTags: { ...fileTags, [path]: newTags },
        });
      },

      getTags: (path) => {
        return get().fileTags[path] || [];
      },
    }),
    {
      name: "r-image-studio-tags",
    }
  )
);
