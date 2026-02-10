import { useState } from "react";
import { X, Maximize2, Loader2, Link, Unlink } from "lucide-react";
import { Button } from "../ui/Button";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore, type ImageFileInfo } from "../../stores/fileStore";
import { batchResize, selectFolder, listImages } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

const PRESETS = [
  { label: "HD (1280)", width: 1280, height: null },
  { label: "Full HD (1920)", width: 1920, height: null },
  { label: "4K (3840)", width: 3840, height: null },
  { label: "缩略图 (256)", width: 256, height: null },
  { label: "社交媒体 (1080)", width: 1080, height: 1080 },
];

export function BatchResizeDialog() {
  const { activeDialog, closeDialog, isProcessing, setProcessing } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { rootPaths, setImages } = useFileStore();

  const [width, setWidth] = useState<number | null>(1920);
  const [height, setHeight] = useState<number | null>(null);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const files = Array.from(selectedPaths);
  const isOpen = activeDialog === "resize";

  const handleSelectOutputDir = async () => {
    try {
      const folder = await selectFolder();
      if (folder) {
        setOutputDir(folder);
      }
    } catch (err) {
      console.error("选择文件夹失败:", err);
    }
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleExecute = async () => {
    if (files.length === 0 || (width === null && height === null)) return;

    setProcessing(true);
    setError(null);

    try {
      const count = await batchResize(
        files,
        width,
        height,
        maintainAspect,
        outputDir || undefined
      );

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
      alert(`成功调整 ${count} 个文件尺寸`);
    } catch (err) {
      setError(String(err));
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] bg-[var(--md-sys-color-surface-container)] rounded-[28px] border border-[var(--md-sys-color-outline-variant)]/50 shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-secondary-container)] flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-[var(--md-sys-color-on-secondary-container)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">批量调整尺寸</h2>
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
          {/* 预设 */}
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-3">
              快速预设
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all ripple",
                    width === preset.width && height === preset.height
                      ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                      : "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface)]/10 hover:text-[var(--md-sys-color-on-surface)]"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 尺寸输入 */}
          <div className="bg-[var(--md-sys-color-surface-container-high)] p-5 rounded-2xl">
            <label className="block text-sm font-medium text-[var(--md-sys-color-primary)] mb-4">
              自定义尺寸
            </label>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2 px-1">宽度 (px)</label>
                <input
                  type="number"
                  value={width ?? ""}
                  onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="自动"
                  className="w-full h-12 px-5 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] border border-transparent text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                />
              </div>

              <button
                onClick={() => setMaintainAspect(!maintainAspect)}
                className={cn(
                  "h-12 w-12 flex items-center justify-center rounded-xl transition-all ripple",
                  maintainAspect
                    ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
                    : "bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]"
                )}
                title={maintainAspect ? "保持比例" : "不保持比例"}
              >
                {maintainAspect ? (
                  <Link className="w-5 h-5" />
                ) : (
                  <Unlink className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1">
                <label className="block text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2 px-1">高度 (px)</label>
                <input
                  type="number"
                  value={height ?? ""}
                  onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="自动"
                  className="w-full h-12 px-5 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] border border-transparent text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                  disabled={maintainAspect}
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)]"></span>
              {maintainAspect
                ? "保持比例模式：图片将按比例缩放至边界内"
                : "自由模式：图片将强制拉伸至设定尺寸"}
            </p>
          </div>

          {/* 输出目录 */}
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-3">
              输出路径
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-12 px-5 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] border border-transparent flex items-center overflow-hidden">
                <span className="text-sm text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {outputDir || "覆盖原文件"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectOutputDir}>
                选择目录
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-[var(--md-sys-color-error)] text-sm bg-[var(--md-sys-color-error)]/10 p-3 rounded-lg border border-[var(--md-sys-color-error)]/20">{error}</p>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-low)]">
          <Button variant="ghost" onClick={closeDialog} disabled={isProcessing}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isProcessing || files.length === 0 || (width === null && height === null)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              `调整 ${files.length} 个文件`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}