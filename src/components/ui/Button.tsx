import { cn } from "../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "primary" | "tonal";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({
  children,
  variant = "default",
  size = "default",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-semibold transition-all duration-100 select-none active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-app)]",
        "disabled:pointer-events-none disabled:opacity-40",
        {
          // Primary: Accent color background
          "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-md shadow-[var(--accent)]/10": variant === "primary",

          // Default: Surface background, subtle border
          "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)] shadow-sm": variant === "default",
          
          // Ghost: Transparent, hover effect
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]": variant === "ghost",
          
          // Outline: Transparent with border
          "bg-transparent border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)]": variant === "outline",

          // Tonal: Subtle background (e.g. for active states)
          "bg-[var(--bg-surface-active)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]": variant === "tonal",
        },
        {
          "h-9 px-6 text-xs tracking-tight": size === "default",
          "h-7 px-5 text-[10px] tracking-widest uppercase": size === "sm",
          "h-10 px-8 text-sm tracking-tight": size === "lg",
          "h-8 w-8 p-0": size === "icon",
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}