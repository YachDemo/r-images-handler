import { useState } from "react";
import { X, FileImage, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore, type ImageFileInfo } from "../../stores/fileStore";
import { batchConvert, selectFolder, listImages } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

const FORMATS = [
  { value: "jpg", label: "JPEG", description: "通用格式，适合照片" },
  { value: "png", label: "PNG", description: "无损压缩，支持透明" },
  { value: "webp", label: "WebP", description: "现代格式，体积更小" },
  { value: "bmp", label: "BMP", description: "无压缩位图" },
];

export function BatchConvertDialog() {
  const { activeDialog, closeDialog, isProcessing, setProcessing } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { rootPaths, setImages } = useFileStore();

  const [targetFormat, setTargetFormat] = useState("jpg");
  const [quality, setQuality] = useState(85);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const files = Array.from(selectedPaths);
  const isOpen = activeDialog === "convert";

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

  const handleExecute = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      const count = await batchConvert(files, targetFormat, quality, outputDir || undefined);

      // 刷新工作区所有受影响的图片
      const allNewImages = [];
      for (const path of rootPaths) {
        try {
          const imgs = await listImages(path);
          allNewImages.push(...imgs);
        } catch (e) {
          console.error(`刷新目录 ${path} 失败:`, e);
        }
      }
      
      // 去重
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
      alert(`成功转换 ${count} 个文件`);
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
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-tertiary-container)] flex items-center justify-center">
              <FileImage className="w-5 h-5 text-[var(--md-sys-color-on-tertiary-container)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--md-sys-color-on-surface)]">批量格式转换</h2>
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
          {/* 格式选择 */}
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-3">
              目标格式
            </label>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setTargetFormat(format.value)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all ripple",
                    targetFormat === format.value
                      ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                      : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)]"
                  )}
                >
                  <span className="block text-sm font-bold">
                    {format.label}
                  </span>
                  <span className="block text-xs opacity-70 mt-1 leading-tight">
                    {format.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 质量滑块 (仅对 JPEG/WebP 有效) */}
          {(targetFormat === "jpg" || targetFormat === "webp") && (
            <div className="bg-[var(--md-sys-color-surface-container-high)] p-4 rounded-2xl">
              <Slider
                label="压缩质量"
                value={quality}
                onChange={setQuality}
                min={1}
                max={100}
              />
            </div>
          )}

          {/* 输出目录 */}
          <div>
            <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-3">
              输出目录
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-12 px-5 rounded-lg bg-[var(--md-sys-color-surface-container-highest)] border border-transparent flex items-center overflow-hidden">
                <span className="text-sm text-[var(--md-sys-color-on-surface-variant)] truncate">
                  {outputDir || "原文件所在目录"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectOutputDir}>
                选择
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
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              `转换 ${files.length} 个文件`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
