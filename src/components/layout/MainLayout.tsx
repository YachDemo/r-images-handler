import { useState } from "react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";

export function MainLayout() {
  const [sidebarWidth] = useState(260);
  const [propertiesWidth] = useState(300);

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden p-4 gap-4">
      {/* 顶部工具栏 */}
      <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] shrink-0 shadow-md bg-[var(--bg-surface)]">
        <Toolbar />
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden gap-4">
        {/* 左侧文件夹树 */}
        <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] flex flex-col shrink-0 bg-[var(--bg-surface)] shadow-md" style={{ width: sidebarWidth }}>
          <div className="flex-1 overflow-hidden p-[var(--panel-padding)]">
            <Sidebar width={sidebarWidth - (16 * 2)} />
          </div>
        </div>

        {/* 中央内容区 */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-surface)] rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] shadow-md">
            <MainContent />
        </div>

        {/* 右侧属性面板 */}
        <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] flex flex-col shrink-0 bg-[var(--bg-surface)] shadow-md" style={{ width: propertiesWidth }}>
          <div className="flex-1 overflow-hidden">
            <PropertiesPanel />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] shrink-0 bg-[var(--bg-surface)] shadow-sm">
        <StatusBar />
      </div>
    </div>
  );
}
