import { FolderPlus, Grid, List, Search, Settings, File, Loader2, Edit3, FileImage, Maximize2, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useUIStore } from "../../stores/uiStore";
import { useFileStore } from "../../stores/fileStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useBatchStore } from "../../stores/batchStore";
import { useFavoritesStore } from "../../favoritesStore"; // Fixed import path from context
import { selectFolder, scanDirectory, listImages, selectFiles } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

// Note: Fixing the favoritesStore import if it's actually in stores/
import { useFavoritesStore as useFavoritesStoreActual } from "../../stores/favoritesStore";

export function Toolbar() {
  const { viewMode, setViewMode } = useUIStore();
  const { 
    isLoading, 
    rootPaths, 
    addRootPath, 
    setRootPaths,
    setFolderTrees, 
    setImages, 
    setLoading,
    folderTrees,
    setSelectedPath
  } = useFileStore();
  const { selectedPaths } = useSelectionStore();
  const { openRenameDialog, openConvertDialog, openResizeDialog } = useBatchStore();
  const { addRecent } = useFavoritesStoreActual();

  const hasSelection = selectedPaths.size > 0;

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
      }
      setLoading(false);
    } catch (error) {
      console.error("打开文件失败:", error);
      setLoading(false);
    }
  };

    return (

      <header className="h-[var(--toolbar-height)] bg-[var(--bg-surface)] px-8 flex items-center justify-between gap-8 z-20">

        {/* 左侧：导航按钮 */}

        <div className="flex items-center gap-3 flex-shrink-0">

          <Button

            variant="primary"

            size="sm"

            title="添加文件夹到工作区"

            onClick={handleAddFolder}

            disabled={isLoading}

            className="gap-2.5 px-5 rounded-xl shadow-lg shadow-indigo-500/10 font-semibold"

          >

            {isLoading ? (

              <Loader2 className="w-4 h-4 animate-spin" />

            ) : (

              <FolderPlus className="w-4 h-4" />

            )}

            <span>添加文件夹</span>

          </Button>

          <Button

            variant="ghost"

            size="sm"

            title="添加图片文件"

            onClick={handleOpenFiles}

            disabled={isLoading}

            className="rounded-xl w-10 h-10 p-0"

          >

            <File className="w-4.5 h-4.5" />

          </Button>

          {rootPaths.length > 0 && (

            <Button

              variant="ghost"

              size="sm"

              title="清空工作区"

              onClick={handleClearWorkspace}

              className="text-[var(--text-muted)] hover:text-[var(--status-error)] rounded-xl w-10 h-10 p-0"

            >

              <Trash2 className="w-4.5 h-4.5" />

            </Button>

          )}

        </div>

  

        {/* 批量操作区域 (如果选中) */}

        {hasSelection ? (

          <div className="flex items-center gap-1.5 animate-fade-in bg-black/20 rounded-xl p-1.5 border border-[var(--border-subtle)] ring-1 ring-white/5 shadow-inner">

            <Button

              variant="ghost"

              size="sm"

              title="批量重命名"

              onClick={openRenameDialog}

              className="h-8 text-xs rounded-lg px-3 hover:bg-[var(--bg-surface-active)]"

            >

              <Edit3 className="w-3.5 h-3.5 mr-2" />

              重命名

            </Button>

            <Button

              variant="ghost"

              size="sm"

              title="批量转换格式"

              onClick={openConvertDialog}

               className="h-8 text-xs rounded-lg px-3 hover:bg-[var(--bg-surface-active)]"

            >

              <FileImage className="w-3.5 h-3.5 mr-2" />

              转换

            </Button>

            <Button

              variant="ghost"

              size="sm"

              title="批量调整尺寸"

              onClick={openResizeDialog}

               className="h-8 text-xs rounded-lg px-3 hover:bg-[var(--bg-surface-active)]"

            >

              <Maximize2 className="w-3.5 h-3.5 mr-2" />

              调整

            </Button>

            <div className="w-px h-4 bg-[var(--border-subtle)] mx-2" />

            <span className="text-xs font-bold text-[var(--accent)] px-3 tracking-wide">

              {selectedPaths.size} 已选择

            </span>

          </div>

        ) : (

          /* 中间：搜索框 (如果未选中) */

          <div className="flex-1 max-w-xl mx-4 min-w-0">

            <div className="relative group">

              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-all z-10" />

              <input

                type="text"

                placeholder="搜索图片资源..."

                className="w-full h-10 pl-14 pr-6 rounded-xl bg-black/20 border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-4 focus:ring-[var(--accent)]/5 transition-all shadow-inner"

              />

            </div>

          </div>

        )}

  

        {/* 右侧：视图切换和设置 */}

        <div className="flex items-center gap-2">

          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-[var(--border-subtle)] ring-1 ring-white/5 shadow-inner">

            <Button

              variant={viewMode === "grid" ? "tonal" : "ghost"}

              size="sm"

              onClick={() => setViewMode("grid")}

              title="网格视图"

              className={cn("h-8 w-10 p-0 rounded-lg transition-all", viewMode === "grid" ? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}

            >

              <Grid className="w-4 h-4" />

            </Button>

            <Button

              variant={viewMode === "list" ? "tonal" : "ghost"}

              size="sm"

              onClick={() => setViewMode("list")}

              title="列表视图"

              className={cn("h-8 w-10 p-0 rounded-lg transition-all", viewMode === "list" ? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]")}

            >

              <List className="w-4 h-4" />

            </Button>

          </div>

          

          <Button variant="ghost" size="sm" title="设置" className="text-[var(--text-secondary)] rounded-xl w-10 h-10 p-0">

            <Settings className="w-4.5 h-4.5" />

          </Button>

        </div>

      </header>

    );

  }

  