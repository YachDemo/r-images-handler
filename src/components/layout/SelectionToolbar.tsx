import { useRef, useState } from "react";
import { Edit3, FileImage, Maximize2, Stamp, X, MousePointer2, ChevronUp } from "lucide-react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useBatchStore } from "../../stores/batchStore";
import { SelectedImagesPopover } from "./SelectedImagesPopover";
import { cn } from "../../utils/cn";

export function SelectionToolbar() {
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { openRenameDialog, openConvertDialog, openResizeDialog, openWatermarkDialog } = useBatchStore();
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const count = selectedPaths.size;
  if (count === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500 easing-out">
      {/* 流光背景效果 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-600 rounded-[22px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-[20px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        
        {/* 左侧：已选预览触发区 (原气泡功能) */}
        <div 
          ref={triggerRef}
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className={cn(
            "flex items-center gap-3 px-4 py-2 border-r border-white/10 mr-2 cursor-pointer rounded-xl transition-all hover:bg-white/5 group/trigger",
            isPreviewOpen && "bg-[var(--accent)]/10"
          )}
        >
          <div className={cn(
            "w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-transform group-hover/trigger:scale-110",
            isPreviewOpen && "scale-110"
          )}>
            <MousePointer2 className="w-4.5 h-4.5 fill-current" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest leading-none">已选择</span>
              <ChevronUp className={cn("w-3 h-3 text-[var(--accent)] transition-transform duration-300", isPreviewOpen ? "rotate-180" : "")} />
            </div>
            <span className="text-sm font-black text-white leading-none mt-1.5 tracking-tight">
              {count} <span className="text-[10px] text-zinc-500 font-bold ml-0.5">张图片</span>
            </span>
          </div>
        </div>

        {/* 预览弹窗 */}
        <SelectedImagesPopover 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          triggerRef={triggerRef}
        />

        {/* 中间：功能按钮区 */}
        <div className="flex items-center gap-1.5">
          <ActionButton 
            onClick={openRenameDialog} 
            icon={Edit3} 
            label="重命名" 
            variant="indigo"
          />
          <ActionButton 
            onClick={openConvertDialog} 
            icon={FileImage} 
            label="转换格式" 
            variant="green"
          />
          <ActionButton 
            onClick={openResizeDialog} 
            icon={Maximize2} 
            label="调整尺寸" 
            variant="blue"
          />
          <ActionButton 
            onClick={openWatermarkDialog} 
            icon={Stamp} 
            label="批量水印" 
            variant="orange"
          />
        </div>

        <div className="w-px h-8 bg-white/10 mx-3" />

        {/* 右侧：取消选择 */}
        <button 
          onClick={clearSelection}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all group/close"
          title="取消选择 (Esc)"
        >
          <X className="w-5 h-5 transition-transform group-hover/close:rotate-90" />
        </button>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  icon: any;
  label: string;
  variant: 'indigo' | 'green' | 'blue' | 'orange';
}

function ActionButton({ onClick, icon: Icon, label, variant }: ActionButtonProps) {
  const colors = {
    indigo: "hover:text-indigo-400 hover:bg-indigo-500/10",
    green: "hover:text-green-400 hover:bg-green-500/10",
    blue: "hover:text-blue-400 hover:bg-blue-500/10",
    orange: "hover:text-orange-400 hover:bg-orange-500/10",
  };

  const iconColors = {
    indigo: "text-indigo-400",
    green: "text-green-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center justify-center w-[72px] h-[56px] rounded-xl transition-all duration-300 relative",
        colors[variant]
      )}
    >
      <div className="relative">
        <Icon className={cn("w-5 h-5 mb-1.5 opacity-80 group-hover:opacity-100 transition-all transform group-hover:-translate-y-0.5", iconColors[variant])} />
        {/* 悬浮时的光点 */}
        <div className={cn("absolute -inset-2 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity", 
          variant === 'indigo' ? "bg-indigo-500" : 
          variant === 'green' ? "bg-green-500" : 
          variant === 'blue' ? "bg-blue-500" : "bg-orange-500"
        )} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 group-hover:tracking-normal transition-all text-white">
        {label}
      </span>
    </button>
  );
}
