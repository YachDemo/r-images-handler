import { useEffect } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { QuickPreview } from "./components/preview/QuickPreview";
import { ImageEditor } from "./components/editor/ImageEditor";
import { BatchRenameDialog } from "./components/batch/BatchRenameDialog";
import { BatchConvertDialog } from "./components/batch/BatchConvertDialog";
import { BatchResizeDialog } from "./components/batch/BatchResizeDialog";
import { CollageDialog } from "./components/batch/CollageDialog";
import { useUIStore } from "./stores/uiStore";
import { useSelectionStore } from "./stores/selectionStore";
import { useEditorStore } from "./stores/editorStore";
import { useFileStore } from "./stores/fileStore";
import { useBatchStore } from "./stores/batchStore";

function App() {
  const { openQuickPreview, isQuickPreviewOpen } = useUIStore();
  const { selectedPaths, select, lastSelectedPath } = useSelectionStore();
  const { isEditing, openEditor } = useEditorStore();
  const { images } = useFileStore();
  const { activeDialog, closeDialog } = useBatchStore();

  // 全局键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. 如果快速预览已打开，交由 QuickPreview 处理（防止冲突）
      if (isQuickPreviewOpen) return;

      // 1. 处理弹窗关闭 (Escape)
      if (activeDialog) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeDialog();
        }
        return; // 弹窗打开时阻止其他快捷键
      }

      // 2. 如果正在编辑，忽略
      if (isEditing) return;

      // 3. 如果正在输入，忽略
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 4. 空格键打开预览
      if (e.key === " " && selectedPaths.size === 1) {
        e.preventDefault();
        const selectedPath = Array.from(selectedPaths)[0];
        openQuickPreview(selectedPath);
      }

      // 5. Enter 键打开编辑器
      if (e.key === "Enter" && selectedPaths.size === 1) {
        e.preventDefault();
        const selectedPath = Array.from(selectedPaths)[0];
        const image = images.find((img) => img.path === selectedPath);
        if (image) {
          openEditor(image);
        }
      }

      // 6. 方向键导航
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (images.length === 0) return;

        let newIndex = 0;
        // 如果没有选中，从第一个开始
        if (!lastSelectedPath) {
          newIndex = 0;
        } else {
          const currentIndex = images.findIndex(img => img.path === lastSelectedPath);
          if (currentIndex === -1) {
             newIndex = 0;
          } else {
             // 简单的左右/上下逻辑：上/左=前一个，下/右=后一个
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
           // 滚动到可视区域
           setTimeout(() => {
             const element = document.getElementById(`image-card-${targetImage.path}`);
             if (element) {
               element.scrollIntoView({ behavior: "smooth", block: "nearest" });
             }
           }, 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPaths, lastSelectedPath, openQuickPreview, isQuickPreviewOpen, isEditing, openEditor, images, activeDialog, closeDialog, select]);

  return (
    <>
      <MainLayout />
      <QuickPreview />
      <ImageEditor />
      <BatchRenameDialog />
      <BatchConvertDialog />
      <BatchResizeDialog />
      <CollageDialog />
    </>
  );
}

export default App;
