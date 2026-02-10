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
    <div className={`h-screen w-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden p-4 gap-4 ${(isResizingSidebar || isResizingProperties) ? "select-none" : ""}`}>
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
