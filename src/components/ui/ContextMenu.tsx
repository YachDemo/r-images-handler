import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  triggerRef: React.RefObject<HTMLElement | null>;
  onOpen?: () => void;
  onClose?: () => void;
}

export function ContextMenu({ items, triggerRef, onOpen, onClose }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 计算位置，防止溢出屏幕
      let x = e.clientX;
      let y = e.clientY;

      setIsOpen(true);
      setPosition({ x, y });
      onOpen?.();
    };

    trigger.addEventListener("contextmenu", handleContextMenu);

    return () => {
      trigger.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [triggerRef, onOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
      onClose?.();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 调整位置防止溢出 (简单的视口检查)
  // 实际应用中可能需要更复杂的逻辑，这里先做基础偏移检查
  // 注意：由于是 Portal，position 是相对于 viewport 的
  
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-[var(--md-sys-color-surface-container-high)] rounded-lg shadow-xl border border-[var(--md-sys-color-outline-variant)]/50 py-1.5 animate-fade-in origin-top-left"
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="my-1.5 h-px bg-[var(--md-sys-color-outline-variant)]/50" />;
        }

        return (
          <button
            key={index}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
              item.disabled
                ? "opacity-50 cursor-not-allowed"
                : item.danger
                ? "text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error)]/10"
                : "text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-on-surface)]/10"
            )}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick();
                setIsOpen(false);
                onClose?.();
              }
            }}
            disabled={item.disabled}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && <span className="text-xs opacity-50 ml-4 font-mono">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>,
    document.body
  );
}
