import { useState, useMemo } from "react";
import { X, Maximize2, Link, Unlink, FolderOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { batchResize, selectFolder } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

const PRESETS = [
  { label: "1920 Full HD", width: 1920, height: null, desc: "标准高清屏" },
  { label: "1280 HD", width: 1280, height: null, desc: "普通显示屏" },
  { label: "3840 4K", width: 3840, height: null, desc: "超高清分辨率" },
  { label: "1080 Insta", width: 1080, height: 1080, desc: "社交媒体方图" },
];

export function BatchResizeDialog() {
  const { activeDialog, closeDialog, addTask, updateTask } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { triggerRefresh, images } = useFileStore();

  const [width, setWidth] = useState<number | null>(1920);
  const [height, setHeight] = useState<number | null>(null);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);

  const files = Array.from(selectedPaths);
  const isOpen = activeDialog === "resize";

  // 获取第一个选中的图片用于预览
  const firstSelectedImage = useMemo(() => {
    return images.find(img => selectedPaths.has(img.path));
  }, [images, selectedPaths]);

  // 计算预览尺寸
  const previewDims = useMemo(() => {
    if (!firstSelectedImage) return null;
    
    const originalW = firstSelectedImage.width;
    const originalH = firstSelectedImage.height;
    
    let newW = width;
    let newH = height;

    if (maintainAspect) {
      const aspect = originalW / originalH;
      
      if (width && !height) {
        // 只设置了宽度
        newH = Math.round(width / aspect);
      } else if (!width && height) {
        // 只设置了高度
        newW = Math.round(height * aspect);
      } else if (width && height) {
        // 都设置了，采取 "Fit Inside" 逻辑
        const scaleW = width / originalW;
        const scaleH = height / originalH;
        const scale = Math.min(scaleW, scaleH);
        newW = Math.round(originalW * scale);
        newH = Math.round(originalH * scale);
      }
    }

    if (newW === null) newW = originalW;
    if (newH === null) newH = originalH;

    return { w: newW, h: newH };
  }, [width, height, maintainAspect, firstSelectedImage]);

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

    setLocalIsProcessing(true);
    const taskId = addTask("resize", files.length);

    try {
      updateTask(taskId, { status: "running", message: "开始调整尺寸..." });
      const count = await batchResize(
        taskId,
        files,
        width,
        height,
        maintainAspect,
        outputDir || undefined
      );

      updateTask(taskId, { 
        status: "completed", 
        progress: files.length, 
        message: `成功调整 ${count} 个文件尺寸`,
        endTime: Date.now()
      });

      triggerRefresh();
      clearSelection();
      closeDialog();
    } catch (err) {
      console.error("调整尺寸失败:", err);
      updateTask(taskId, { 
        status: "failed", 
        error: String(err),
        message: "调整尺寸失败",
        endTime: Date.now()
      });
    } finally {
      setLocalIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl flex flex-col animate-slide-in overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">批量调整尺寸</h2>
              <p className="text-[10px] text-[var(--text-muted)]">
                已选中 {files.length} 个文件
              </p>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="w-8 h-8 rounded-lg hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Presets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">1</span>
                 <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">常用预设</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((preset) => {
                  const isActive = width === preset.width && height === preset.height;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left group",
                        isActive
                          ? "bg-[var(--accent)]/10 border-[var(--accent)]/50 shadow-sm"
                          : "bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                        isActive ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--text-muted)] opacity-50"
                      )}>
                        {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <span className={cn(
                            "text-sm font-bold block",
                            isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                          )}>
                            {preset.label}
                          </span>
                         <span className="text-[10px] text-[var(--text-muted)]">{preset.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Custom Settings */}
            <div className="space-y-6">
              
              {/* Custom Size */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">2</span>
                   <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">自定义规格</h3>
                 </div>

                 <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] p-5 space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase px-1">宽度 (px)</label>
                        <input
                          type="number"
                          value={width ?? ""}
                          onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="自动"
                          className="w-full h-9 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase px-1">高度 (px)</label>
                        <input
                          type="number"
                          value={height ?? ""}
                          onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="自动"
                          className="w-full h-9 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
                          disabled={maintainAspect}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setMaintainAspect(!maintainAspect)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all",
                        maintainAspect
                          ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {maintainAspect ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
                        <span className="text-xs font-medium">{maintainAspect ? "保持纵横比" : "自由调整 (可能变形)"}</span>
                      </div>
                    </button>
                 </div>
              </div>

              {/* Preview Block */}
              {firstSelectedImage && previewDims && (
                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">3</span>
                     <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">效果预览</h3>
                   </div>
                   
                   <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] p-4 flex items-center gap-4">
                     <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">原始</span>
                        <div className="text-xs font-mono text-[var(--text-secondary)]">{firstSelectedImage.width} x {firstSelectedImage.height}</div>
                     </div>
                     
                     <div className="flex-1 flex justify-center">
                        <ArrowRight className="w-4 h-4 text-[var(--accent)]" />
                     </div>
                     
                     <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">新尺寸</span>
                        <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                          {previewDims.w} x {previewDims.h}
                        </div>
                     </div>
                   </div>
                   <div className="text-[10px] text-[var(--text-muted)] text-center px-2">
                     * 预览基于选中的第一张图片: <span className="text-[var(--text-secondary)] truncate max-w-[150px] inline-block align-bottom">{firstSelectedImage.name}</span>
                   </div>
                </div>
              )}

              {/* Output Path */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">4</span>
                   <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">输出路径</h3>
                 </div>

                 <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] p-1 flex items-center gap-2 pr-2">
                   <div className="flex-1 px-3 py-2 text-xs font-mono text-[var(--text-muted)] truncate" title={outputDir || "源文件目录"}>
                     {outputDir || "默认保存至原路径"}
                   </div>
                   <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleSelectOutputDir}
                      className="h-7 text-[10px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
                   >
                     <FolderOpen className="w-3 h-3 mr-1.5" />
                     更改
                   </Button>
                 </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={closeDialog}
            className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={localIsProcessing || files.length === 0 || (width === null && height === null)}
            className="px-6 shadow-lg shadow-indigo-500/20"
          >
            {localIsProcessing ? "处理中..." : "开始调整"}
            {!localIsProcessing && <ArrowRight className="w-3.5 h-3.5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
