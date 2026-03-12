import { useState } from "react";
import { Filter, X, RotateCcw, Calendar, Maximize, FileType } from "lucide-react";
import { useFileStore, type FilterOptions } from "../../stores/fileStore";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function FilterPopover({ isOpen, onClose, triggerRef }: FilterPopoverProps) {
  const { filterOptions, setFilterOptions, resetFilters } = useFileStore();
  const [localOptions, setLocalOptions] = useState<FilterOptions>(filterOptions);

  if (!isOpen) return null;

  const handleApply = () => {
    setFilterOptions(localOptions);
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setLocalOptions(useFileStore.getState().filterOptions);
    onClose();
  };

  const formats = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "svg"];

  const toggleFormat = (format: string) => {
    const newFormats = localOptions.formats.includes(format)
      ? localOptions.formats.filter((f) => f !== format)
      : [...localOptions.formats, format];
    setLocalOptions({ ...localOptions, formats: newFormats });
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[60]" 
        onClick={onClose} 
      />
      <div
        className="fixed z-[70] mt-2 w-80 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in duration-200"
        style={{
          top: triggerRef.current?.getBoundingClientRect().bottom ?? 0,
          right: window.innerWidth - (triggerRef.current?.getBoundingClientRect().right ?? 0),
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">筛选器</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 格式筛选 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
              <FileType className="w-3 h-3" />
              <span>图片格式</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => toggleFormat(fmt)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border",
                    localOptions.formats.includes(fmt)
                      ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]"
                      : "bg-white/5 border-transparent text-[var(--text-muted)] hover:bg-white/10"
                  )}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* 尺寸筛选 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
              <Maximize className="w-3 h-3" />
              <span>尺寸范围 (PX)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">最小宽度</span>
                <input
                  type="number"
                  value={localOptions.minWidth || ""}
                  onChange={(e) => setLocalOptions({ ...localOptions, minWidth: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full h-8 px-3 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">最小高度</span>
                <input
                  type="number"
                  value={localOptions.minHeight || ""}
                  onChange={(e) => setLocalOptions({ ...localOptions, minHeight: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full h-8 px-3 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
            </div>
          </div>

          {/* 日期筛选 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
              <Calendar className="w-3 h-3" />
              <span>修改日期</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">开始日期</span>
                <input
                  type="date"
                  value={localOptions.startDate || ""}
                  onChange={(e) => setLocalOptions({ ...localOptions, startDate: e.target.value })}
                  className="w-full h-8 px-2 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-[10px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">结束日期</span>
                <input
                  type="date"
                  value={localOptions.endDate || ""}
                  onChange={(e) => setLocalOptions({ ...localOptions, endDate: e.target.value })}
                  className="w-full h-8 px-2 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-[10px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
            </div>
          </div>

          {/* 文件大小筛选 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
              <Maximize className="w-3 h-3 rotate-45" />
              <span>文件大小 (MB)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">最小大小</span>
                <input
                  type="number"
                  value={localOptions.minSize ? localOptions.minSize / (1024 * 1024) : ""}
                  onChange={(e) => setLocalOptions({ ...localOptions, minSize: Number(e.target.value) * 1024 * 1024 })}
                  placeholder="0"
                  className="w-full h-8 px-3 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">最大大小</span>
                <input
                  type="number"
                  value={localOptions.maxSize ? localOptions.maxSize / (1024 * 1024) : ""}
                  onChange={(e) => setLocalOptions({ ...localOptions, maxSize: Number(e.target.value) * 1024 * 1024 })}
                  placeholder="∞"
                  className="w-full h-8 px-3 rounded-lg bg-black/20 border border-[var(--border-subtle)] text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-8 pt-5 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="flex-1 h-9 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <RotateCcw className="w-3 h-3" />
            重置
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="flex-[1.5] h-9 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
          >
            应用筛选
          </Button>
        </div>
      </div>
    </>
  );
}
