import { useMemo } from "react";
import type { HistogramData } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

interface HistogramProps {
  data: HistogramData | null;
  className?: string;
  height?: number;
}

export function Histogram({ data, className, height = 120 }: HistogramProps) {
  const points = useMemo(() => {
    if (!data) return null;

    const max = Math.max(
      ...data.r,
      ...data.g,
      ...data.b,
      ...data.l
    );

    if (max === 0) return null;

    const getPoints = (channel: number[]) => {
      return channel
        .map((val, i) => {
          const x = (i / 255) * 100;
          const y = 100 - (val / max) * 100;
          return `${x},${y}`;
        })
        .join(" ");
    };

    return {
      r: `0,100 ${getPoints(data.r)} 100,100`,
      g: `0,100 ${getPoints(data.g)} 100,100`,
      b: `0,100 ${getPoints(data.b)} 100,100`,
      l: `0,100 ${getPoints(data.l)} 100,100`,
    };
  }, [data]);

  if (!data || !points) {
    return (
      <div 
        style={{ height }} 
        className={cn("w-full bg-black/20 rounded-xl border border-white/5 flex items-center justify-center", className)}
      >
        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest animate-pulse">
          加载直方图中...
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div 
        className="relative w-full bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-inner group"
        style={{ height }}
      >
        {/* 背景网格 */}
        <div className="absolute inset-0 flex justify-between px-px opacity-20 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-px h-full bg-zinc-500" />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col justify-between py-px opacity-20 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-px w-full bg-zinc-500" />
          ))}
        </div>

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          {/* RGB 通道 */}
          <polyline
            points={points.r}
            fill="rgba(239, 68, 68, 0.15)"
            stroke="rgba(239, 68, 68, 0.8)"
            strokeWidth="0.5"
            className="mix-blend-screen"
          />
          <polyline
            points={points.g}
            fill="rgba(34, 197, 94, 0.15)"
            stroke="rgba(34, 197, 94, 0.8)"
            strokeWidth="0.5"
            className="mix-blend-screen"
          />
          <polyline
            points={points.b}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="0.5"
            className="mix-blend-screen"
          />
          {/* 亮度通道 */}
          <polyline
            points={points.l}
            fill="rgba(255, 255, 255, 0.1)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="1"
            className="mix-blend-overlay"
          />
        </svg>

        {/* 覆盖层：光影效果 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* 通道标注 */}
      <div className="flex justify-between px-1">
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">R</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">G</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">B</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">LUM</span>
          </div>
        </div>
        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest opacity-50">
          256 Levels
        </div>
      </div>
    </div>
  );
}
