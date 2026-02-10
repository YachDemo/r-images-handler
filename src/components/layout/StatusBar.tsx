import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { Images, CheckSquare, HardDrive, Loader2 } from "lucide-react";

export function StatusBar() {
  const { images, isLoading } = useFileStore();
  const { selectedPaths } = useSelectionStore();

  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  return (
    <footer className="h-[var(--statusbar-height)] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center px-8 text-[11px] text-[var(--text-secondary)] tracking-wide font-medium">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5 group cursor-default">
          <Images className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          <span>{images.length} <span className="opacity-60 font-normal ml-0.5">项目</span></span>
        </div>

        {selectedPaths.size > 0 && (
          <div className="flex items-center gap-2.5 text-[var(--accent)] animate-fade-in font-bold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>已选择 {selectedPaths.size} <span className="opacity-70 font-medium ml-0.5">个</span></span>
          </div>
        )}

        <div className="flex items-center gap-2.5 group cursor-default">
          <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          <span>{formatSize(totalSize)}</span>
        </div>
      </div>

      {isLoading && (
        <div className="ml-auto flex items-center gap-3 animate-fade-in">
          <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
          <span className="text-[var(--accent)] font-bold tracking-widest uppercase text-[9px]">处理中...</span>
        </div>
      )}
    </footer>
  );
}
