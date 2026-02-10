import { ImageCard } from "./ImageCard";
import { ImageListItem } from "./ImageListItem";
import { useUIStore } from "../../stores/uiStore";
import type { ImageFileInfo } from "../../stores/fileStore";
import { ImageOff } from "lucide-react";

interface ImageGridProps {
  images: ImageFileInfo[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const { thumbnailSize, viewMode } = useUIStore();

  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 shadow-xl">
          <p className="text-zinc-200 font-bold">文件夹为空</p>
          <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">该目录下没有可显示的图片</p>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col">
        {/* 表头 */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0 bg-inherit z-10">
          <div className="w-5 shrink-0" /> {/* Checkbox spacer */}
          <div className="w-10 shrink-0" /> {/* Thumbnail spacer */}
          <div className="flex-1">名称</div>
          <div className="w-20 text-right">尺寸</div>
          <div className="w-16 text-right">格式</div>
          <div className="w-20 text-right">大小</div>
          <div className="w-32 text-right">修改日期</div>
          <div className="w-6 ml-4" /> {/* Actions spacer */}
        </div>
        {images.map((image) => (
          <ImageListItem key={image.path} image={image} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 animate-fade-in content-start"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))`,
      }}
    >
      {images.map((image, index) => (
        <ImageCard
          key={image.path}
          image={image}
          size={thumbnailSize}
          style={{ animationDelay: `${Math.min(index * 10, 200)}ms` }}
        />
      ))}
    </div>
  );
}
