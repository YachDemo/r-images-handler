import { useState, useRef, useEffect } from "react";
import { X, Loader2, LayoutGrid, Settings2, Type, Trash2, Baseline, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { createCollage, selectSavePath, type TextOverlay } from "../../services/tauriApi";
import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "../../utils/cn";

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

const TEXT_PRESETS: { name: string; style: Partial<TextOverlay> }[] = [
  { 
    name: "默认白色", 
    style: { color: "#ffffff", size: 120, opacity: 1, strokeColor: null, shadowColor: null, bgColor: null } 
  },
  { 
    name: "清新留白", 
    style: { color: "#333333", size: 100, opacity: 0.9, bgColor: "#ffffff", bgPadding: 20 } 
  },
  { 
    name: "复古电影", 
    style: { color: "#f1c40f", size: 140, opacity: 1, shadowColor: "#000000", shadowOffset: [4, 4], strokeColor: "#000000", strokeWidth: 2 } 
  },
  { 
    name: "霓虹之夜", 
    style: { color: "#00f2ff", size: 160, opacity: 1, shadowColor: "#00f2ff", shadowOffset: [0, 0], strokeColor: "#ffffff", strokeWidth: 1 } 
  },
  { 
    name: "标签样式", 
    style: { color: "#ffffff", size: 80, opacity: 1, bgColor: "#e74c3c", bgPadding: 15 } 
  },
  { 
    name: "通透描边", 
    style: { color: "transparent", size: 200, opacity: 0.8, strokeColor: "#ffffff", strokeWidth: 3 } 
  },
];

function getTemplatesForCount(count: number): CollageTemplate[] {
  const templates: CollageTemplate[] = [];

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
      { id: "top-hero-3", name: "上主图", aspectRatio: 3 / 4, getLayout: () => [{ x: 0, y: 0, width: 100, height: 60 }, { x: 0, y: 60, width: 50, height: 40 }, { x: 50, y: 60, width: 50, height: 40 }] }
    );
  }
  if (count === 4) {
    templates.push(
      { id: "grid-2x2", name: "经典四格", aspectRatio: 1, getLayout: () => [{ x: 0, y: 0, width: 50, height: 50 }, { x: 50, y: 0, width: 50, height: 50 }, { x: 0, y: 50, width: 50, height: 50 }, { x: 50, y: 50, width: 50, height: 50 }] },
      { id: "t-shape-4", name: "T型布局", aspectRatio: 4 / 3, getLayout: () => [{ x: 0, y: 0, width: 100, height: 55 }, { x: 0, y: 55, width: 33.33, height: 45 }, { x: 33.33, y: 55, width: 33.33, height: 45 }, { x: 66.66, y: 55, width: 33.34, height: 45 }] }
    );
  }
  
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

const BG_COLORS = [
  { label: "深色", value: "#1e1e1e" },
  { label: "黑色", value: "#000000" },
  { label: "白色", value: "#ffffff" },
  { label: "米色", value: "#f5f5dc" },
  { label: "粉色", value: "#fce4ec" },
  { label: "蓝色", value: "#e3f2fd" },
];

