import { useState, useRef, useEffect } from "react";
import { X, Grid3X3, Loader2, Move, LayoutGrid, Settings2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { createCollage, selectSavePath } from "../../services/tauriApi";
import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "../../utils/cn";

// ... (Template definitions remain same, I will copy them back)
// Since I must provide full content, I'll reuse the previous template logic block.

function getTemplatesForCount(count: number): CollageTemplate[] {
  const templates: CollageTemplate[] = [];

  // ... (Template logic omitted for brevity in thought process, but included in actual call) ...
  // Actually I need to include it.
  
  if (count === 2) {
    templates.push(
      { id: "horizontal-2", name: "左右并排", aspectRatio: 16 / 9, getLayout: () => [{ x: 0, y: 0, width: 50, height: 100 }, { x: 50, y: 0, width: 50, height: 100 }] },
      { id: "vertical-2", name: "上下叠放", aspectRatio: 9 / 16, getLayout: () => [{ x: 0, y: 0, width: 100, height: 50 }, { x: 0, y: 50, width: 100, height: 50 }] },
      { id: "big-small-2", name: "主次分明", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 65, height: 100 }, { x: 65, y: 0, width: 35, height: 100 }] },
      { id: "diagonal-2", name: "对角布局", aspectRatio: 1, getLayout: () => [{ x: 0, y: 0, width: 60, height: 60 }, { x: 40, y: 40, width: 60, height: 60 }] }
    );
  }
  if (count === 3) {
    templates.push(
      { id: "hero-left-3", name: "左主图", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 60, height: 100 }, { x: 60, y: 0, width: 40, height: 50 }, { x: 60, y: 50, width: 40, height: 50 }] },
      { id: "hero-right-3", name: "右主图", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 40, height: 50 }, { x: 0, y: 50, width: 40, height: 50 }, { x: 40, y: 0, width: 60, height: 100 }] },
      { id: "top-hero-3", name: "上主图", aspectRatio: 3 / 4, getLayout: () => [{ x: 0, y: 0, width: 100, height: 60 }, { x: 0, y: 60, width: 50, height: 40 }, { x: 50, y: 60, width: 50, height: 40 }] },
      { id: "horizontal-3", name: "横向三分", aspectRatio: 21 / 9, getLayout: () => [{ x: 0, y: 0, width: 33.33, height: 100 }, { x: 33.33, y: 0, width: 33.33, height: 100 }, { x: 66.66, y: 0, width: 33.34, height: 100 }] },
      { id: "vertical-3", name: "纵向三分", aspectRatio: 9 / 16, getLayout: () => [{ x: 0, y: 0, width: 100, height: 33.33 }, { x: 0, y: 33.33, width: 100, height: 33.33 }, { x: 0, y: 66.66, width: 100, height: 33.34 }] }
    );
  }
  if (count === 4) {
    templates.push(
      { id: "grid-2x2", name: "经典四格", aspectRatio: 1, getLayout: () => [{ x: 0, y: 0, width: 50, height: 50 }, { x: 50, y: 0, width: 50, height: 50 }, { x: 0, y: 50, width: 50, height: 50 }, { x: 50, y: 50, width: 50, height: 50 }] },
      { id: "hero-side-4", name: "主图侧栏", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 60, height: 100 }, { x: 60, y: 0, width: 40, height: 33.33 }, { x: 60, y: 33.33, width: 40, height: 33.33 }, { x: 60, y: 66.66, width: 40, height: 33.34 }] },
      { id: "t-shape-4", name: "T型布局", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 100, height: 55 }, { x: 0, y: 55, width: 33.33, height: 45 }, { x: 33.33, y: 55, width: 33.33, height: 45 }, { x: 66.66, y: 55, width: 33.34, height: 45 }] },
      { id: "horizontal-4", name: "横向四分", aspectRatio: 3, getLayout: () => [{ x: 0, y: 0, width: 25, height: 100 }, { x: 25, y: 0, width: 25, height: 100 }, { x: 50, y: 0, width: 25, height: 100 }, { x: 75, y: 0, width: 25, height: 100 }] }
    );
  }
  if (count === 5) {
    templates.push(
      { id: "mosaic-5", name: "马赛克", aspectRatio: 1, getLayout: () => [{ x: 0, y: 0, width: 60, height: 60 }, { x: 60, y: 0, width: 40, height: 30 }, { x: 60, y: 30, width: 40, height: 30 }, { x: 0, y: 60, width: 30, height: 40 }, { x: 30, y: 60, width: 70, height: 40 }] },
      { id: "pinterest-5", name: "瀑布流", aspectRatio: 3 / 4, getLayout: () => [{ x: 0, y: 0, width: 50, height: 40 }, { x: 50, y: 0, width: 50, height: 55 }, { x: 0, y: 40, width: 50, height: 60 }, { x: 50, y: 55, width: 50, height: 45 }, { x: 0, y: 100, width: 0, height: 0 }].slice(0, 4).concat([{ x: 0, y: 0, width: 100, height: 100 }]).slice(0, 5) },
      { id: "cross-5", name: "十字布局", aspectRatio: 1, getLayout: () => [{ x: 25, y: 0, width: 50, height: 33.33 }, { x: 0, y: 33.33, width: 33.33, height: 33.33 }, { x: 33.33, y: 33.33, width: 33.33, height: 33.33 }, { x: 66.66, y: 33.33, width: 33.34, height: 33.33 }, { x: 25, y: 66.66, width: 50, height: 33.34 }] }
    );
  }
  if (count === 6) {
    templates.push(
      { id: "grid-2x3", name: "2×3网格", aspectRatio: 3 / 4, getLayout: () => [{ x: 0, y: 0, width: 50, height: 33.33 }, { x: 50, y: 0, width: 50, height: 33.33 }, { x: 0, y: 33.33, width: 50, height: 33.33 }, { x: 50, y: 33.33, width: 50, height: 33.33 }, { x: 0, y: 66.66, width: 50, height: 33.34 }, { x: 50, y: 66.66, width: 50, height: 33.34 }] },
      { id: "grid-3x2", name: "3×2网格", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 33.33, height: 50 }, { x: 33.33, y: 0, width: 33.33, height: 50 }, { x: 66.66, y: 0, width: 33.34, height: 50 }, { x: 0, y: 50, width: 33.33, height: 50 }, { x: 33.33, y: 50, width: 33.33, height: 50 }, { x: 66.66, y: 50, width: 33.34, height: 50 }] },
      { id: "hero-grid-6", name: "主图+五格", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 50, height: 66.66 }, { x: 50, y: 0, width: 25, height: 33.33 }, { x: 75, y: 0, width: 25, height: 33.33 }, { x: 50, y: 33.33, width: 25, height: 33.33 }, { x: 75, y: 33.33, width: 25, height: 33.33 }, { x: 0, y: 66.66, width: 100, height: 33.34 }] }
    );
  }
  if (count >= 7 && count <= 9) {
    templates.push({ id: "grid-3x3", name: "九宫格", aspectRatio: 1, getLayout: () => Array.from({ length: count }, (_, i) => ({ x: (i % 3) * 33.33, y: Math.floor(i / 3) * 33.33, width: 33.33, height: 33.33 })) });
  }

  // 通用自由布局
  templates.push({
    id: "free",
    name: "自由布局",
    aspectRatio: 1,
    getLayout: () => {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellW = 100 / cols;
      const cellH = 100 / rows;
      return Array.from({ length: count }, (_, i) => ({
        x: (i % cols) * cellW,
        y: Math.floor(i / cols) * cellH,
        width: cellW,
        height: cellH,
      }));
    },
  });

  return templates;
}

