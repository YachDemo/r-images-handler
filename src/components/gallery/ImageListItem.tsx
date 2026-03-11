import { useRef } from "react";
import { Check, Edit2, Eye, FolderSearch, Trash2, Copy, XCircle, FileImage } from "lucide-react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useUIStore } from "../../stores/uiStore";
import { useEditorStore } from "../../stores/editorStore";
import { useFileStore } from "../../stores/fileStore";
import { revealInExplorer, deleteFile } from "../../services/tauriApi";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";
import { cn } from "../../utils/cn";
import type { ImageFileInfo } from "../../stores/fileStore";

interface ImageListItemProps {
  image: ImageFileInfo;
}

export function ImageListItem({ image }: ImageListItemProps) {
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
    e.stopPropagation();
    toggleSelect(image.path);
  };

  const contextMenuItems: ContextMenuItem[] = [
    { label: "预览图片", icon: <Eye className="w-4 h-4" />, onClick: () => openQuickPreview(image.path) },
    { label: "编辑图片", icon: <Edit2 className="w-4 h-4" />, onClick: () => openEditor(image) },
    { separator: true, label: "" },
    { label: "在资源管理器中显示", icon: <FolderSearch className="w-4 h-4" />, onClick: () => revealInExplorer(image.path) },
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
        if (confirm(`确定要永久删除 "${image.name}" 吗？`)) {
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
          "flex items-center gap-4 px-4 py-2 cursor-pointer transition-colors border-b border-[var(--border-subtle)] group",
          isSelected ? "bg-[var(--accent-surface)]" : "hover:bg-[var(--bg-surface-hover)]"
        )}
        onClick={handleClick}
        onDoubleClick={() => openQuickPreview(image.path)}
      >
        {/* 选择勾选框 - 增加交互面积 */}
        <div 
          className="w-8 h-full flex items-center justify-center shrink-0 cursor-default"
          onClick={handleCheckClick}
        >
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-all",
            isSelected 
              ? "bg-[var(--accent)] text-white" 
              : "bg-[var(--bg-surface-active)] text-[var(--text-muted)] border border-[var(--border-strong)] opacity-0 group-hover:opacity-100"
          )}>
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* 缩略图 */}
        <div className="w-10 h-10 rounded bg-[var(--bg-surface-active)] overflow-hidden shrink-0 flex items-center justify-center border border-[var(--border-subtle)]">
          {image.thumbnailPath ? (
            <img src={image.thumbnailPath} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileImage className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>

        {/* 文件名 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{image.name}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{image.path}</p>
        </div>

        {/* 信息列 */}
        <div className="flex items-center gap-8 text-xs text-[var(--text-secondary)] shrink-0">
          <span className="w-20 text-right">{image.width} × {image.height}</span>
          <span className="w-16 text-right uppercase">{image.extension}</span>
          <span className="w-20 text-right">{image.sizeFormatted}</span>
          <span className="w-32 text-right">{image.modifiedFormatted}</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
          <button 
            className="p-1.5 rounded-md hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={(e) => { e.stopPropagation(); openEditor(image); }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <ContextMenu items={contextMenuItems} triggerRef={cardRef} onOpen={() => { if (!isSelected) select(image.path); }} />
    </>
  );
}