export function CollageDialog() {
  const { activeDialog, closeDialog } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  
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
  
  const [isProcessing, setProcessing] = useState(false);
  const [customWidth, setCustomWidth] = useState(2400);
  const [customHeight, setCustomHeight] = useState(2400);

  // Text Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"layout" | "text">("layout");

  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  type ResizeType = "move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | "text-move";
  const dragRef = useRef<{ startX: number; startY: number; startLayout?: ImageLayout; startText?: TextOverlay; type: ResizeType } | null>(null);

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

  const currentAspectRatio = selectedTemplate?.id === "free" 
    ? customWidth / customHeight 
    : selectedTemplate?.aspectRatio || 1;

  const handleMouseDown = (e: React.MouseEvent, index: number, type: ResizeType) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === "text-move") {
      setSelectedTextIndex(index);
      setSelectedIndex(null);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startText: { ...textOverlays[index] },
        type,
      };
      return;
    }

    if (selectedTemplate?.id !== "free") return;
    setSelectedIndex(index);
    setSelectedTextIndex(null);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLayout: { ...layouts[index] },
      type,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    if (dragRef.current.type === "text-move" && selectedTextIndex !== null) {
      const newTexts = [...textOverlays];
      const start = dragRef.current.startText!;
      newTexts[selectedTextIndex] = {
        ...start,
        x: Math.max(0, Math.min(100, start.x + deltaX)),
        y: Math.max(0, Math.min(100, start.y + deltaY)),
      };
      setTextOverlays(newTexts);
      return;
    }

    if (selectedTemplate?.id !== "free" || selectedIndex === null) return;

    const newLayouts = [...layouts];
    const start = dragRef.current.startLayout!;
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

  const addTextOverlay = (preset?: Partial<TextOverlay>) => {
    const newText: TextOverlay = {
      text: "输入文字",
      x: 50,
      y: 50,
      size: 120,
      color: "#ffffff",
      opacity: 1,
      fontPath: null,
      ...preset
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedTextIndex(textOverlays.length);
    setRightPanelTab("text");
  };

  const updateTextOverlay = (index: number, updates: Partial<TextOverlay>) => {
    const newTexts = [...textOverlays];
    newTexts[index] = { ...newTexts[index], ...updates };
    setTextOverlays(newTexts);
  };

  const removeTextOverlay = (index: number) => {
    const newTexts = textOverlays.filter((_, i) => i !== index);
    setTextOverlays(newTexts);
    setSelectedTextIndex(null);
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

      await createCollage(files, layoutData, textOverlays, canvasWidth, canvasHeight, spacing, borderRadius, canvasBorderRadius, bgColor, outputPath);
      clearSelection();
      closeDialog();
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
      <div className="w-[1000px] max-h-[90vh] bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-strong)] shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">艺术智能拼图</h2>
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
                aspectRatio: currentAspectRatio,
                width: currentAspectRatio >= 1 ? "100%" : "auto",
                height: currentAspectRatio < 1 ? "100%" : "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: selectedTemplate.id === "free" 
                  ? `${(canvasBorderRadius / Math.min(customWidth, customHeight)) * 100}%`
                  : `${(canvasBorderRadius / 2400) * 100}%`
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => {
                setSelectedIndex(null);
                setSelectedTextIndex(null);
              }}
            >
              {/* 图片层 */}
              {layouts.map((layout, index) => (
                <div
                  key={`img-${index}`}
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
                    setSelectedTextIndex(null);
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
                  </div>
                </div>
              ))}

              {/* 文字层 (带效果预览) */}
              {textOverlays.map((text, index) => {
                const isSelected = selectedTextIndex === index;
                const displaySize = (text.size / 2400) * (containerRef.current?.clientWidth || 800);
                
                // 模拟阴影和描边预览
                const shadowStyle = text.shadowColor && text.shadowOffset 
                    ? `${text.shadowOffset[0] * (displaySize/text.size)}px ${text.shadowOffset[1] * (displaySize/text.size)}px 2px ${text.shadowColor}` 
                    : "none";
                
                const strokeStyle = text.strokeColor && text.strokeWidth
                    ? `0 0 0 ${text.strokeWidth * (displaySize/text.size)}px ${text.strokeColor}`
                    : "none";

                return (
                  <div
                    key={`text-${index}`}
                    className={cn(
                      "absolute cursor-move select-none transition-all",
                      isSelected ? "ring-2 ring-[var(--accent)] ring-offset-4 ring-offset-transparent z-20" : "z-15"
                    )}
                    style={{
                      left: `${text.x}%`,
                      top: `${text.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: text.color,
                      fontSize: displaySize,
                      opacity: text.opacity,
                      whiteSpace: 'nowrap',
                      textShadow: shadowStyle,
                      boxShadow: strokeStyle, // 简单模拟描边
                      backgroundColor: text.bgColor || 'transparent',
                      padding: text.bgPadding ? `${text.bgPadding * (displaySize/text.size)}px` : 0,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, index, "text-move")}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTextIndex(index);
                      setSelectedIndex(null);
                      setRightPanelTab("text");
                    }}
                  >
                    {text.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：设置面板 */}
          <div className="w-[300px] flex flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
            {/* Tabs */}
            <div className="flex p-2 gap-1 border-b border-[var(--border-subtle)]">
              <button
                onClick={() => setRightPanelTab("layout")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  rightPanelTab === "layout" ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm border border-[var(--border-subtle)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                布局
              </button>
              <button
                onClick={() => setRightPanelTab("text")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  rightPanelTab === "text" ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm border border-[var(--border-subtle)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <Type className="w-3.5 h-3.5" />
                艺术字
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {rightPanelTab === "layout" ? (
                <>
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

                  <Slider label="画面间距" value={spacing} onChange={setSpacing} min={0} max={60} />
                  <div className="space-y-4">
                    <Slider label="图片圆角" value={borderRadius} onChange={setBorderRadius} min={0} max={100} />
                    <Slider label="画布圆角" value={canvasBorderRadius} onChange={setCanvasBorderRadius} min={0} max={300} />
                  </div>

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
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* 预设模版选择 */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">预设模版</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEXT_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          onClick={() => addTextOverlay(preset.style)}
                          className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all text-[10px] font-bold flex flex-col items-center gap-1"
                        >
                          <span style={{ 
                            color: preset.style.color === 'transparent' ? '#fff' : preset.style.color,
                            textShadow: preset.style.shadowColor ? `1px 1px ${preset.style.shadowColor}` : 'none',
                            background: preset.style.bgColor || 'transparent',
                            padding: preset.style.bgPadding ? '2px 4px' : 0,
                            border: preset.style.strokeColor ? `1px solid ${preset.style.strokeColor}` : 'none'
                          }}>Aa</span>
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTextIndex !== null ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--text-primary)]">
                          <Baseline className="w-4 h-4 text-[var(--accent)]" />
                          <span className="text-xs font-bold uppercase tracking-wider">细节调整</span>
                        </div>
                        <button
                          onClick={() => removeTextOverlay(selectedTextIndex)}
                          className="p-1.5 rounded-md text-[var(--status-error)] hover:bg-[var(--status-error)]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">内容</label>
                        <textarea
                          value={textOverlays[selectedTextIndex].text}
                          onChange={(e) => updateTextOverlay(selectedTextIndex, { text: e.target.value })}
                          className="w-full h-16 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                        />
                      </div>

                      <Slider label="字体大小" value={textOverlays[selectedTextIndex].size} onChange={(v) => updateTextOverlay(selectedTextIndex, { size: v })} min={20} max={500} />
                      
                      <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
                        {/* 颜色选择器 */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">主体颜色</span>
                            <input type="color" value={textOverlays[selectedTextIndex].color === 'transparent' ? '#ffffff' : textOverlays[selectedTextIndex].color} onChange={(e) => updateTextOverlay(selectedTextIndex, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">描边颜色</span>
                            <div className="flex gap-2">
                                <button onClick={() => updateTextOverlay(selectedTextIndex, { strokeColor: null })} className="text-[9px] text-rose-500 font-bold">禁用</button>
                                <input type="color" value={textOverlays[selectedTextIndex].strokeColor || "#ffffff"} onChange={(e) => updateTextOverlay(selectedTextIndex, { strokeColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">背景块</span>
                            <div className="flex gap-2">
                                <button onClick={() => updateTextOverlay(selectedTextIndex, { bgColor: null })} className="text-[9px] text-rose-500 font-bold">禁用</button>
                                <input type="color" value={textOverlays[selectedTextIndex].bgColor || "#000000"} onChange={(e) => updateTextOverlay(selectedTextIndex, { bgColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
                            </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {error && (
                    <div className="mt-4 text-[var(--status-error)] text-[11px] font-medium bg-[var(--status-error)]/10 p-2.5 rounded border border-[var(--status-error)]/20">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex items-center justify-end gap-4 bg-[var(--bg-app)]/50">
          <Button variant="ghost" onClick={closeDialog} disabled={isProcessing} className="px-6">取消</Button>
          <Button variant="primary" onClick={handleExecute} disabled={isProcessing || files.length < 2} className="min-w-[160px] shadow-lg shadow-[var(--accent)]/20">
            {isProcessing ? <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>生成中...</span></div> : "导出拼图"}
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
        <div key={index} className="absolute bg-white/20 rounded-[1px]" style={{ left: `${layout.x}%`, top: `${layout.y}%`, width: `${layout.width}%`, height: `${layout.height}%`, padding: 0.5 }}>
          <div className="w-full h-full bg-white/10 rounded-[1px]" />
        </div>
      ))}
    </div>
  );
}
