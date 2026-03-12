import { useRef, useState } from "react";
import { FolderPlus, Grid, List, Search, Settings, Loader2, FileImage, Trash2, Filter, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useUIStore } from "../../stores/uiStore";
import { useFileStore } from "../../stores/fileStore";
import { useFavoritesStore as useFavoritesStoreActual } from "../../stores/favoritesStore";
import { selectFolder, scanDirectory, listImages, selectFiles } from "../../services/tauriApi";
import { cn } from "../../utils/cn";
import { FilterPopover } from "./FilterPopover";

export function Toolbar() {
  const { viewMode, setViewMode, setSettingsOpen } = useUIStore();
  const { 
    isLoading, 
    rootPaths, 
    addRootPath, 
    setRootPaths,
    setFolderTrees, 
    setImages, 
    setLoading,
    folderTrees,
    setSelectedPath,
    searchQuery,
    setSearchQuery,
    filterOptions
  } = useFileStore();
  const { addRecent } = useFavoritesStoreActual();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);

  const hasActiveFilters = filterOptions.formats.length > 0 || 
                          filterOptions.minWidth > 0 || 
                          filterOptions.minHeight > 0 || 
                          filterOptions.startDate !== null || 
                          filterOptions.endDate !== null;

  const handleAddFolder = async () => {
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

        setSelectedPath(folderPath);
        const newImages = await listImages(folderPath);
        setImages(newImages);
        setLoading(false);
      }
    } catch (error) {
      console.error("添加文件夹失败:", error);
      setLoading(false);
    }
  };

  const handleClearWorkspace = () => {
    setRootPaths([]);
    setFolderTrees([]);
    setImages([]);
    setSelectedPath(null);
  };

  const handleOpenFiles = async () => {
    try {
      setLoading(true);
      const images = await selectFiles();
      if (images.length > 0) {
        const currentImages = useFileStore.getState().images;
        const mergedImages = [...currentImages];
        images.forEach(img => {
          if (!mergedImages.find(m => m.path === img.path)) {
            mergedImages.push(img);
          }
        });
        setImages(mergedImages);

        const firstFile = images[0];
        const separator = firstFile.path.includes('\\') ? '\\' : '/';
        const parentDir = firstFile.path.substring(0, firstFile.path.lastIndexOf(separator));

        if (parentDir) {
          addRecent(parentDir);
          setSelectedPath(parentDir);
          
          if (!rootPaths.includes(parentDir)) {
            addRootPath(parentDir);
            try {
              const tree = await scanDirectory(parentDir);
              const currentTrees = useFileStore.getState().folderTrees;
              setFolderTrees([...currentTrees, tree]);
            } catch (e) {
              console.error("Failed to scan parent dir:", e);
            }
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("打开文件失败:", error);
      setLoading(false);
    }
  };

  return (
    <header className="h-[var(--toolbar-height)] bg-[var(--bg-surface)]/80 backdrop-blur-xl px-6 flex items-center justify-between gap-8 z-20 relative overflow-hidden text-[var(--text-primary)]">
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* 左侧：文件操作 */}
      <div className="flex items-center gap-3 flex-shrink-0 relative">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddFolder}
          disabled={isLoading}
          className="gap-3 px-6 rounded-2xl shadow-xl shadow-indigo-500/20 font-black italic tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
          <span>添加文件夹</span>
        </Button>
        
        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenFiles}
            className="rounded-lg w-9 h-9 p-0 hover:bg-white/5 text-[var(--text-secondary)] hover:text-white transition-all"
            title="添加图片文件"
          >
            <FileImage className="w-4 h-4" />
          </Button>

          {rootPaths.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearWorkspace}
              className="text-[var(--text-muted)] hover:text-red-400 rounded-lg w-9 h-9 p-0 hover:bg-red-500/5 transition-all"
              title="清空工作区"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 中间：全局搜索 (常驻) */}
      <div className="flex-1 max-w-2xl mx-auto flex items-center gap-4">
        <div className="relative group flex-1">
          <div className="absolute inset-0 bg-[var(--accent)]/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none transition-all group-focus-within:translate-x-1">
              <Search className="w-4.5 h-4.5 text-[var(--text-muted)] group-focus-within:text-[var(--accent)]" />
              <div className="w-px h-4 bg-white/10" />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索图片文件名、格式、日期..."
              className="w-full h-11 pl-16 pr-12 rounded-2xl bg-black/40 border border-white/5 group-hover:border-white/10 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-4 focus:ring-[var(--accent)]/5 transition-all shadow-inner placeholder-[var(--text-muted)]/50"
            />
            
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            ref={filterTriggerRef}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "h-11 px-5 flex items-center gap-3 rounded-2xl border transition-all shadow-lg relative group/filter overflow-hidden",
              hasActiveFilters || isFilterOpen 
                ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] shadow-[var(--accent)]/10" 
                : "bg-black/40 border-white/5 text-[var(--text-muted)] hover:border-white/20 hover:text-white"
            )}
          >
            <Filter className={cn("w-4 h-4 transition-transform group-hover/filter:rotate-12", (hasActiveFilters || isFilterOpen) && "fill-current")} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden xl:inline">高级筛选</span>
            {hasActiveFilters && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-[var(--accent)] rounded-bl-lg shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            )}
          </button>
          <FilterPopover 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)} 
            triggerRef={filterTriggerRef} 
          />
        </div>
      </div>

      {/* 右侧：视图与设置 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center bg-black/30 rounded-2xl p-1 border border-white/5 ring-1 ring-white/5 shadow-inner">
          <Button
            variant={viewMode === "grid" ? "tonal" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-9 w-11 p-0 rounded-xl transition-all", 
              viewMode === "grid" 
                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            <Grid className="w-4.5 h-4.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "tonal" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn(
              "h-9 w-11 p-0 rounded-xl transition-all", 
              viewMode === "list" 
                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                : "text-[var(--text-muted)] hover:text-white"
            )}
          >
            <List className="w-4.5 h-4.5" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSettingsOpen(true)} 
          className="text-[var(--text-secondary)] hover:text-white hover:bg-white/5 rounded-2xl w-11 h-11 p-0 transition-all border border-transparent hover:border-white/5"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
