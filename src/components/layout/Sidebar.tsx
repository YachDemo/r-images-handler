import { FolderTree } from "../file-browser/FolderTree";
import { Star, Clock, Folder, X, Trash2 } from "lucide-react";
import { useFavoritesStore } from "../../stores/favoritesStore";
import { useFileStore } from "../../stores/fileStore";
import { listImages, scanDirectory } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

export function Sidebar({ width }: { width: number }) {
  const { favorites, recentPaths, removeFavorite, clearRecent, addRecent } = useFavoritesStore();
  const { 
    rootPaths, 
    addRootPath, 
    folderTrees, 
    setFolderTrees, 
    setImages, 
    setLoading, 
    images,
    selectedPath,
    setSelectedPath 
  } = useFileStore();

  const handleOpenPath = async (path: string) => {
    if (selectedPath === path && rootPaths.includes(path)) return;
    
    setLoading(true);
    addRecent(path);
    setSelectedPath(path);
    
    try {
      if (!rootPaths.includes(path)) {
        addRootPath(path);
        const tree = await scanDirectory(path);
        setFolderTrees([...folderTrees, tree]);
      }

      const newImages = await listImages(path);
      setImages(newImages);
    } catch (error) {
      console.error("加载失败:", error);
    }
    setLoading(false);
  };

  const diskPaths = [
    { name: "主目录", path: getHomePath() },
    { name: "桌面", path: `${getHomePath()}/Desktop` },
    { name: "图片", path: `${getHomePath()}/Pictures` },
    { name: "下载", path: `${getHomePath()}/Downloads` },
  ];

  return (
    <aside 
      style={{ width }} 
      className="bg-[var(--bg-surface)] flex flex-col h-full overflow-hidden flex-shrink-0 border-r border-[var(--border-subtle)]"
    >
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-7 custom-scrollbar">
        {/* 收藏夹 */}
        <section>
          <SectionHeader title="收藏夹" />
          <div className="space-y-1 mt-2">
            {favorites.length === 0 ? (
              <p className="px-4 py-2 text-[11px] text-[var(--text-muted)] italic">暂无收藏内容</p>
            ) : (
              favorites.map((path) => (
                <FavoriteItem
                  key={path}
                  path={path}
                  isActive={selectedPath === path}
                  onClick={() => handleOpenPath(path)}
                  onRemove={() => removeFavorite(path)}
                />
              ))
            )}
          </div>
        </section>

        {/* 最近打开 */}
        <section>
          <div className="flex items-center justify-between px-4 py-1 group">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] select-none">
              最近访问
            </span>
            {recentPaths.length > 0 && (
              <button
                onClick={clearRecent}
                className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--status-error)] transition-all p-1 rounded hover:bg-[var(--bg-surface-active)]"
                title="清除历史"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-1 mt-2">
            {recentPaths.length === 0 ? (
              <p className="px-4 py-2 text-[11px] text-[var(--text-muted)] italic">暂无历史记录</p>
            ) : (
              recentPaths.map((path) => (
                <RecentItem
                  key={path}
                  path={path}
                  isActive={selectedPath === path}
                  onClick={() => handleOpenPath(path)}
                />
              ))
            )}
          </div>
        </section>

        {/* 快捷位置 */}
        <section>
          <SectionHeader title="快捷访问" />
          <div className="space-y-1 mt-2">
            {diskPaths.map((item) => (
              <NavItem
                key={item.path}
                icon={Folder}
                label={item.name}
                isActive={selectedPath === item.path}
                onClick={() => handleOpenPath(item.path)}
              />
            ))}
          </div>
        </section>

        {/* 文件夹树 */}
        <section>
          <SectionHeader title="工作区" />
          <div className="mt-1">
            <FolderTree />
          </div>
        </section>
      </div>
    </aside>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] select-none">
      {title}
    </div>
  );
}

function NavItem({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full h-9 flex items-center gap-3 px-3 rounded-lg text-sm transition-all duration-200 select-none relative overflow-hidden",
        isActive 
          ? "bg-[var(--accent-surface)] text-[var(--text-primary)] font-medium" 
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--accent)] rounded-r-full" />
      )}
      
      <Icon className={cn(
        "w-4 h-4 flex-shrink-0 transition-colors", 
        isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
      )} />
      <span className="truncate pt-[0.5px]">{label}</span>
    </button>
  );
}

function FavoriteItem({
  path,
  isActive,
  onClick,
  onRemove,
}: {
  path: string;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const name = path.split("/").pop() || path;

  return (
    <div className={cn(
      "group h-9 flex items-center gap-1 rounded-lg transition-all duration-200 relative overflow-hidden",
      isActive 
        ? "bg-[var(--accent-surface)] text-[var(--text-primary)]" 
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
    )}>
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--accent)] rounded-r-full" />
      )}

      <button
        onClick={onClick}
        className="flex-1 h-full flex items-center gap-3 px-3 text-sm text-left truncate select-none"
      >
        <Star className={cn(
          "w-4 h-4 flex-shrink-0 transition-all", 
          isActive ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
        )} />
        <span className={cn("truncate pt-[0.5px]", isActive && "font-medium")}>{name}</span>
      </button>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded-md hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--status-error)] transition-all"
        title="取消收藏"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function RecentItem({ 
  path, 
  isActive, 
  onClick 
}: { 
  path: string; 
  isActive: boolean; 
  onClick: () => void 
}) {
  const name = path.split("/").pop() || path;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full h-9 flex items-center gap-3 px-3 rounded-lg text-sm transition-all duration-200 select-none relative overflow-hidden",
        isActive 
          ? "bg-[var(--accent-surface)] text-[var(--text-primary)] font-medium" 
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--accent)] rounded-r-full" />
      )}

      <Clock className={cn(
        "w-4 h-4 flex-shrink-0 transition-colors", 
        isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
      )} />
      <span className="truncate pt-[0.5px]">{name}</span>
    </button>
  );
}

function getHomePath(): string {
  return "/Users/" + (typeof window !== "undefined" ? "yanch" : "user");
}
