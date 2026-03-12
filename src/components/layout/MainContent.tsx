import { ImageGrid } from "../gallery/ImageGrid";
import { useFileStore } from "../../stores/fileStore";
import { SkeletonGrid } from "../ui/Loading";
import { ImagePlus, Folder, ChevronRight } from "lucide-react";

export function MainContent() {
  const { rootPaths, isLoading, selectedPath, getFilteredImages, images: allImages } = useFileStore();
  const images = getFilteredImages();
  const isFiltered = images.length !== allImages.length;

  const getSelectedFolderName = () => {
    if (!selectedPath) return "所有图片";
    return selectedPath.split("/").pop() || selectedPath;
  };

  // 确保背景颜色与面板一致
  return (
    <main className="flex-1 bg-[var(--bg-surface)] flex flex-col h-full w-full overflow-hidden">
      {/* 面包屑导航 - 增加垂直边距防止被圆角截断 */}
      {rootPaths.length > 0 && (
        <div className="h-12 px-6 flex items-center border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 shrink-0">
          <Folder className="w-4 h-4 text-[var(--accent)] mr-3" />
          <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Studio</span>
          <ChevronRight className="w-3 h-3 mx-3 text-[var(--text-muted)] opacity-50" />
          <span className="text-[11px] text-[var(--text-primary)] font-black uppercase tracking-widest truncate">{getSelectedFolderName()}</span>
          
          <div className="ml-auto flex items-center gap-3">
            <div className="px-2 py-0.5 rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center gap-2">
              <span className="text-[10px] text-[var(--accent)] font-mono font-bold tracking-tighter">
                {isFiltered ? `${images.length} / ${allImages.length}` : allImages.length} ITEMS
              </span>
              {isFiltered && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 内容滚动区 - 滚动控制下放给子组件以支持虚拟化 */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full w-full overflow-y-auto p-6 custom-scrollbar">
             <SkeletonGrid count={12} />
          </div>
        ) : selectedPath ? (
          <ImageGrid images={images} />
        ) : (
          <div className="h-full w-full overflow-y-auto p-6 custom-scrollbar flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
               <ImagePlus className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">请添加文件夹以开始</p>
          </div>
        )}
      </div>
    </main>
  );
}
