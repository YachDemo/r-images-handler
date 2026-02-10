import { ImageGrid } from "../gallery/ImageGrid";
import { useFileStore } from "../../stores/fileStore";
import { SkeletonGrid } from "../ui/Loading";
import { ImagePlus, Folder, ChevronRight } from "lucide-react";

export function MainContent() {
  const { rootPaths, images, isLoading, selectedPath } = useFileStore();

  const getSelectedFolderName = () => {
    if (!selectedPath) return "所有图片";
    return selectedPath.split("/").pop() || selectedPath;
  };

  // 确保背景颜色是卡片颜色，而不是 App 的纯黑底色
  return (
    <main className="flex-1 bg-[#121215] flex flex-col h-full w-full overflow-hidden">
      {/* 面包屑导航 */}
      {rootPaths.length > 0 && (
        <div className="h-10 px-4 flex items-center border-b border-white/5 bg-white/5 shrink-0">
          <Folder className="w-3.5 h-3.5 text-indigo-400 mr-2" />
          <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">Studio</span>
          <ChevronRight className="w-3 h-3 mx-2 text-zinc-600" />
          <span className="text-[11px] text-zinc-100 font-bold truncate">{getSelectedFolderName()}</span>
        </div>
      )}

      {/* 内容滚动区 */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {isLoading ? (
          <SkeletonGrid count={12} />
        ) : rootPaths.length > 0 ? (
          <ImageGrid images={images} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
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
