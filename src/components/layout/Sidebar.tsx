import { useState, useEffect } from "react";
import { FolderTree } from "../file-browser/FolderTree";
import { 
  Star, Clock, Folder, X, Home, Monitor, 
  Download, Image as ImageIcon, ChevronRight, ChevronDown, 
  Plus
} from "lucide-react";
import { useFavoritesStore } from "../../stores/favoritesStore";
import { useFileStore } from "../../stores/fileStore";
import { listImages, scanDirectory, selectFolder } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

export function Sidebar({ width }: { width: number }) {
  const { favorites, recentPaths, removeFavorite, addRecent } = useFavoritesStore();
  const { 
    rootPaths, 
    addRootPath, 
    folderTrees, 
    setFolderTrees, 
    setImages, 
    setLoading, 
    selectedPath,
    setSelectedPath,
    refreshKey
  } = useFileStore();

  // Collapsible state for sections
  const [isQuickAccessOpen, setQuickAccessOpen] = useState(false); // Default closed
  const [isWorkspaceOpen, setWorkspaceOpen] = useState(true);

  // Initialization: Restore workspace trees and view
  useEffect(() => {
    const restoreState = async () => {
      // Restore workspace trees if roots exist but trees are empty (fresh load)
      if (rootPaths.length > 0 && folderTrees.length === 0) {
        try {
          const trees = await Promise.all(rootPaths.map(path => scanDirectory(path)));
          setFolderTrees(trees);
        } catch (e) {
          console.error("Failed to restore workspace trees:", e);
        }
      }

      // Restore image view (Force reload)
      if (selectedPath) {
        handleOpenPath(selectedPath, true);
      }
    };
    
    restoreState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); 

  const handleOpenPath = async (path: string, force = false) => {
    // If it's a file path (naive check), get parent dir
    // This handles "Open File" -> Show in Workspace scenario
    let dirPath = path;
    const isFile = path.split(/[/\\]/).pop()?.includes('.'); // Simple heuristic
    if (isFile) {
       // Remove filename
       const separator = path.includes('\\') ? '\\' : '/';
       dirPath = path.substring(0, path.lastIndexOf(separator));
    }

    if (!force && selectedPath === dirPath && rootPaths.includes(dirPath)) return;
    
    setLoading(true);
    addRecent(dirPath);
    setSelectedPath(dirPath);
    
    try {
      // Add to workspace if not present (as requested)
      if (!rootPaths.includes(dirPath)) {
        addRootPath(dirPath);
        const tree = await scanDirectory(dirPath);
        setFolderTrees([...folderTrees, tree]);
      }
      
      const newImages = await listImages(dirPath);
      setImages(newImages);
    } catch (error) {
      console.error("加载失败:", error);
    }
    setLoading(false);
  };

  const handleAddWorkspace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const folderPath = await selectFolder();
      if (folderPath) {
        setLoading(true);
        addRecent(folderPath);
        
        if (!rootPaths.includes(folderPath)) {
          addRootPath(folderPath);
          const tree = await scanDirectory(folderPath);
          setFolderTrees([...folderTrees, tree]);
        }
        
        // Auto select
        handleOpenPath(folderPath);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const systemPaths = [
    { name: "主目录", path: getHomePath(), icon: Home },
    { name: "桌面", path: `${getHomePath()}/Desktop`, icon: Monitor },
    { name: "图片", path: `${getHomePath()}/Pictures`, icon: ImageIcon },
    { name: "下载", path: `${getHomePath()}/Downloads`, icon: Download },
  ];

  return (
    <aside 
      style={{ width }} 
      className="bg-[var(--bg-surface)] flex flex-col h-full overflow-hidden flex-shrink-0 border-r border-[var(--border-subtle)] select-none"
    >
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        
        {/* Section 1: Quick Access (System + Favorites) */}
        <div className="mb-2">
          <SectionHeader 
            title="快速访问" 
            isOpen={isQuickAccessOpen} 
            onToggle={() => setQuickAccessOpen(!isQuickAccessOpen)} 
          />
          
          {isQuickAccessOpen && (
            <div className="mt-1 space-y-0.5 px-2 animate-fade-in">
              {/* System Paths */}
              {systemPaths.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.name}
                  isActive={selectedPath === item.path}
                  onClick={() => handleOpenPath(item.path)}
                />
              ))}

              {/* Favorites Separator */}
              {favorites.length > 0 && <div className="h-px bg-[var(--border-subtle)] my-2 mx-2 opacity-50" />}

              {/* Favorites */}
              {favorites.map((path) => {
                const name = path.split("/").pop() || path;
                return (
                  <SidebarItem
                    key={path}
                    icon={Star}
                    label={name}
                    isActive={selectedPath === path}
                    onClick={() => handleOpenPath(path)}
                    rightAction={
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFavorite(path); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--status-error)] transition-all"
                        title="取消收藏"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    }
                    iconClassName="text-yellow-500 fill-yellow-500/20"
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Workspace (Folder Tree) */}
        <div className="mb-2">
          <SectionHeader 
            title="工作区" 
            isOpen={isWorkspaceOpen} 
            onToggle={() => setWorkspaceOpen(!isWorkspaceOpen)}
            action={
              <button 
                onClick={handleAddWorkspace}
                className="p-1 rounded hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                title="添加文件夹"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            }
          />
          
          {isWorkspaceOpen && (
            <div className="mt-1 px-2 animate-fade-in">
              {rootPaths.length === 0 ? (
                <div 
                  className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[var(--border-subtle)] rounded-xl cursor-pointer hover:border-[var(--accent)]/50 hover:bg-[var(--bg-surface-hover)] transition-all group"
                  onClick={handleAddWorkspace}
                >
                  <Folder className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--accent)] mb-2 transition-colors" />
                  <span className="text-xs text-[var(--text-muted)]">点击添加文件夹</span>
                </div>
              ) : (
                <FolderTree />
              )}
            </div>
          )}
        </div>

        {/* Section 3: Recent (Collapsible, Default Closed if many?) */}
        {recentPaths.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] mx-4">
            <div className="flex items-center gap-2 mb-2 text-[var(--text-muted)]">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">最近访问</span>
            </div>
            <div className="space-y-0.5">
              {recentPaths.slice(0, 5).map((path) => {
                const name = path.split("/").pop() || path;
                return (
                  <SidebarItem
                    key={path}
                    icon={Folder}
                    label={name}
                    isActive={selectedPath === path}
                    onClick={() => handleOpenPath(path)}
                    variant="ghost"
                    className="h-7 text-xs"
                    iconClassName="w-3.5 h-3.5 opacity-70"
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}

function SectionHeader({ 
  title, 
  isOpen, 
  onToggle, 
  action 
}: { 
  title: string, 
  isOpen: boolean, 
  onToggle: () => void, 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 group">
      <button 
        onClick={onToggle}
        className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors"
      >
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </button>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {action}
      </div>
    </div>
  );
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  rightAction,
  iconClassName,
  variant = "default",
  className
}: { 
  icon: any, 
  label: string, 
  isActive: boolean, 
  onClick: () => void,
  rightAction?: React.ReactNode,
  iconClassName?: string,
  variant?: "default" | "ghost",
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 px-3 rounded-lg transition-all duration-200 relative overflow-hidden text-left",
        variant === "default" ? "h-9 text-sm" : "h-7 text-xs",
        isActive 
          ? "bg-[var(--accent-surface)] text-[var(--text-primary)] font-medium" 
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[var(--accent)] rounded-r-full" />
      )}
      
      <Icon className={cn(
        "flex-shrink-0 transition-colors", 
        variant === "default" ? "w-4 h-4" : "w-3.5 h-3.5",
        isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]",
        iconClassName
      )} />
      
      <span className="truncate flex-1 pt-[0.5px]" title={label}>{label}</span>
      
      {rightAction && (
        <div className="flex-shrink-0">
          {rightAction}
        </div>
      )}
    </button>
  );
}

function getHomePath(): string {
  // Simple check for browser env vs tauri env mock
  return "/Users/" + (typeof window !== "undefined" ? "yanch" : "user");
}