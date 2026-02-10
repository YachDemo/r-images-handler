import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClass} text-[var(--accent)] animate-spin`} />
      {text && <p className="text-sm text-[var(--text-muted)]">{text}</p>}
    </div>
  );
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-[var(--bg-app)]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-md overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
      <div className="aspect-square skeleton opacity-50" />
      <div className="p-2 space-y-2">
        <div className="h-3 skeleton rounded w-3/4 opacity-40" />
        <div className="h-2 skeleton rounded w-1/2 opacity-30" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
