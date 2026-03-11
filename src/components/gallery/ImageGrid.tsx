import { useRef, useState, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ImageCard } from "./ImageCard";
import { ImageListItem } from "./ImageListItem";
import { useUIStore } from "../../stores/uiStore";
import type { ImageFileInfo } from "../../stores/fileStore";

interface ImageGridProps {
  images: ImageFileInfo[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const { thumbnailSize, viewMode } = useUIStore();
  const parentRef = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState(0);

  // 监听容器宽度变化
  useEffect(() => {
    if (!parentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 使用 contentBoxSize 或 contentRect 获取宽度
        // 减去 padding (24px * 2 = 48px)
        setParentWidth(entry.contentRect.width);
      }
    });
    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  // 常量定义
  const GAP = 12; // gap-3 (12px)
  
  // 计算列数
  const columnCount = useMemo(() => {
    if (viewMode === "list" || parentWidth === 0) return 1;
    // 简单计算：(宽度 + 间隙) / (缩略图尺寸 + 间隙)
    // 至少 1 列
    return Math.max(1, Math.floor((parentWidth + GAP) / (thumbnailSize + GAP)));
  }, [parentWidth, thumbnailSize, viewMode]);

  // 计算行数
  const rowCount = Math.ceil(images.length / columnCount);

  // 虚拟化
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => viewMode === "list" ? 60 : (thumbnailSize + GAP),
    overscan: 3, // 预加载几行
  });

  if (images.length === 0) {
    return (
      <div className="h-full w-full p-6 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/5 shadow-xl">
          <p className="text-zinc-200 font-bold">文件夹为空</p>
          <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">该目录下没有可显示的图片</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="h-full w-full overflow-y-auto p-6 custom-scrollbar relative"
    >
      {viewMode === "list" && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky top-0 bg-[var(--bg-surface)] z-10 mb-2 backdrop-blur-md">
          <div className="w-5 shrink-0" /> {/* Checkbox spacer */}
          <div className="w-10 shrink-0" /> {/* Thumbnail spacer */}
          <div className="flex-1">名称</div>
          <div className="w-20 text-right">尺寸</div>
          <div className="w-16 text-right">格式</div>
          <div className="w-20 text-right">大小</div>
          <div className="w-32 text-right">修改日期</div>
          <div className="w-6 ml-4" /> {/* Actions spacer */}
        </div>
      )}

      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isList = viewMode === "list";
          
          // 列表视图逻辑
          if (isList) {
            const image = images[virtualRow.index];
            if (!image) return null;
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ImageListItem image={image} />
              </div>
            );
          }

          // 网格视图逻辑
          const startIndex = virtualRow.index * columnCount;
          const rowImages = images.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                // 注意：这里的高度应该是行的高度，对于网格来说通常是 thumbnailSize
                // 但虚拟化器计算的 size 包含了间隙 GAP? 
                // estimateSize 返回 thumbnailSize + GAP
                // 所以每一行占据的高度是正确的。
                // 渲染内容时，高度最好设为 thumbnailSize，留出下方的间隙自然形成
                height: `${thumbnailSize}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                gap: `${GAP}px`,
              }}
            >
              {rowImages.map((image) => (
                <ImageCard
                  key={image.path}
                  image={image}
                  size={thumbnailSize}
                  style={{ 
                    // 移除 ImageCard 内部可能的动画延迟，或者保留但要小心虚拟化重用
                    animationDelay: '0ms' 
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}