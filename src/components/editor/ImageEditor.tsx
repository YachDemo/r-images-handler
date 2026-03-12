import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Save, Download, RotateCcw, RotateCw,
  FlipHorizontal, FlipVertical, RefreshCw, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "../ui/Button";
import { ColorSliders } from "./ColorSliders";
import { useEditorStore } from "../../stores/editorStore";
import { applyEditsPreview, saveEditedImage, selectSavePath } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

export function ImageEditor() {
  const {
    isEditing,
    currentImage,
    previewUrl,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    isProcessing,
    hasChanges,
    closeEditor,
    rotateLeft,
    rotateRight,
    toggleFlipH,
    toggleFlipV,
    resetAll,
    setPreviewUrl,
    setProcessing,
    markSaved,
  } = useEditorStore();

  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const canEdit = currentImage?.supportsEditing !== false;

  // 实时预览更新
  const updatePreview = useCallback(async () => {
    if (!currentImage) return;

    // 如果是不支持编辑的格式，直接显示缩略图作为预览，不调用 applyEditsPreview
    if (!canEdit) {
      setPreviewUrl(currentImage.thumbnailPath);
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const preview = await applyEditsPreview(
        currentImage.path,
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        saturation
      );
      setPreviewUrl(preview);
    } catch (err: any) {
      console.error("预览更新失败:", err);
      setError(err?.message || String(err));
    }
    setProcessing(false);
  }, [currentImage, canEdit, rotation, flipH, flipV, brightness, contrast, saturation, setPreviewUrl, setProcessing]);

  // 防抖更新预览
  useEffect(() => {
    if (!isEditing || !currentImage) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      updatePreview();
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [rotation, flipH, flipV, brightness, contrast, saturation, isEditing, currentImage, updatePreview]);

  // 保存图片
  const handleSave = async () => {
    if (!currentImage) return;

    setProcessing(true);
    try {
      const { saveCurrentEdits } = useEditorStore.getState();
      
      // 物理保存图片文件
      await saveEditedImage(
        currentImage.path,
        currentImage.path,
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        saturation,
        90
      );
      
      // 尝试保存非破坏性编辑历史到 SQLite
      try {
        await saveCurrentEdits();
      } catch (historyError) {
        console.warn("保存编辑历史记录失败，但图片文件已更新:", historyError);
      }
      
      markSaved();
      closeEditor();
    } catch (error) {
      console.error("保存失败:", error);
    }
    setProcessing(false);
  };

  // 另存为
  const handleSaveAs = async () => {
    if (!currentImage) return;

    const targetPath = await selectSavePath(currentImage.name);
    if (!targetPath) return;

    setProcessing(true);
    try {
      await saveEditedImage(
        currentImage.path,
        targetPath,
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        saturation,
        90
      );

      // 为另存为的新文件建立编辑历史
      try {
        const { rotation: r, flipH: fh, flipV: fv, brightness: b, contrast: c, saturation: s } = useEditorStore.getState();
        const { saveEditSequence } = await import("../../services/dbService");
        const stateToSave = {
          type: 'fullState',
          params: { rotation: r, flipH: fh, flipV: fv, brightness: b, contrast: c, saturation: s }
        };
        await saveEditSequence(targetPath, [stateToSave]);
      } catch (historyErr) {
        console.warn("为另存为的文件创建编辑历史失败:", historyErr);
      }

      markSaved();
      closeEditor();
    } catch (error) {
      console.error("保存失败:", error);
    }
    setProcessing(false);
  };

  // 键盘快捷键
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeEditor();
      } else if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, closeEditor]);

  if (!isEditing || !currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex flex-col animate-fade-in">
      {/* 顶部工具栏 */}
      <header className="h-[var(--toolbar-height)] bg-[var(--md-sys-color-surface-container)] border-b border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={closeEditor}>
            <X className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-[var(--md-sys-color-outline-variant)]/30" />
          <span className="text-[var(--md-sys-color-on-surface)] font-medium truncate max-w-[300px]">
            {currentImage.name}
          </span>
          {hasChanges && (
            <span className="text-xs text-[var(--md-sys-color-on-primary-container)] bg-[var(--md-sys-color-primary-container)] px-3 py-1 rounded-full font-medium">
              未保存
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleSaveAs} disabled={isProcessing || !canEdit}>
            <Download className="w-4 h-4 mr-2" />
            另存为
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isProcessing || !hasChanges || !canEdit}>
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存
          </Button>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具栏 */}
        <aside className={cn(
          "w-20 bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline-variant)]/30 flex flex-col items-center py-6 gap-3",
          !canEdit && "opacity-50 pointer-events-none grayscale-[0.5]"
        )}>
          <ToolButton
            icon={RotateCcw}
            label="左转"
            onClick={rotateLeft}
            disabled={isProcessing}
          />
          <ToolButton
            icon={RotateCw}
            label="右转"
            onClick={rotateRight}
            disabled={isProcessing}
          />
          <div className="w-10 h-px bg-[var(--md-sys-color-outline-variant)]/30 my-2" />
          <ToolButton
            icon={FlipHorizontal}
            label="水平"
            onClick={toggleFlipH}
            active={flipH}
            disabled={isProcessing}
          />
          <ToolButton
            icon={FlipVertical}
            label="垂直"
            onClick={toggleFlipV}
            active={flipV}
            disabled={isProcessing}
          />
          <div className="w-10 h-px bg-[var(--md-sys-color-outline-variant)]/30 my-2" />
          <ToolButton
            icon={RefreshCw}
            label="重置"
            onClick={resetAll}
            disabled={isProcessing}
          />
        </aside>

        {/* 中央画布 */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--md-sys-color-surface-container-high)]">
          <div className="relative max-w-full max-h-full">
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg z-10 backdrop-blur-sm">
                <Loader2 className="w-10 h-10 text-[var(--md-sys-color-primary)] animate-spin" />
              </div>
            )}
            
            {error ? (
              <div className="flex flex-col items-center gap-4 text-[var(--md-sys-color-on-surface-variant)] p-8 max-w-md text-center bg-[var(--md-sys-color-surface-container)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-xl">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-1">预览加载失败</h3>
                  <p className="text-xs opacity-70 leading-relaxed">{error}</p>
                </div>
              </div>
            ) : !canEdit ? (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <img
                    src={previewUrl || ""}
                    alt={currentImage.name}
                    className="max-w-full max-h-[calc(100vh-300px)] object-contain rounded-lg shadow-2xl opacity-40 grayscale-[0.3]"
                    draggable={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-1">受限格式</h4>
                        <p className="text-[10px] opacity-80">{currentImage.extension.toUpperCase()} 目前仅支持属性与元数据预览</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={previewUrl || ""}
                alt={currentImage.name}
                className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl transition-all duration-300"
                draggable={false}
              />
            )}
          </div>
        </main>

        {/* 右侧调整面板 */}
        <aside className={cn(
          "w-80 bg-[var(--md-sys-color-surface-container-low)] border-l border-[var(--md-sys-color-outline-variant)]/30 p-6 overflow-y-auto",
          !canEdit && "opacity-50 pointer-events-none grayscale-[0.5]"
        )}>
          <ColorSliders />

          {/* 当前参数显示 */}
          <div className="mt-8 pt-6 border-t border-[var(--md-sys-color-outline-variant)]/30">
            <h3 className="text-xs font-semibold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-4">
              当前状态
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">旋转</span>
                <span className="text-[var(--md-sys-color-on-surface)] font-medium">{rotation}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">水平翻转</span>
                <span className={flipH ? "text-[var(--md-sys-color-primary)] font-medium" : "text-[var(--md-sys-color-on-surface)]"}>
                  {flipH ? "是" : "否"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--md-sys-color-on-surface-variant)]">垂直翻转</span>
                <span className={flipV ? "text-[var(--md-sys-color-primary)] font-medium" : "text-[var(--md-sys-color-on-surface)]"}>
                  {flipV ? "是" : "否"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 底部状态栏 */}
      <footer className="h-[var(--statusbar-height)] bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-center px-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        <span>原始尺寸: {currentImage.width} × {currentImage.height}</span>
        <span className="mx-4 opacity-30">•</span>
        <span>{currentImage.sizeFormatted}</span>
        <span className="mx-4 opacity-30">•</span>
        <span>Ctrl+S 保存 | Esc 关闭</span>
      </footer>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={cn(
        "w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ripple",
        active 
          ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]" 
          : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface)]/10 hover:text-[var(--md-sys-color-on-surface)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
