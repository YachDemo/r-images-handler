import { useState, useEffect } from "react";
import { X, Edit3, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore, type ImageFileInfo } from "../../stores/fileStore";
import { batchRenamePreview, batchRenameExecute, listImages } from "../../services/tauriApi";

export function BatchRenameDialog() {
  const { activeDialog, closeDialog, isProcessing, setProcessing } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { rootPaths, setImages } = useFileStore();

  const [pattern, setPattern] = useState("{name}_{n}");
  const [startNumber, setStartNumber] = useState(1);
  const [preview, setPreview] = useState<[string, string][]>([]);
  const [error, setError] = useState<string | null>(null);

  const files = Array.from(selectedPaths);
  const isOpen = activeDialog === "rename";

  useEffect(() => {
    if (isOpen && files.length > 0) {
      updatePreview();
    }
  }, [isOpen, pattern, startNumber]);

  const updatePreview = async () => {
    try {
      setError(null);
      const result = await batchRenamePreview(files, pattern, startNumber);
      setPreview(result);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleExecute = async () => {
    if (preview.length === 0) return;

    setProcessing(true);
    try {
      const count = await batchRenameExecute(preview);

      // 刷新所有受影响的图片列表
      const allNewImages: ImageFileInfo[] = [];
      for (const path of rootPaths) {
        try {
          const imgs = await listImages(path);
          allNewImages.push(...imgs);
        } catch (e) {
          console.error(`刷新目录 ${path} 失败:`, e);
        }
      }
      
      // 去重合并
      const uniqueImages: ImageFileInfo[] = [];
      const seen = new Set();
      allNewImages.forEach(img => {
        if (!seen.has(img.path)) {
          seen.add(img.path);
          uniqueImages.push(img);
        }
      });
      
      setImages(uniqueImages);

      clearSelection();
      closeDialog();
      alert(`成功重命名 ${count} 个文件`);
    } catch (err) {
      setError(String(err));
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[600px] max-h-[80vh] bg-[var(--md-sys-color-surface-container)] rounded-[28px] border border-[var(--md-sys-color-outline-variant)]/50 shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-secondary-container)] flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-[var(--md-sys-color-on-secondary-container)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">批量重命名</h2>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">已选择 {files.length} 个文件</p>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-on-surface)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 设置区域 */}
        <div className="p-6 pt-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">
              命名模式
            </label>
            <div className="relative">
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full h-12 px-5 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] border border-transparent text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                placeholder="{name}_{n}"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)] flex gap-2">
              <span>可用占位符:</span>
              <code className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-highest)] rounded text-[var(--md-sys-color-primary)] font-mono">{"{n}"}</code>
              <span>序号</span>
              <code className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface-container-highest)] rounded text-[var(--md-sys-color-primary)] font-mono">{"{name}"}</code>
              <span>原文件名</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">
              起始序号
            </label>
            <input
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-32 h-12 px-5 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] border border-transparent text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
              min={0}
            />
          </div>
        </div>

        {/* 预览列表 */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <h3 className="text-sm font-medium text-[var(--md-sys-color-primary)] mb-3">预览</h3>
          {error ? (
            <p className="text-[var(--md-sys-color-error)] text-sm bg-[var(--md-sys-color-error)]/10 p-3 rounded-lg border border-[var(--md-sys-color-error)]/20">{error}</p>
          ) : (
            <div className="space-y-2">
              {preview.slice(0, 10).map(([oldPath, newPath], index) => {
                const oldName = oldPath.split("/").pop() || oldPath;
                const newName = newPath.split("/").pop() || newPath;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-sm"
                  >
                    <span className="text-[var(--md-sys-color-on-surface-variant)] truncate flex-1">{oldName}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--md-sys-color-outline)] flex-shrink-0" />
                    <span className="text-[var(--md-sys-color-on-surface)] truncate flex-1 font-medium">{newName}</span>
                  </div>
                );
              })}
              {preview.length > 10 && (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] text-center py-2">
                  还有 {preview.length - 10} 个文件...
                </p>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/50">
          <Button variant="ghost" onClick={closeDialog} disabled={isProcessing}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isProcessing || preview.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              `重命名 ${files.length} 个文件`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
