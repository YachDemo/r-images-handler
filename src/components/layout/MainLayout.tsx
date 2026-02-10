import { useState, useCallback } from "react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";

export function MainLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [propertiesWidth, setPropertiesWidth] = useState(300);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingProperties, setIsResizingProperties] = useState(false);

  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    document.body.style.cursor = 'col-resize';

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 200), 500);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.body.style.cursor = 'default';
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [sidebarWidth]);

  const handlePropertiesMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingProperties(true);
    document.body.style.cursor = 'col-resize';

    const startX = e.clientX;
    const startWidth = propertiesWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 250), 500);
      setPropertiesWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingProperties(false);
      document.body.style.cursor = 'default';
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [propertiesWidth]);

  return (
    <div className={`h-screen w-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden p-2 gap-2 ${(isResizingSidebar || isResizingProperties) ? "select-none" : ""}`}>
      {/* 顶部工具栏 */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] shrink-0 shadow-sm bg-[var(--bg-surface)]">
        <Toolbar />
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden gap-2">
        {/* 左侧文件夹树 - 增加 px-1 确保内容不贴边 */}
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] flex flex-col shrink-0 shadow-sm bg-[var(--bg-surface)]" style={{ width: sidebarWidth }}>
          <div className="flex-1 overflow-hidden px-1">
            <Sidebar width={sidebarWidth - 8} />
          </div>
        </div>

        {/* 侧边栏调整手柄 */}
        <div
          className={`w-1 cursor-col-resize z-10 hover:bg-[var(--accent)]/30 transition-colors rounded-full ${isResizingSidebar ? 'bg-[var(--accent)]/50' : ''}`}
          onMouseDown={handleSidebarMouseDown}
        />

        {/* 中央内容区 */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-app)] rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-sm">
            <MainContent />
        </div>

        {/* 属性面板调整手柄 */}
        <div
          className={`w-1 cursor-col-resize z-10 hover:bg-[var(--accent)]/30 transition-colors rounded-full ${isResizingProperties ? 'bg-[var(--accent)]/50' : ''}`}
          onMouseDown={handlePropertiesMouseDown}
        />

        {/* 右侧属性面板 - 增加 px-1 确保内容不贴边 */}
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] flex flex-col shrink-0 shadow-sm bg-[var(--bg-surface)]" style={{ width: propertiesWidth }}>
          <div className="flex-1 overflow-hidden px-1">
            <PropertiesPanel width={propertiesWidth - 8} />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] shrink-0 shadow-sm bg-[var(--bg-surface)]">
        <StatusBar />
      </div>
    </div>
  );
}
