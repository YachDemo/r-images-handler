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
        id={`image-card-${image.path}`}
        data-path={image.path}
        ref={cardRef}
        className={cn(
          "group relative rounded-[var(--radius)] overflow-hidden cursor-pointer transition-all duration-200 border",
          "bg-[var(--bg-surface)] shadow-sm",
          isSelected
            ? "border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-[var(--shadow-accent)]"
            : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-md hover:translate-y-[-2px]"
        )}
        style={style}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 缩略图区域 */}
        <div
          className="relative overflow-hidden bg-[var(--bg-app)] border-b border-[var(--border-subtle)]"
          style={{ height: size }}
        >
          {/* 加载占位符 */}
          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center skeleton">
              <ImageIcon className="w-5 h-5 text-[var(--text-muted)] opacity-50" />
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface-active)]">
              <ImageIcon className="w-5 h-5 text-[var(--status-error)] opacity-50" />
            </div>
          )}

          {/* 图片 */}
          <img
            src={image.thumbnailPath || ""}
            alt={image.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              loaded ? "opacity-100" : "opacity-0",
              isHovered && !isSelected && "scale-110"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            draggable={false}
          />

          {/* 选中标记 (Checkbox) */}
          <div 
            className={cn(
              "absolute top-2 right-2 z-20 transition-all duration-200",
              isSelected
                ? "scale-100 opacity-100"
                : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            )}
            onClick={handleCheckClick}
          >
            <div className={cn(
              "w-5 h-5 rounded-[var(--radius-sm)] flex items-center justify-center shadow-md transition-all",
              isSelected 
                ? "bg-[var(--accent)] text-white" 
                : "bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60"
            )}>
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* 编辑按钮 (悬停时显示) */}
          <button
            className={cn(
              "absolute top-2 left-2 z-20 w-7 h-7 rounded-[var(--radius-sm)] bg-black/40 backdrop-blur-md text-white/80 flex items-center justify-center transition-all duration-200 border border-white/10",
              "hover:text-white hover:bg-black/60",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
            onClick={handleEditClick}
            title="编辑图片"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          {/* 尺寸信息 (玻璃拟态) */}
          <div className={cn(
            "absolute bottom-2 right-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-[var(--radius-sm)] px-1.5 py-0.5 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
             <span className="text-[10px] text-white/90 font-mono tracking-tighter">
              {image.width}×{image.height}
             </span>
          </div>
        </div>

        {/* 文件信息 */}
        <div className="px-2.5 py-2.5">
          <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate leading-tight tracking-tight" title={image.name}>
            {image.name}
          </p>
          <div className="flex items-center justify-between mt-1.5">
             <div className="flex items-center gap-1.5">
               <span className="px-1 py-0.5 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-[3px] text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {image.extension.replace('.', '')}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                {image.sizeFormatted}
              </span>
            </div>
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
