import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
// 暂时移除可能导致崩溃的插件导入进行测试
// import { ask, message } from "@tauri-apps/plugin-dialog";
import { checkPathType, deleteFile } from "./services/tauriApi";
import { MainLayout } from "./components/layout/MainLayout";
import { QuickPreview } from "./components/preview/QuickPreview";
import { ImageEditor } from "./components/editor/ImageEditor";
import { BatchRenameDialog } from "./components/batch/BatchRenameDialog";
import { BatchConvertDialog } from "./components/batch/BatchConvertDialog";
import { BatchResizeDialog } from "./components/batch/BatchResizeDialog";
import { BatchWatermarkDialog } from "./components/batch/BatchWatermarkDialog";
import { CollageDialog } from "./components/batch/CollageDialog";
import { SettingsDialog } from "./components/layout/SettingsDialog";
import { TaskQueue } from "./components/layout/TaskQueue";
import { useUIStore } from "./stores/uiStore";
import { useSelectionStore } from "./stores/selectionStore";
import { useEditorStore } from "./stores/editorStore";
import { useFileStore } from "./stores/fileStore";
import { useBatchStore } from "./stores/batchStore";

function App() {
  const { openQuickPreview, isQuickPreviewOpen } = useUIStore();
  const { selectedPaths, select, lastSelectedPath, selectAll, clearSelection } = useSelectionStore();
  const { isEditing, openEditor } = useEditorStore();
  const { images, addRootPath, setSelectedPath, triggerRefresh } = useFileStore();
  const { activeDialog, closeDialog, updateTask } = useBatchStore();

  // 监听批量任务进度
  useEffect(() => {
    const unlisten = listen<{ taskId: string; progress: number; total: number; message: string }>(
      "batch-progress",
      (event) => {
        const { taskId, progress, total, message } = event.payload;
        updateTask(taskId, {
          status: "running",
          progress,
          total,
          message,
        });
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [updateTask]);

  // 监听拖拽事件
  useEffect(() => {
    let unlistenPromise: Promise<() => void> | null = null;

    const setupDragDrop = async () => {
      try {
        const appWindow = getCurrentWindow();
        unlistenPromise = appWindow.listen("tauri://drag-drop", async (event: any) => {
          const { paths } = event.payload;
          if (paths && paths.length > 0) {
            let targetFolder = "";
            for (const path of paths) {
              try {
                const type = await checkPathType(path);
                if (type === "dir") {
                  targetFolder = path;
                  break;
                }
              } catch (e) {
                console.error("Check path type failed:", e);
              }
            }

            if (!targetFolder) {
              const firstPath = paths[0];
              const lastSep = firstPath.lastIndexOf("/");
              const lastSepWin = firstPath.lastIndexOf("\\");
              const sepIndex = Math.max(lastSep, lastSepWin);
              if (sepIndex !== -1) {
                targetFolder = firstPath.substring(0, sepIndex);
              }
            }

            if (targetFolder) {
              addRootPath(targetFolder);
              setSelectedPath(targetFolder);
              triggerRefresh();
            }
          }
        });
      } catch (err) {
        console.error("Failed to setup drag drop:", err);
      }
    };

    setupDragDrop();

    return () => {
      if (unlistenPromise) {
        unlistenPromise.then((fn) => fn());
      }
    };
  }, [addRootPath, setSelectedPath, triggerRefresh]);

  // 全局键盘事件
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      try {
        if (isQuickPreviewOpen) return;

        if (activeDialog) {
          if (e.key === "Escape") {
            e.preventDefault();
            closeDialog();
          }
          return;
        }

        if (isEditing) return;

        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        const isMod = e.ctrlKey || e.metaKey;

        if (isMod && e.key === "a") {
          e.preventDefault();
          const allPaths = images.map(img => img.path);
          selectAll(allPaths);
        }

        if (isMod && e.key === "c" && selectedPaths.size > 0) {
          e.preventDefault();
          const paths = Array.from(selectedPaths).join("\n");
          await navigator.clipboard.writeText(paths);
        }

        if (e.key === "Delete" && selectedPaths.size > 0) {
          e.preventDefault();
          const count = selectedPaths.size;
          // 使用原生 confirm 代替插件进行测试
          const confirmed = window.confirm(`确定要永久删除这 ${count} 个文件吗？此操作不可撤销。`);

          if (confirmed) {
            for (const path of selectedPaths) {
              try {
                await deleteFile(path);
              } catch (err) {
                console.error(`Delete failed for ${path}:`, err);
              }
            }
            triggerRefresh();
            clearSelection();
          }
        }

        if (e.key === " " && selectedPaths.size === 1) {
          e.preventDefault();
          const selectedPath = Array.from(selectedPaths)[0];
          openQuickPreview(selectedPath);
        }

        if (e.key === "Enter" && selectedPaths.size === 1) {
          e.preventDefault();
          const selectedPath = Array.from(selectedPaths)[0];
          const image = images.find((img) => img.path === selectedPath);
          if (image) {
            openEditor(image);
          }
        }

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          if (images.length === 0) return;

          let newIndex = 0;
          if (!lastSelectedPath) {
            newIndex = 0;
          } else {
            const currentIndex = images.findIndex(img => img.path === lastSelectedPath);
            if (currentIndex === -1) {
              newIndex = 0;
            } else {
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                newIndex = Math.max(0, currentIndex - 1);
              } else {
                newIndex = Math.min(images.length - 1, currentIndex + 1);
              }
            }
          }
          
          const targetImage = images[newIndex];
          if (targetImage) {
            select(targetImage.path);
            setTimeout(() => {
              const element = document.getElementById(`image-card-${targetImage.path}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }
            }, 0);
          }
        }
      } catch (err) {
        console.error("Keyboard event handler error:", err);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPaths, lastSelectedPath, openQuickPreview, isQuickPreviewOpen, isEditing, openEditor, images, activeDialog, closeDialog, select, selectAll, clearSelection, triggerRefresh]);

  return (
    <>
      <MainLayout />
      <QuickPreview />
      <ImageEditor />
      <BatchRenameDialog />
      <BatchConvertDialog />
      <BatchResizeDialog />
      <BatchWatermarkDialog />
      <CollageDialog />
      <SettingsDialog />
      <TaskQueue />
    </>
  );
}

export default App;
