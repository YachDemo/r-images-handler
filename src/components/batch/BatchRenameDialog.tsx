import { useState, useEffect } from "react";
import { X, Edit3, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore, type ImageFileInfo } from "../../stores/fileStore";
import { batchRenamePreview, batchRenameExecute, listImages } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

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

      const allNewImages: ImageFileInfo[] = [];
      for (const path of rootPaths) {
        try {
          const imgs = await listImages(path);
          allNewImages.push(...imgs);
        } catch (e) {
          console.error(`刷新目录 ${path} 失败:`, e);
        }
      }
      
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
      // eslint-disable-next-line no-alert
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
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl flex flex-col animate-slide-in overflow-hidden max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">批量智能重命名</h2>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* Top Section: Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Left: Pattern Input */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                   <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">1</span>
                   <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">命名模式</h3>
                </div>
                
                <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] p-4 space-y-3">
                   <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] font-mono transition-all shadow-inner"
                    placeholder="{name}_{n}"
                  />
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 cursor-help" title="原始文件名">
                      <code className="text-[var(--accent)] font-bold">{'{name}'}</code>
                      <span>原名</span>
                    </div>
                    <div className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 cursor-help" title="自动递增序号">
                      <code className="text-[var(--accent)] font-bold">{'{n}'}</code>
                      <span>序号</span>
                    </div>
                  </div>
                </div>
             </div>

             {/* Right: Sequence Settings */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                   <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">2</span>
                   <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">序列设置</h3>
                </div>

                <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] p-4 h-[94px] flex flex-col justify-center">
                   <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-semibold text-[var(--text-primary)]">起始编号</label>
                        <p className="text-[10px] text-[var(--text-muted)]">序列开始的数字</p>
                      </div>
                      <input
                        type="number"
                        value={startNumber}
                        onChange={(e) => setStartNumber(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 h-9 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-all"
                        min={0}
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Bottom Section: Preview */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-1">
               <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-surface-active)] text-[10px] font-bold text-[var(--text-secondary)]">3</span>
               <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">实时预览</h3>
             </div>

             <div className="bg-[var(--bg-app)] rounded-xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[240px]">
                <div className="flex items-center px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                   <div className="flex-1">原始名称</div>
                   <div className="w-8"></div>
                   <div className="flex-1">新名称</div>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
                   {preview.length > 0 ? (
                     preview.map(([oldPath, newPath], index) => {
                       const oldName = oldPath.split("/").pop() || oldPath;
                       const newName = newPath.split("/").pop() || newPath;
                       return (
                         <div key={index} className="flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] group transition-colors">
                           <span className="flex-1 text-xs text-[var(--text-secondary)] truncate font-mono opacity-80" title={oldName}>{oldName}</span>
                           <ArrowRight className="w-3 h-3 text-[var(--text-muted)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--accent)] transition-all" />
                           <span className="flex-1 text-xs text-[var(--text-primary)] truncate font-mono font-medium text-[var(--accent)]" title={newName}>{newName}</span>
                         </div>
                       );
                     })
                   ) : (
                     <div className="py-8 text-center text-[var(--text-muted)] text-xs">
                       暂无预览内容
                     </div>
                   )}
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
            disabled={isProcessing || preview.length === 0}
            className="px-6 shadow-lg shadow-indigo-500/20"
          >
            {isProcessing ? "处理中..." : "确认重命名"}
            {!isProcessing && <CheckCircle2 className="w-3.5 h-3.5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}