interface ImageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CollageTemplate {
  id: string;
  name: string;
  aspectRatio: number;
  getLayout: () => ImageLayout[];
}

const BG_COLORS = [
  { label: "深色", value: "#1e1e1e" },
  { label: "黑色", value: "#000000" },
  { label: "白色", value: "#ffffff" },
  { label: "米色", value: "#f5f5dc" },
  { label: "粉色", value: "#fce4ec" },
  { label: "蓝色", value: "#e3f2fd" },
];

export function CollageDialog() {
  const { activeDialog, closeDialog, isProcessing, setProcessing } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  
  // FIX: Use selectedPaths directly instead of filtering 'images' store
  const files = Array.from(selectedPaths);
  const isOpen = activeDialog === "collage";

  const templates = getTemplatesForCount(files.length);

  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate | null>(null);
  const [spacing, setSpacing] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [canvasBorderRadius, setCanvasBorderRadius] = useState(0);
  const [bgColor, setBgColor] = useState("#1e1e1e");
  const [layouts, setLayouts] = useState<ImageLayout[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Custom Canvas Size
  const [customWidth, setCustomWidth] = useState(2400);
  const [customHeight, setCustomHeight] = useState(2400);

  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  type ResizeType = "move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se";
  const dragRef = useRef<{ startX: number; startY: number; startLayout: ImageLayout; type: ResizeType } | null>(null);

  useEffect(() => {
    if (isOpen && templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, [isOpen, files.length]);

  useEffect(() => {
    if (selectedTemplate) {
      const newLayouts = selectedTemplate.getLayout();
      setLayouts(newLayouts.slice(0, files.length));
      setSelectedIndex(null);
    }
  }, [selectedTemplate, files.length]);

  // Derived aspect ratio for display
  const currentAspectRatio = selectedTemplate?.id === "free" 
    ? customWidth / customHeight 
    : selectedTemplate?.aspectRatio || 1;

  const handleMouseDown = (e: React.MouseEvent, index: number, type: ResizeType) => {
    if (selectedTemplate?.id !== "free") return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex(index);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLayout: { ...layouts[index] },
      type,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || selectedIndex === null || !containerRef.current) return;
    if (selectedTemplate?.id !== "free") return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    const newLayouts = [...layouts];
    const start = dragRef.current.startLayout;
    const layout = { ...newLayouts[selectedIndex] };
    const { type } = dragRef.current;

    const minSize = 5;

    if (type === "move") {
      layout.x = Math.max(0, Math.min(100 - layout.width, start.x + deltaX));
      layout.y = Math.max(0, Math.min(100 - layout.height, start.y + deltaY));
    } else {
      if (type.includes("e")) {
        layout.width = Math.max(minSize, Math.min(100 - layout.x, start.width + deltaX));
      }
      if (type.includes("s")) {
        layout.height = Math.max(minSize, Math.min(100 - layout.y, start.height + deltaY));
      }
      if (type.includes("w")) {
        const maxWidth = start.x + start.width - minSize;
        const newX = Math.max(0, Math.min(maxWidth, start.x + deltaX));
        layout.x = newX;
        layout.width = start.width + (start.x - newX);
      }
      if (type.includes("n")) {
        const maxHeight = start.y + start.height - minSize;
        const newY = Math.max(0, Math.min(maxHeight, start.y + deltaY));
        layout.y = newY;
        layout.height = start.height + (start.y - newY);
      }
    }

    newLayouts[selectedIndex] = layout;
    setLayouts(newLayouts);
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const handleExecute = async () => {
    if (files.length < 2 || !selectedTemplate) return;

    const outputPath = await selectSavePath("collage.png");
    if (!outputPath) return;

    setProcessing(true);
    setError(null);

    try {
      let canvasWidth = 2400;
      let canvasHeight = 2400;

      if (selectedTemplate.id === "free") {
        canvasWidth = customWidth;
        canvasHeight = customHeight;
      } else {
        const baseSize = 2400;
        const ar = selectedTemplate.aspectRatio;
        canvasWidth = ar >= 1 ? baseSize : Math.round(baseSize * ar);
        canvasHeight = ar >= 1 ? Math.round(baseSize / ar) : baseSize;
      }

      const layoutData: [number, number, number, number][] = layouts.map((l) => [l.x, l.y, l.width, l.height]);

      await createCollage(files, layoutData, canvasWidth, canvasHeight, spacing, borderRadius, canvasBorderRadius, bgColor, outputPath);
      clearSelection();
      closeDialog();
      // eslint-disable-next-line no-alert
      alert(`拼图已保存到: ${outputPath}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !selectedTemplate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-[940px] max-h-[90vh] bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-strong)] shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
              <Grid3X3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">智能拼图</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface-active)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">
                  已选择 {files.length} 张图片
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="w-10 h-10 rounded-full hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-transparent hover:border-[var(--border-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：模板选择 */}
          <div className="w-[220px] p-4 border-r border-[var(--border-subtle)] overflow-y-auto bg-[var(--bg-app)]/50">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-4 px-1">布局方案</p>
            <div className="space-y-2.5">
              {templates.map((template) => {
                const isSelected = selectedTemplate.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      "w-full p-2.5 rounded-xl text-left transition-all border group",
                      isSelected
                        ? "bg-[var(--accent-surface)] border-[var(--accent)]/40 shadow-sm"
                        : "bg-transparent border-transparent hover:bg-[var(--bg-surface-hover)]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full aspect-square rounded-lg mb-2.5 overflow-hidden p-1 transition-colors",
                         isSelected ? "bg-white/5" : "bg-black/20"
                      )}
                      style={{ aspectRatio: template.aspectRatio }}
                    >
                      <TemplatePreview template={template} count={files.length} />
                    </div>
                    <p className={cn(
                      "text-xs font-bold truncate",
                      isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>{template.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 中间：画布预览 */}
          <div className="flex-1 p-10 flex items-center justify-center bg-[var(--bg-app)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <div
              ref={containerRef}
              className="relative overflow-hidden shadow-2xl ring-1 ring-white/5"
              style={{
                backgroundColor: bgColor,
                aspectRatio: currentAspectRatio, // Use dynamic aspect ratio
                width: currentAspectRatio >= 1 ? "100%" : "auto",
                height: currentAspectRatio < 1 ? "100%" : "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: selectedTemplate.id === "free" 
                  ? `${(canvasBorderRadius / Math.min(customWidth, customHeight)) * 100}%`
                  : `${(canvasBorderRadius / 2400) * 100}%` // Approx for fixed templates
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => setSelectedIndex(null)}
            >
              {layouts.map((layout, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute overflow-hidden",
                    selectedIndex === index ? "z-10" : ""
                  )}
                  style={{
                    left: `${layout.x}%`,
                    top: `${layout.y}%`,
                    width: `${layout.width}%`,
                    height: `${layout.height}%`,
                    padding: spacing / 2,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                  }}
                >
                  <div
                    className={cn(
                      "relative w-full h-full overflow-hidden group bg-[var(--bg-surface-hover)] transition-all border-2",
                      selectedIndex === index ? "border-[var(--accent)] shadow-lg" : "border-transparent",
                      selectedTemplate.id === "free" ? "cursor-move" : ""
                    )}
                    style={{ borderRadius: borderRadius }}
                  >
                    <img
                      src={convertFileSrc(files[index])}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {selectedTemplate.id === "free" && selectedIndex === index && (
                      <>
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, index, "move")}
                        >
                          <Move className="w-5 h-5 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                        </div>
                        <div className="absolute top-0 left-0 w-3 h-3 bg-white border border-[var(--accent)] cursor-nw-resize z-20 shadow-md" onMouseDown={(e) => handleMouseDown(e, index, "resize-nw")} />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-white border border-[var(--accent)] cursor-ne-resize z-20 shadow-md" onMouseDown={(e) => handleMouseDown(e, index, "resize-ne")} />
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-white border border-[var(--accent)] cursor-sw-resize z-20 shadow-md" onMouseDown={(e) => handleMouseDown(e, index, "resize-sw")} />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--accent)] border border-white cursor-se-resize z-20 shadow-md" onMouseDown={(e) => handleMouseDown(e, index, "resize-se")} />
                      </>
                    )}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/40 text-white text-[9px] font-bold backdrop-blur-md border border-white/10">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：设置面板 */}
          <div className="w-[260px] p-6 space-y-7 border-l border-[var(--border-subtle)] overflow-y-auto bg-[var(--bg-app)]/50">
            
            {/* Canvas Size Settings (Only for Free Layout) */}
            {selectedTemplate.id === "free" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">画布尺寸 (px)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold">宽度</label>
                    <input 
                      type="number" 
                      value={customWidth} 
                      onChange={(e) => setCustomWidth(Math.max(100, parseInt(e.target.value) || 100))}
                      className="w-full h-8 px-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold">高度</label>
                    <input 
                      type="number" 
                      value={customHeight} 
                      onChange={(e) => setCustomHeight(Math.max(100, parseInt(e.target.value) || 100))}
                      className="w-full h-8 px-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 间距 */}
            <div>
              <Slider label="画面间距" value={spacing} onChange={setSpacing} min={0} max={60} />
            </div>

            {/* 圆角 */}
            <div>
              <div className="space-y-4">
                <Slider label="图片圆角" value={borderRadius} onChange={setBorderRadius} min={0} max={100} />
                <Slider label="画布圆角" value={canvasBorderRadius} onChange={setCanvasBorderRadius} min={0} max={300} />
              </div>
            </div>

            {/* 背景颜色 */}
            <div>
              <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 px-1">画布底色</label>
              <div className="grid grid-cols-5 gap-2 px-1">
                {BG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setBgColor(color.value)}
                    className={cn(
                      "w-full aspect-square rounded-lg border border-white/5 transition-all shadow-sm",
                      bgColor === color.value ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-app)]" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 px-1">
                <div className="relative flex-1">
                    <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                    />
                    <div className="w-full h-8 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                        自定义色值
                    </div>
                </div>
              </div>
            </div>

            {/* 当前模板信息 */}
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <LayoutGrid className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">{selectedTemplate.name}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-[var(--text-muted)]">
                <span>比例</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  {selectedTemplate.id === "free" 
                    ? `${customWidth} × ${customHeight}`
                    : selectedTemplate.aspectRatio >= 1
                      ? `${Math.round(selectedTemplate.aspectRatio * 3)}:3`
                      : `3:${Math.round(3 / selectedTemplate.aspectRatio)}`}
                </span>
              </div>
              {selectedTemplate.id === "free" && (
                <p className="text-[10px] text-[var(--accent)] mt-3 font-bold bg-[var(--accent-surface)] px-2 py-1 rounded">自由模式：支持拖拽交互</p>
              )}
            </div>

            {error && <div className="text-[var(--status-error)] text-[11px] font-medium bg-[var(--status-error)]/10 p-2.5 rounded border border-[var(--status-error)]/20">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex items-center justify-end gap-4 bg-[var(--bg-app)]/50">
          <Button 
            variant="ghost" 
            onClick={closeDialog} 
            disabled={isProcessing}
            className="px-6"
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isProcessing || files.length < 2}
            className="min-w-[160px] shadow-lg shadow-[var(--accent)]/20"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成中...</span>
              </div>
            ) : (
              "导出拼图"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TemplatePreview({ template, count }: { template: CollageTemplate; count: number }) {
  const layouts = template.getLayout().slice(0, count);

  return (
    <div className="relative w-full h-full opacity-60">
      {layouts.map((layout, index) => (
        <div
          key={index}
          className="absolute bg-white/20 rounded-[1px]"
          style={{
            left: `${layout.x}%`,
            top: `${layout.y}%`,
            width: `${layout.width}%`,
            height: `${layout.height}%`,
            padding: 0.5,
          }}
        >
          <div className="w-full h-full bg-white/10 rounded-[1px]" />
        </div>
      ))}
    </div>
  );
}
