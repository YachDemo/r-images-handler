import { useState, useRef } from "react";
import { Image as ImageIcon, Check, Edit2, Eye, FolderSearch, Trash2, Copy, XCircle } from "lucide-react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useUIStore } from "../../stores/uiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useFileStore } from "../../stores/fileStore";
import { revealInExplorer, deleteFile } from "../../services/tauriApi";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";
import { cn } from "../../utils/cn";
import type { ImageFileInfo } from "../../stores/fileStore";

interface ImageCardProps {
  image: ImageFileInfo;
  size: number;
  style?: React.CSSProperties;
}

export function ImageCard({ image, size, style }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const { selectedPaths, select, toggleSelect, selectRange, lastSelectedPath } = useSelectionStore();
  const { openQuickPreview } = useUIStore();
  const { openEditor } = useEditorStore();
  const { images, setImages } = useFileStore();
  const isSelected = selectedPaths.has(image.path);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedPath) {
      const paths = images.map(img => img.path);
      selectRange(paths, lastSelectedPath, image.path);
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelect(image.path);
    } else {
      select(image.path);
    }
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发 handleClick 的单选逻辑
    toggleSelect(image.path);
  };

  const handleDoubleClick = () => {
    openQuickPreview(image.path);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditor(image);
  };

  const contextMenuItems: ContextMenuItem[] = [
    {
      label: "预览图片",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => openQuickPreview(image.path),
    },
    {
      label: "编辑图片",
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => openEditor(image),
    },
    { separator: true, label: "" },
    {
      label: "在资源管理器中显示",
      icon: <FolderSearch className="w-4 h-4" />,
      onClick: () => revealInExplorer(image.path),
    },
    {
      label: "复制路径",
      icon: <Copy className="w-4 h-4" />,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(image.path);
        } catch (err) {
          console.error("复制失败", err);
        }
      },
    },
    { separator: true, label: "" },
    {
      label: "从列表中移除",
      icon: <XCircle className="w-4 h-4" />,
      onClick: () => {
        setImages(images.filter(img => img.path !== image.path));
        if (isSelected) toggleSelect(image.path);
      }
    },
    {
      label: "永久删除",
      icon: <Trash2 className="w-4 h-4" />,
      danger: true,
      onClick: async () => {
        if (confirm(`确定要永久删除 "${image.name}" 吗？此操作无法撤销。`)) {
          try {
            await deleteFile(image.path);
            setImages(images.filter(img => img.path !== image.path));
            if (isSelected) toggleSelect(image.path);
          } catch (e) {
            alert(`删除失败: ${e}`);
          }
        }
      },
    },
  ];

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          "group relative rounded-md overflow-hidden cursor-pointer transition-all duration-150 border",
          "bg-[var(--bg-surface)]",
          isSelected
            ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
            : "border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]"
        )}
        style={style}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 选中时的覆盖层 */}
        {isSelected && (
          <div className="absolute inset-0 bg-[var(--accent-surface)] z-10 pointer-events-none mix-blend-overlay" />
        )}

        {/* 缩略图区域 */}
        <div
          className="relative overflow-hidden bg-[var(--bg-app)]"
          style={{ height: size }}
        >
          {/* 加载占位符 */}
          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center skeleton">
              <ImageIcon className="w-6 h-6 text-[var(--text-muted)] opacity-50" />
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface-active)]">
              <ImageIcon className="w-6 h-6 text-[var(--status-error)] opacity-50" />
            </div>
          )}

          {/* 图片 */}
          <img
            src={image.thumbnailPath || ""}
            alt={image.name}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300",
              loaded ? "opacity-100" : "opacity-0",
              isHovered && !isSelected && "scale-105"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            draggable={false}
          />

          {/* 选中标记 (Checkbox) - 现在支持点击多选 */}
          <div 
            className={cn(
              "absolute top-2 right-2 z-20 transition-all duration-200 cursor-default",
              isSelected
                ? "scale-100 opacity-100"
                : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            )}
            onClick={handleCheckClick}
          >
            <div className={cn(
              "w-5 h-5 rounded flex items-center justify-center shadow-sm transition-colors",
              isSelected 
                ? "bg-[var(--accent)] text-white" 
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            )}>
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {!isSelected && <div className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 编辑按钮 (悬停时显示) */}
          <button
            className={cn(
              "absolute top-2 left-2 z-20 w-7 h-7 rounded bg-[var(--bg-surface)]/90 backdrop-blur-sm text-[var(--text-secondary)] flex items-center justify-center transition-all duration-200 border border-[var(--border-subtle)]",
              "hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
            onClick={handleEditClick}
            title="编辑图片"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* 尺寸信息 (标签式) */}
          <div className={cn(
            "absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
             <span className="text-[10px] text-white/90 font-mono">
              {image.width}×{image.height}
             </span>
          </div>
        </div>

        {/* 文件信息 */}
        <div className="px-2 py-2">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-none" title={image.name}>
            {image.name}
          </p>
          <div className="flex items-center justify-between mt-1.5">
             <p className="text-[10px] text-[var(--text-muted)] font-mono">
              {image.extension.toUpperCase()}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {image.sizeFormatted}
            </p>
          </div>
        </div>
      </div>
      
      {/* 上下文菜单 */}
      <ContextMenu 
        items={contextMenuItems} 
        triggerRef={cardRef} 
        onOpen={() => {
          if (!isSelected) {
            select(image.path);
          }
        }} 
      />
    </>
  );
}
