import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useSelectionStore } from "../../stores/selectionStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "../../utils/cn";

interface SelectedImagesPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export function SelectedImagesPopover({ isOpen, onClose, triggerRef }: SelectedImagesPopoverProps) {
  const { selectedPaths, toggleSelect } = useSelectionStore();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      
      // Center horizontally
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      const top = rect.bottom + 12; // Gap

      // Boundary checks
      const padding = 10;
      if (left < padding) left = padding;
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }

      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside popover or trigger
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
      // Also close on window resize/scroll to avoid detached popover
      window.addEventListener("resize", onClose);
      window.addEventListener("scroll", onClose, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const files = Array.from(selectedPaths);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed w-[320px] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-strong)] shadow-2xl z-[9999] animate-fade-in flex flex-col overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur z-10">
        <span className="text-xs font-bold text-[var(--text-primary)]">已选内容 ({files.length})</span>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid Content */}
      <div className="p-3 max-h-[320px] overflow-y-auto custom-scrollbar bg-[var(--bg-app)]/50">
        <div className="grid grid-cols-3 gap-2">
          {files.map((path) => {
            const name = path.split(/[/\\]/).pop();
            return (
              <div
                key={path}
                className="group relative aspect-square rounded-lg overflow-hidden border border-[var(--border-subtle)] cursor-pointer hover:border-red-500/50 transition-all"
                onClick={() => toggleSelect(path)}
                title={path}
              >
                <img
                  src={convertFileSrc(path)}
                  alt={name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                  loading="lazy"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <X className="w-5 h-5 text-white drop-shadow-md" />
                </div>
                
                {/* Name Tag (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-1.5 py-1 translate-y-full group-hover:translate-y-0 transition-transform">
                   <p className="text-[9px] text-white/90 truncate text-center">{name}</p>
                </div>
              </div>
            );
          })}
        </div>
        {files.length === 0 && (
            <div className="py-8 text-center text-[10px] text-[var(--text-muted)]">
                未选择任何图片
            </div>
        )}
      </div>
      
      {/* Footer Hint */}
      <div className="px-3 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] text-[9px] text-[var(--text-muted)] text-center">
         点击图片可取消选择
      </div>
    </div>,
    document.body
  );
}
