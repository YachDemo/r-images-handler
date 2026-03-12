import { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Trash2,
  Clock,
  Layers
} from "lucide-react";
import { useBatchStore, type BatchTask } from "../../stores/batchStore";
import { cn } from "../../utils/cn";

export function TaskQueue() {
  const { tasks, removeTask, clearCompletedTasks } = useBatchStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) return null;

  const runningTasks = tasks.filter(t => t.status === "running" || t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "failed");

  return (
    <div className={cn(
      "fixed bottom-20 right-6 z-40 transition-all duration-300 ease-in-out",
      isExpanded ? "w-80" : "w-64"
    )}>
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden flex flex-col backdrop-blur-md bg-[var(--bg-surface)]/90">
        {/* Header */}
        <div 
          className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              runningTasks.length > 0 ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"
            )} />
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-primary)]">
              {runningTasks.length > 0 ? `正在处理 (${runningTasks.length})` : "任务已完成"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {completedTasks.length > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); clearCompletedTasks(); }}
                className="p-1 rounded hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="清除已完成"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />}
          </div>
        </div>

        {/* Task List */}
        {isExpanded && (
          <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onRemove={() => removeTask(task.id)} />
            ))}
          </div>
        )}

        {/* Compact Summary when collapsed */}
        {!isExpanded && runningTasks.length > 0 && (
          <div className="px-4 py-2 bg-[var(--accent)]/5 flex flex-col gap-1.5">
            {runningTasks.slice(0, 1).map(task => (
              <div key={task.id} className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-[var(--text-primary)] truncate max-w-[120px]">{task.message}</span>
                  <span className="text-[var(--accent)]">{Math.round((task.progress / task.total) * 100)}%</span>
                </div>
                <div className="h-1 bg-[var(--bg-surface-active)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${(task.progress / task.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task, onRemove }: { task: BatchTask, onRemove: () => void }) {
  const percentage = Math.round((task.progress / task.total) * 100);
  
  const getIcon = () => {
    switch (task.status) {
      case "running":
        return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const getTaskName = (type: string | null) => {
    switch (type) {
      case "rename": return "重命名";
      case "convert": return "格式转换";
      case "resize": return "调整尺寸";
      case "watermark": return "添加水印";
      case "collage": return "拼图";
      default: return "批量任务";
    }
  };

  return (
    <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2 group relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <div>
            <div className="text-[11px] font-bold text-[var(--text-primary)]">
              {getTaskName(task.type)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
              {task.message}
            </div>
          </div>
        </div>
        <button 
          onClick={onRemove}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {(task.status === "running" || task.status === "pending") && (
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-mono font-bold text-[var(--text-muted)]">
            <span>{task.progress} / {task.total}</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-surface-active)] rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {task.status === "failed" && task.error && (
        <div className="text-[9px] text-rose-500 font-medium px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
          {task.error}
        </div>
      )}

      {task.status === "completed" && (
        <div className="flex items-center justify-between text-[9px] font-medium text-[var(--text-muted)]">
          <span>完成时间: {new Date(task.endTime!).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
