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

function App() {
  const { openQuickPreview } = useUIStore();
  const { selectedPaths } = useSelectionStore();
  const { isEditing, openEditor } = useEditorStore();
  const { images } = useFileStore();

  // 全局键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑，忽略
      if (isEditing) return;

      // 如果正在输入，忽略
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 空格键打开预览
      if (e.key === " " && selectedPaths.size === 1) {
        e.preventDefault();
        const selectedPath = Array.from(selectedPaths)[0];
        openQuickPreview(selectedPath);
      }

      // Enter 键打开编辑器
      if (e.key === "Enter" && selectedPaths.size === 1) {
        e.preventDefault();
        const selectedPath = Array.from(selectedPaths)[0];
        const image = images.find((img) => img.path === selectedPath);
        if (image) {
          openEditor(image);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPaths, openQuickPreview, isEditing, openEditor, images]);

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
