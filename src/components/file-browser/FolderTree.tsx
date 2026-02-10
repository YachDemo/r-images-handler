import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
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
    <div className="select-none space-y-0.5">
      {folderTrees.map((tree, index) => (
        <div key={tree.path}>
          <FolderNode node={tree} level={0} rootIndex={index} />
        </div>
      ))}
    </div>
  );
}

function FolderNode({ node, level, rootIndex }: { node: FileNode; level: number; rootIndex: number }) {
  const { toggleFolderExpanded, selectedPath, setSelectedPath, setImages, setLoading } = useFileStore();
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

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group h-8 flex items-center gap-2 pr-2 rounded-md cursor-pointer text-sm transition-colors",
          isSelected 
            ? "bg-[var(--accent-surface)] text-[var(--text-primary)] font-medium" 
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* 展开/折叠图标 (Hitbox for toggling expansion only) */}
        <button 
          onClick={handleToggle}
          className="w-4 h-4 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-sm hover:bg-[var(--bg-surface-active)]"
        >
          {hasChildren ? (
            node.expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : null}
        </button>

        {/* 文件夹图标 */}
        {node.expanded && hasChildren ? (
          <FolderOpen className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
        ) : (
          <Folder className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
        )}

        {/* 文件夹名称 */}
        <span className="truncate pt-[1px]">
          {node.name}
        </span>
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