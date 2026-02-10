import { useState, useRef, useEffect } from "react";
import { X, Grid3X3, Loader2, Move, LayoutGrid } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { createCollage, selectSavePath } from "../../services/tauriApi";
import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "../../utils/cn";

// 根据图片数量获取可用模板
function getTemplatesForCount(count: number): CollageTemplate[] {
  const templates: CollageTemplate[] = [];

  if (count === 2) {
    templates.push(
      {
        id: "horizontal-2",
        name: "左右并排",
        aspectRatio: 16 / 9,
        getLayout: () => [
          { x: 0, y: 0, width: 50, height: 100 },
          { x: 50, y: 0, width: 50, height: 100 },
        ],
      },
      {
        id: "vertical-2",
        name: "上下叠放",
        aspectRatio: 9 / 16,
        getLayout: () => [
          { x: 0, y: 0, width: 100, height: 50 },
          { x: 0, y: 50, width: 100, height: 50 },
        ],
      },
      {
        id: "big-small-2",
        name: "主次分明",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 65, height: 100 },
          { x: 65, y: 0, width: 35, height: 100 },
        ],
      },
      {
        id: "diagonal-2",
        name: "对角布局",
        aspectRatio: 1,
        getLayout: () => [
          { x: 0, y: 0, width: 60, height: 60 },
          { x: 40, y: 40, width: 60, height: 60 },
        ],
      }
    );
  }

  if (count === 3) {
    templates.push(
      {
        id: "hero-left-3",
        name: "左主图",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 60, height: 100 },
          { x: 60, y: 0, width: 40, height: 50 },
          { x: 60, y: 50, width: 40, height: 50 },
        ],
      },
      {
        id: "hero-right-3",
        name: "右主图",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 40, height: 50 },
          { x: 0, y: 50, width: 40, height: 50 },
          { x: 40, y: 0, width: 60, height: 100 },
        ],
      },
      {
        id: "top-hero-3",
        name: "上主图",
        aspectRatio: 3 / 4,
        getLayout: () => [
          { x: 0, y: 0, width: 100, height: 60 },
          { x: 0, y: 60, width: 50, height: 40 },
          { x: 50, y: 60, width: 50, height: 40 },
        ],
      },
      {
        id: "horizontal-3",
        name: "横向三分",
        aspectRatio: 21 / 9,
        getLayout: () => [
          { x: 0, y: 0, width: 33.33, height: 100 },
          { x: 33.33, y: 0, width: 33.33, height: 100 },
          { x: 66.66, y: 0, width: 33.34, height: 100 },
        ],
      },
      {
        id: "vertical-3",
        name: "纵向三分",
        aspectRatio: 9 / 16,
        getLayout: () => [
          { x: 0, y: 0, width: 100, height: 33.33 },
          { x: 0, y: 33.33, width: 100, height: 33.33 },
          { x: 0, y: 66.66, width: 100, height: 33.34 },
        ],
      }
    );
  }

  if (count === 4) {
    templates.push(
      {
        id: "grid-2x2",
        name: "经典四格",
        aspectRatio: 1,
        getLayout: () => [
          { x: 0, y: 0, width: 50, height: 50 },
          { x: 50, y: 0, width: 50, height: 50 },
          { x: 0, y: 50, width: 50, height: 50 },
          { x: 50, y: 50, width: 50, height: 50 },
        ],
      },
      {
        id: "hero-side-4",
        name: "主图侧栏",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 60, height: 100 },
          { x: 60, y: 0, width: 40, height: 33.33 },
          { x: 60, y: 33.33, width: 40, height: 33.33 },
          { x: 60, y: 66.66, width: 40, height: 33.34 },
        ],
      },
      {
        id: "t-shape-4",
        name: "T型布局",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 100, height: 55 },
          { x: 0, y: 55, width: 33.33, height: 45 },
          { x: 33.33, y: 55, width: 33.33, height: 45 },
          { x: 66.66, y: 55, width: 33.34, height: 45 },
        ],
      },
      {
        id: "horizontal-4",
        name: "横向四分",
        aspectRatio: 3,
        getLayout: () => [
          { x: 0, y: 0, width: 25, height: 100 },
          { x: 25, y: 0, width: 25, height: 100 },
          { x: 50, y: 0, width: 25, height: 100 },
          { x: 75, y: 0, width: 25, height: 100 },
        ],
      }
    );
  }

  if (count === 5) {
    templates.push(
      {
        id: "mosaic-5",
        name: "马赛克",
        aspectRatio: 1,
        getLayout: () => [
          { x: 0, y: 0, width: 60, height: 60 },
          { x: 60, y: 0, width: 40, height: 30 },
          { x: 60, y: 30, width: 40, height: 30 },
          { x: 0, y: 60, width: 30, height: 40 },
          { x: 30, y: 60, width: 70, height: 40 },
        ],
      },
      {
        id: "pinterest-5",
        name: "瀑布流",
        aspectRatio: 3 / 4,
        getLayout: () => [
          { x: 0, y: 0, width: 50, height: 40 },
          { x: 50, y: 0, width: 50, height: 55 },
          { x: 0, y: 40, width: 50, height: 60 },
          { x: 50, y: 55, width: 50, height: 45 },
          { x: 0, y: 100, width: 0, height: 0 }, // 不显示
        ].slice(0, 4).concat([{ x: 0, y: 0, width: 100, height: 100 }]).slice(0, 5),
      },
      {
        id: "cross-5",
        name: "十字布局",
        aspectRatio: 1,
        getLayout: () => [
          { x: 25, y: 0, width: 50, height: 33.33 },
          { x: 0, y: 33.33, width: 33.33, height: 33.33 },
          { x: 33.33, y: 33.33, width: 33.33, height: 33.33 },
          { x: 66.66, y: 33.33, width: 33.34, height: 33.33 },
          { x: 25, y: 66.66, width: 50, height: 33.34 },
        ],
      }
    );
  }

  if (count === 6) {
    templates.push(
      {
        id: "grid-2x3",
        name: "2×3网格",
        aspectRatio: 3 / 4,
        getLayout: () => [
          { x: 0, y: 0, width: 50, height: 33.33 },
          { x: 50, y: 0, width: 50, height: 33.33 },
          { x: 0, y: 33.33, width: 50, height: 33.33 },
          { x: 50, y: 33.33, width: 50, height: 33.33 },
          { x: 0, y: 66.66, width: 50, height: 33.34 },
          { x: 50, y: 66.66, width: 50, height: 33.34 },
        ],
      },
      {
        id: "grid-3x2",
        name: "3×2网格",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 33.33, height: 50 },
          { x: 33.33, y: 0, width: 33.33, height: 50 },
          { x: 66.66, y: 0, width: 33.34, height: 50 },
          { x: 0, y: 50, width: 33.33, height: 50 },
          { x: 33.33, y: 50, width: 33.33, height: 50 },
          { x: 66.66, y: 50, width: 33.34, height: 50 },
        ],
      },
      {
        id: "hero-grid-6",
        name: "主图+五格",
        aspectRatio: 4 / 3,
        getLayout: () => [
          { x: 0, y: 0, width: 50, height: 66.66 },
          { x: 50, y: 0, width: 25, height: 33.33 },
          { x: 75, y: 0, width: 25, height: 33.33 },
          { x: 50, y: 33.33, width: 25, height: 33.33 },
          { x: 75, y: 33.33, width: 25, height: 33.33 },
          { x: 0, y: 66.66, width: 100, height: 33.34 },
        ],
      }
    );
  }

  if (count >= 7 && count <= 9) {
    templates.push(
      {
        id: "grid-3x3",
        name: "九宫格",
        aspectRatio: 1,
        getLayout: () => {
          const layouts: ImageLayout[] = [];
          for (let i = 0; i < 9; i++) {
            layouts.push({
              x: (i % 3) * 33.33,
              y: Math.floor(i / 3) * 33.33,
              width: 33.33,
              height: 33.33,
            });
          }
          return layouts.slice(0, count);
        },
      }
    );
  }

  // 通用自由布局 - 始终可用
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
  const { images } = useFileStore();

  const selectedImages = images.filter((img) => selectedPaths.has(img.path));
  const files = selectedImages.map((img) => img.path);
  const isOpen = activeDialog === "collage";

  // 根据图片数量获取可用模板
  const templates = getTemplatesForCount(files.length);

  const [selectedTemplate, setSelectedTemplate] = useState<CollageTemplate | null>(null);
  const [spacing, setSpacing] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [bgColor, setBgColor] = useState("#1e1e1e");
  const [layouts, setLayouts] = useState<ImageLayout[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLayout: ImageLayout; type: "move" | "resize" } | null>(null);

  // 自动选择第一个模板
  useEffect(() => {
    if (isOpen && templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, [isOpen, files.length]);

  // 当模板变化时更新布局
  useEffect(() => {
    if (selectedTemplate) {
      const newLayouts = selectedTemplate.getLayout();
      setLayouts(newLayouts.slice(0, files.length));
      setSelectedIndex(null);
    }
  }, [selectedTemplate, files.length]);

  const handleMouseDown = (e: React.MouseEvent, index: number, type: "move" | "resize") => {
    if (selectedTemplate?.id !== "free") return; // 只有自由布局可拖拽
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
    const layout = { ...dragRef.current.startLayout };

    if (dragRef.current.type === "move") {
      layout.x = Math.max(0, Math.min(100 - layout.width, layout.x + deltaX));
      layout.y = Math.max(0, Math.min(100 - layout.height, layout.y + deltaY));
    } else {
      layout.width = Math.max(10, Math.min(100 - layout.x, layout.width + deltaX));
      layout.height = Math.max(10, Math.min(100 - layout.y, layout.height + deltaY));
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
      const canvasSize = 2400;
      const aspectRatio = selectedTemplate.aspectRatio;
      const canvasWidth = aspectRatio >= 1 ? canvasSize : Math.round(canvasSize * aspectRatio);
      const canvasHeight = aspectRatio >= 1 ? Math.round(canvasSize / aspectRatio) : canvasSize;

      const layoutData: [number, number, number, number][] = layouts.map((l) => [l.x, l.y, l.width, l.height]);

      await createCollage(files, layoutData, canvasWidth, canvasHeight, spacing, borderRadius, bgColor, outputPath);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[900px] max-h-[90vh] bg-[var(--md-sys-color-surface-container)] rounded-[20px] border border-[var(--md-sys-color-outline-variant)]/50 shadow-2xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--md-sys-color-outline-variant)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-[var(--md-sys-color-on-primary-container)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">创建拼图</h2>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{files.length} 张图片</p>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="p-2 rounded-full hover:bg-[var(--md-sys-color-on-surface)]/10 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：模板选择 */}
          <div className="w-[220px] p-3 border-r border-[var(--md-sys-color-outline-variant)]/50 overflow-y-auto bg-[var(--md-sys-color-surface-container-low)]">
            <p className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-3 px-2">选择模板</p>
            <div className="space-y-2">
              {templates.map((template) => {
                const isSelected = selectedTemplate.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      "w-full p-3 rounded-xl text-left transition-all ripple",
                      isSelected
                        ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shadow-sm"
                        : "hover:bg-[var(--md-sys-color-on-surface)]/5 text-[var(--md-sys-color-on-surface)]"
                    )}
                  >
                    {/* 模板预览缩略图 */}
                    <div
                      className={cn(
                        "w-full aspect-square rounded-lg mb-2 overflow-hidden p-0.5 transition-colors",
                         isSelected ? "bg-[var(--md-sys-color-on-secondary-container)]/10" : "bg-[var(--md-sys-color-surface-container-highest)]"
                      )}
                      style={{ aspectRatio: template.aspectRatio }}
                    >
                      <TemplatePreview template={template} count={files.length} />
                    </div>
                    <p className="text-sm font-medium truncate">{template.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 中间：画布预览 */}
          <div className="flex-1 p-8 flex items-center justify-center bg-[var(--md-sys-color-surface)]">
            <div
              ref={containerRef}
              className="relative rounded-lg overflow-hidden shadow-xl ring-1 ring-black/10"
              style={{
                backgroundColor: bgColor,
                aspectRatio: selectedTemplate.aspectRatio,
                width: selectedTemplate.aspectRatio >= 1 ? "100%" : "auto",
                height: selectedTemplate.aspectRatio < 1 ? "100%" : "auto",
                maxWidth: "100%",
                maxHeight: "100%",
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
                    "absolute overflow-hidden transition-shadow",
                    selectedIndex === index ? "ring-2 ring-[var(--md-sys-color-primary)] z-10" : ""
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
                      "relative w-full h-full overflow-hidden group bg-[var(--md-sys-color-surface-container)]",
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
                    {/* 自由布局时显示控制手柄 */}
                    {selectedTemplate.id === "free" && (
                      <>
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, index, "move")}
                        >
                          <Move className="w-6 h-6 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
                        </div>
                        <div
                          className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--md-sys-color-primary)] cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-tl"
                          onMouseDown={(e) => handleMouseDown(e, index, "resize")}
                        />
                      </>
                    )}
                    {/* 序号 */}
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs font-medium flex items-center justify-center backdrop-blur-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：设置面板 */}
          <div className="w-[240px] p-5 space-y-6 border-l border-[var(--md-sys-color-outline-variant)]/50 overflow-y-auto bg-[var(--md-sys-color-surface-container-low)]">
            {/* 间距 */}
            <div>
              <Slider label="图片间距" value={spacing} onChange={setSpacing} min={0} max={60} />
            </div>

            {/* 圆角 */}
            <div>
              <Slider label="图片圆角" value={borderRadius} onChange={setBorderRadius} min={0} max={100} />
            </div>

            {/* 背景颜色 */}
            <div>
              <label className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-3">背景</label>
              <div className="grid grid-cols-4 gap-2">
                {BG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setBgColor(color.value)}
                    className={cn(
                      "w-full aspect-square rounded-full border border-[var(--md-sys-color-outline-variant)] transition-all",
                      bgColor === color.value ? "ring-2 ring-[var(--md-sys-color-primary)] ring-offset-2 ring-offset-[var(--md-sys-color-surface)]" : ""
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer opacity-0 absolute inset-0"
                    />
                    <div className="w-full h-8 rounded border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center text-xs text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface)]">
                        自定义颜色
                    </div>
                </div>
              </div>
            </div>

            {/* 当前模板信息 */}
            <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30">
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedTemplate.name}</span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                比例: {selectedTemplate.aspectRatio >= 1
                  ? `${Math.round(selectedTemplate.aspectRatio * 3)}:3`
                  : `3:${Math.round(3 / selectedTemplate.aspectRatio)}`}
              </p>
              {selectedTemplate.id === "free" && (
                <p className="text-xs text-[var(--md-sys-color-primary)] mt-2">拖拽图片调整位置和大小</p>
              )}
            </div>

            {error && <p className="text-[var(--md-sys-color-error)] text-xs">{error}</p>}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container)]">
          <Button variant="ghost" onClick={closeDialog} disabled={isProcessing}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isProcessing || files.length < 2}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              "保存拼图"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 模板预览组件
function TemplatePreview({ template, count }: { template: CollageTemplate; count: number }) {
  const layouts = template.getLayout().slice(0, count);

  return (
    <div className="relative w-full h-full">
      {layouts.map((layout, index) => (
        <div
          key={index}
          className="absolute bg-[var(--md-sys-color-surface-container-high)] rounded-[2px]"
          style={{
            left: `${layout.x}%`,
            top: `${layout.y}%`,
            width: `${layout.width}%`,
            height: `${layout.height}%`,
            padding: 1,
          }}
        >
          <div className="w-full h-full bg-[var(--md-sys-color-on-surface-variant)]/30 rounded-[1px]" />
        </div>
      ))}
    </div>
  );
}
