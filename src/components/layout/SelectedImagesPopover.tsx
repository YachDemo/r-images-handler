import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2 } from "lucide-react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useUIStore } from "../../stores/uiStore";
import { convertFileSrc } from "@tauri-apps/api/core";

interface SelectedImagesPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function SelectedImagesPopover({ isOpen, onClose, triggerRef }: SelectedImagesPopoverProps) {
  const { selectedPaths, toggleSelect } = useSelectionStore();
  const { openQuickPreview } = useUIStore();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = Math.min(450, 60 + (Math.ceil(selectedPaths.size / 3) * 100));
      
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      let top = rect.top - 16 - popoverHeight;

      const padding = 16;
      if (left < padding) left = padding;
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }

      setPosition({ top, left });
    }
  }, [isOpen, triggerRef, selectedPaths.size]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", onClose);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", onClose);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const files = Array.from(selectedPaths);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed w-[320px] bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col overflow-hidden text-white"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* 小三角 */}
      <div 
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-r border-b border-white/10 rotate-45"
        style={{
            left: triggerRef.current ? (triggerRef.current.getBoundingClientRect().left + triggerRef.current.getBoundingClientRect().width/2) - position.left : '50%'
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/5 relative z-10">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">已选图片预览 ({files.length})</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid Content */}
      <div className="p-4 max-h-[350px] overflow-y-auto custom-scrollbar relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {files.map((path) => {
            const name = path.split(/[/\\]/).pop();
            return (
              <div
                key={path}
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-[var(--accent)]/50 transition-all shadow-inner bg-black/20"
                onClick={() => openQuickPreview(path)}
                title="点击预览大图"
              >
                <img
                  src={convertFileSrc(path)}
                  alt={name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                  loading="lazy"
                />
                
                {/* 右上角删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(path);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-[-4px] group-hover:translate-y-0 z-20"
                  title="移出选择"
                >
                  <X className="w-3.5 h-3.5 stroke-[3px]" />
                </button>
                
                {/* 悬浮预览图标 */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[1px]">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform border border-white/20">
                      <Maximize2 className="w-4 h-4" />
                   </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-all duration-300">
                   <p className="text-[8px] font-bold text-white/80 truncate text-center uppercase tracking-tighter">{name}</p>
                </div>
              </div>
            );
          })}
        </div>
        {files.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <X className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    没有选择任何图片
                </p>
            </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-black/20 border-t border-white/5 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center relative z-10">
         点击查看大图预览
      </div>
    </div>,
    document.body
  );
}
