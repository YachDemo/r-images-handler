import { useState } from "react";
import { X, Layers, Settings2, FolderOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { batchConvert, selectFolder } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

const FORMATS = [
  { value: "jpg", label: "JPEG", description: "通用格式，适合照片，支持压缩" },
  { value: "png", label: "PNG", description: "无损压缩，支持透明通道" },
  { value: "webp", label: "WebP", description: "现代格式，体积更小，画质优" },
  { value: "bmp", label: "BMP", description: "无压缩位图，文件较大" },
];

export function BatchConvertDialog() {
  const { activeDialog, closeDialog, addTask, updateTask } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { triggerRefresh } = useFileStore();

  const [targetFormat, setTargetFormat] = useState("jpg");
  const [quality, setQuality] = useState(85);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);

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

    setLocalIsProcessing(true);
    const taskId = addTask("convert", files.length);

    try {
      updateTask(taskId, { status: "running", message: "开始转换格式..." });
      const count = await batchConvert(taskId, files, targetFormat, quality, outputDir || undefined);

      updateTask(taskId, { 
        status: "completed", 
        progress: files.length, 
        message: `成功转换 ${count} 个文件`,
        endTime: Date.now()
      });

      triggerRefresh();
      clearSelection();
      closeDialog();
    } catch (err) {
      console.error("转换失败:", err);
      updateTask(taskId, { 
        status: "failed", 
        error: String(err),
        message: "转换失败",
        endTime: Date.now()
      });
    } finally {
      setLocalIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl flex flex-col animate-slide-in overflow-hidden max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">批量格式转换</h2>
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
            
            {/* Left Column: Format Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">1</span>
                 <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">选择目标格式</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {FORMATS.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setTargetFormat(format.value)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left group",
                      targetFormat === format.value
                        ? "bg-[var(--accent)]/10 border-[var(--accent)]/50 shadow-sm"
                        : "bg-[var(--bg-app)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                      targetFormat === format.value ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--text-muted)] opacity-50"
                    )}>
                      {targetFormat === format.value && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                         <span className={cn(
                            "text-sm font-bold",
                            targetFormat === format.value ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                          )}>
                            {format.label}
                          </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {format.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Settings & Path */}
            <div className="space-y-6">
              
              {/* Quality Settings */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">2</span>
                   <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">输出质量</h3>
                 </div>

                 <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] p-5">
                   {(targetFormat === "jpg" || targetFormat === "webp") ? (
                     <div className="space-y-5">
                       <div className="flex items-end justify-between">
                          <span className="text-xs text-[var(--text-muted)] font-medium">压缩率</span>
                          <span className="text-xl font-mono font-bold text-[var(--accent)]">{quality}%</span>
                       </div>
                       <Slider value={quality} onChange={setQuality} min={1} max={100} />
                       <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium">
                         <span>较小体积</span>
                         <span>最佳画质</span>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-4 opacity-50 gap-2">
                       <Settings2 className="w-8 h-8 text-[var(--text-muted)]" />
                       <span className="text-xs text-[var(--text-muted)] font-medium">当前格式无需配置质量</span>
                     </div>
                   )}
                 </div>
              </div>

              {/* Output Path */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">3</span>
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
            disabled={localIsProcessing || files.length === 0}
            className="px-6 shadow-lg shadow-indigo-500/20"
          >
            {localIsProcessing ? "处理中..." : "开始转换"}
            {!localIsProcessing && <ArrowRight className="w-3.5 h-3.5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
