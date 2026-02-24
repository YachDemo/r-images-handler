import { ChevronRight, ChevronDown, Folder, FolderOpen, X } from "lucide-react";
import { useFileStore, type FileNode } from "../../stores/fileStore";
import { cn } from "../../utils/cn";
import { listImages } from "../../services/tauriApi";

export function FolderTree() {
  const { folderTrees } = useFileStore();

  if (folderTrees.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-xs text-[var(--text-muted)] italic">工作区为空</p>
      </div>
    );
  }

  return (
    <div className="select-none">
      {folderTrees.map((tree, index) => (
        <div key={tree.path} className={index > 0 ? "mt-3 pt-3 border-t border-[var(--border-subtle)]/50" : ""}>
          <FolderNode node={tree} level={0} rootIndex={index} isRoot={true} />
        </div>
      ))}
    </div>
  );
}

function FolderNode({ node, level, rootIndex, isRoot = false }: { node: FileNode; level: number; rootIndex: number; isRoot?: boolean }) {
  const { toggleFolderExpanded, selectedPath, setSelectedPath, setImages, setLoading, removeRootPath } = useFileStore();
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      toggleFolderExpanded(rootIndex, node.path);
    }
  };

  const handleClick = async () => {
    if (isSelected) return;
    
    setSelectedPath(node.path);
    setLoading(true);
    try {
      const images = await listImages(node.path);
      setImages(images);
    } catch (error) {
      console.error("加载图片失败:", error);
    }
    setLoading(false);
  };

  const handleRemoveRoot = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeRootPath(node.path);
  };

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex items-center gap-2 pr-2 rounded-md cursor-pointer transition-colors relative overflow-hidden",
          isRoot ? "h-9 mb-0.5" : "h-8",
          isSelected 
            ? "bg-[var(--accent-surface)] text-[var(--text-primary)] font-medium" 
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
        )}
        style={{ paddingLeft: isRoot ? '8px' : `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Active Indicator */}
        {isSelected && (
          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--accent)] rounded-r-full" />
        )}

        {/* 展开/折叠图标 (Hitbox for toggling expansion only) */}
        <button 
          onClick={handleToggle}
          className={cn(
            "flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-sm hover:bg-[var(--bg-surface-active)]",
            isRoot ? "w-5 h-5" : "w-4 h-4"
          )}
        >
          {hasChildren ? (
            node.expanded ? (
              <ChevronDown className={isRoot ? "w-4 h-4" : "w-3.5 h-3.5"} />
            ) : (
              <ChevronRight className={isRoot ? "w-4 h-4" : "w-3.5 h-3.5"} />
            )
          ) : null}
        </button>

        {/* 文件夹图标 */}
        {isRoot ? (
           // Root folder gets no icon or a specific one? 
           // Usually VS Code uses bold text for root.
           // Let's keep icon but make it subtle? Or distinct?
           node.expanded ? (
             <FolderOpen className={cn("w-4 h-4 flex-shrink-0 text-[var(--accent)]")} />
           ) : (
             <Folder className={cn("w-4 h-4 flex-shrink-0 text-[var(--accent)]")} />
           )
        ) : (
           node.expanded && hasChildren ? (
             <FolderOpen className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
           ) : (
             <Folder className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
           )
        )}

        {/* 文件夹名称 */}
        <span className={cn(
          "truncate pt-[1px] flex-1", 
          isRoot ? "font-bold text-xs uppercase tracking-wide" : "text-sm"
        )} title={node.path}>
          {node.name}
        </span>

        {/* Root Remove Action */}
        {isRoot && (
          <button
            onClick={handleRemoveRoot}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--status-error)] transition-all"
            title="从工作区移除"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 子节点 */}
      {node.expanded && node.children && (
        <div className="animate-fade-in">
          {node.children
            .filter((child) => child.isDir)
            .map((child) => (
              <FolderNode key={child.path} node={child} level={level + 1} rootIndex={rootIndex} />
            ))}
        </div>
      )}
    </div>
  );
}