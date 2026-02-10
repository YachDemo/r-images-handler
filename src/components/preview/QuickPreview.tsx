import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { useFileStore } from "../../stores/fileStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { convertFileSrc } from "@tauri-apps/api/core";

export function QuickPreview() {
  const { isQuickPreviewOpen, quickPreviewPath, closeQuickPreview } = useUIStore();
  const { images } = useFileStore();
  const { select } = useSelectionStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const currentIndex = images.findIndex((img) => img.path === quickPreviewPath);
  const currentImage = currentIndex >= 0 ? images[currentIndex] : null;

  // 加载原图
  useEffect(() => {
    if (currentImage?.path) {
      setImageLoaded(false);
      const src = convertFileSrc(currentImage.path);
      setImageSrc(src);
    }
  }, [currentImage?.path]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevImage = images[currentIndex - 1];
      useUIStore.getState().openQuickPreview(prevImage.path);
      select(prevImage.path);
    }
  }, [currentIndex, images, select]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      const nextImage = images[currentIndex + 1];
      useUIStore.getState().openQuickPreview(nextImage.path);
      select(nextImage.path);
    }
  }, [currentIndex, images, select]);

  // 键盘事件处理
  useEffect(() => {
    if (!isQuickPreviewOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
        case " ":
          e.preventDefault();
          closeQuickPreview();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickPreviewOpen, closeQuickPreview, goToPrevious, goToNext]);

  if (!isQuickPreviewOpen || !currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center animate-fade-in"
      onClick={closeQuickPreview}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">{currentImage.name}</span>
          <span className="text-white/50 text-sm">
            {currentImage.width} × {currentImage.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <Button variant="ghost" size="icon" onClick={closeQuickPreview}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 图片区域 */}
      <div
        className="max-w-[90vw] max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 加载指示器 */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          </div>
        )}
        <img
          src={imageSrc || ""}
          alt={currentImage.name}
          className={cn(
            "max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
        />
      </div>

      {/* 左侧导航按钮 */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* 右侧导航按钮 */}
      {currentIndex < images.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* 底部信息栏 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center gap-6 text-white/70 text-sm">
          <span>{currentImage.sizeFormatted}</span>
          <span>•</span>
          <span>{currentImage.extension.toUpperCase()}</span>
          <span>•</span>
          <span>{currentImage.modifiedFormatted}</span>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/40 text-xs">
        <span>← → 切换图片</span>
        <span>•</span>
        <span>Space / Esc 关闭</span>
      </div>
    </div>
  );
}
