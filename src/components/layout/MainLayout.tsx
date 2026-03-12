import { useState } from "react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { SelectionToolbar } from "./SelectionToolbar";
import { useUIStore } from "../../stores/uiStore";
import { ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "../../utils/cn";

export function MainLayout() {
  const { sidebarWidth, propertiesPanelWidth, isPropertiesOpen, toggleProperties } = useUIStore();

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden p-4 gap-4">
      {/* 顶部工具栏 */}
      <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] shrink-0 shadow-md bg-[var(--bg-surface)]">
        <Toolbar />
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden gap-4 relative">
        {/* 左侧文件夹树 */}
        <div 
          className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] flex flex-col shrink-0 bg-[var(--bg-surface)] shadow-md transition-all duration-300" 
          style={{ width: sidebarWidth }}
        >
          <div className="flex-1 overflow-hidden p-[var(--panel-padding)]">
            <Sidebar width={sidebarWidth - (16 * 2)} />
          </div>
        </div>

        {/* 中央内容区 */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-surface)] rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] shadow-md relative">
            <MainContent />
            
            {/* 切换属性面板的浮动按钮 (当面板关闭时显示在中央区右侧) */}
            {!isPropertiesOpen && (
              <button
                onClick={toggleProperties}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-20 bg-white/5 hover:bg-white/10 border-l border-y border-white/10 rounded-l-xl flex items-center justify-center text-white/20 hover:text-[var(--accent)] transition-all z-30 group"
                title="展开属性面板"
              >
                <ChevronLeft className="w-4 h-4 group-hover:scale-125 transition-transform" />
              </button>
            )}
        </div>

        {/* 右侧属性面板 */}
        <div 
          className={cn(
            "rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] flex flex-col shrink-0 bg-[var(--bg-surface)] shadow-md transition-all duration-500 relative group/panel",
            isPropertiesOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
          )} 
          style={{ 
            width: isPropertiesOpen ? propertiesPanelWidth : 0,
            marginRight: isPropertiesOpen ? 0 : -16 // 抵消 gap
          }}
        >
          {/* 面板内部的收起按钮 (位于左边缘) */}
          {isPropertiesOpen && (
            <button
              onClick={toggleProperties}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-black/20 hover:bg-black/40 border-r border-y border-white/5 rounded-r-lg flex items-center justify-center text-white/10 hover:text-white transition-all z-30 opacity-0 group-hover/panel:opacity-100"
              title="收起面板"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          
          <div className="flex-1 overflow-hidden min-w-[300px]">
            <PropertiesPanel />
          </div>
        </div>

        {/* 浮动批量操作栏 */}
        <SelectionToolbar />
      </div>

      {/* 底部状态栏 */}
      <div className="rounded-[var(--radius)] overflow-hidden border border-[var(--border-subtle)] shrink-0 bg-[var(--bg-surface)] shadow-sm">
        <StatusBar />
      </div>
    </div>
  );
}
