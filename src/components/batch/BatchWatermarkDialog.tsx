import { useState, useEffect, useMemo, useRef } from "react";
import { X, Stamp, Loader2, Type, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { useBatchStore } from "../../stores/batchStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { applyWatermarkPreview, batchWatermark, listImages, getSystemFonts } from "../../services/tauriApi";
import { convertFileSrc } from "@tauri-apps/api/core";
import { selectFiles } from "../../services/tauriApi";
import { cn } from "../../utils/cn";

const FONTS = [
  { label: "系统默认 (PingFang)", value: "/System/Library/Fonts/PingFang.ttc" },
  { label: "Helvetica", value: "/System/Library/Fonts/Helvetica.ttc" },
  { label: "Arial", value: "/Library/Fonts/Arial.ttf" },
  { label: "Times New Roman", value: "/System/Library/Fonts/Supplemental/Times New Roman.ttf" },
  { label: "Georgia", value: "/Library/Fonts/Georgia.ttf" },
];

export function BatchWatermarkDialog() {
  const { activeDialog, closeDialog, isProcessing, setProcessing } = useBatchStore();
  const { selectedPaths, clearSelection } = useSelectionStore();
  const { rootPaths, setImages } = useFileStore();

  const files = useMemo(() => Array.from(selectedPaths), [selectedPaths]);
  const isOpen = activeDialog === "watermark";

  // Settings
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("Watermark");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(80);
  const [size, setSize] = useState(40);
  const [color, setColor] = useState("#ffffff");
  const [fontPath, setFontPath] = useState<string>(FONTS[0].value);
  const [angle, setAngle] = useState(0);
  const [isBold, setIsBold] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.2);
  
  // Font list
  const [fonts, setFonts] = useState(FONTS);

  // Layout
  const [tiled, setTiled] = useState(false);
  const [gap, setGap] = useState(1.0);
  
  // Position (0.0 - 1.0)
  const [posX, setPosX] = useState(0.5);
  const [posY, setPosY] = useState(0.5);

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Dragging
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize fonts
  useEffect(() => {
    getSystemFonts().then(sysFonts => {
      if (sysFonts && sysFonts.length > 0) {
        const sysFontOptions = sysFonts.map(f => ({ label: f, value: f }));
        // Remove duplicates and merge
        const uniqueFonts = [...FONTS, ...sysFontOptions].filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
        setFonts(uniqueFonts);
      }
    }).catch(console.error);
  }, []);

  // Initialize preview path
  useEffect(() => {
    if (isOpen && files.length > 0 && !previewPath) {
      setPreviewPath(files[0]);
    }
  }, [isOpen, files, previewPath]);

  // Debounced preview update
  useEffect(() => {
    if (!isOpen || !previewPath) return;

    const timer = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const src = await applyWatermarkPreview(
          previewPath,
          mode === "text" ? text : null,
          mode === "image" ? watermarkImage : null,
          posX,
          posY,
          opacity / 100,
          mode === "text" ? size : size / 100,
          color,
          tiled,
          gap,
          angle,
          fontPath,
          isBold,
          lineHeight
        );
        setPreviewSrc(src);
      } catch (e) {
        console.error(e);
      }
      setLoadingPreview(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, previewPath, mode, text, watermarkImage, posX, posY, opacity, size, color, tiled, gap, angle, fontPath, isBold, lineHeight]);

  const handleSelectWatermarkImage = async () => {
    try {
      const selected = await selectFiles();
      if (selected.length > 0) {
        setWatermarkImage(selected[0].path);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecute = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const count = await batchWatermark(
        files,
        mode === "text" ? text : null,
        mode === "image" ? watermarkImage : null,
        posX,
        posY,
        opacity / 100,
        mode === "text" ? size : size / 100,
        color,
        tiled,
        gap,
        angle,
        fontPath,
        isBold,
        lineHeight,
        undefined
      );
      
      const allNewImages = [];
      for (const path of rootPaths) {
        try {
          const imgs = await listImages(path);
          allNewImages.push(...imgs);
        } catch (e) { console.error(e); }
      }
      setImages(allNewImages);

      clearSelection();
      closeDialog();
      // eslint-disable-next-line no-alert
      alert(`成功处理 ${count} 张图片`);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(`失败: ${e}`);
    }
    setProcessing(false);
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tiled) return;
    setIsDragging(true);
    updatePos(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updatePos(e);
  };

  const handleMouseUp = () => setIsDragging(false);

  const updatePos = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPosX(Math.max(0, Math.min(1, x)));
    setPosY(Math.max(0, Math.min(1, y)));
  };

  const positions = [
    { x: 0.05, y: 0.05 }, { x: 0.5, y: 0.05 }, { x: 0.95, y: 0.05 },
    { x: 0.05, y: 0.5 },  { x: 0.5, y: 0.5 },  { x: 0.95, y: 0.5 },
    { x: 0.05, y: 0.95 }, { x: 0.5, y: 0.95 }, { x: 0.95, y: 0.95 },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
      onMouseUp={handleMouseUp}
    >
      <div className="w-[1000px] h-[700px] bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-strong)] shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
              <Stamp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">添加水印</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface-active)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider">
                  已选择 {files.length} 张图片
                </span>
              </div>
            </div>
          </div>
          <button onClick={closeDialog} className="w-10 h-10 rounded-full hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Images Strip */}
        <div className="px-6 py-3 bg-[var(--bg-surface-active)]/30 border-b border-[var(--border-subtle)] overflow-x-auto custom-scrollbar flex gap-2">
          {files.map((path) => (
            <button
              key={path}
              onClick={() => setPreviewPath(path)}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all",
                previewPath === path ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={convertFileSrc(path)} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings */}
          <div className="w-[340px] p-6 border-r border-[var(--border-subtle)] overflow-y-auto bg-[var(--bg-app)]/50 flex flex-col gap-6">
            
            {/* Mode Switch */}
            <div className="flex p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]">
              <button
                onClick={() => setMode("text")}
                className={cn("flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2", mode === "text" ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
              >
                <Type className="w-3.5 h-3.5" /> 文字
              </button>
              <button
                onClick={() => setMode("image")}
                className={cn("flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2", mode === "image" ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
              >
                <ImageIcon className="w-3.5 h-3.5" /> 图片
              </button>
            </div>

            {/* Content Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">水印内容</label>
              {mode === "text" ? (
                <div className="space-y-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-20 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
                    placeholder="输入水印文字 (支持换行)..."
                  />
                  
                  {/* Font Selection */}
                  <select
                    value={fontPath}
                    onChange={(e) => setFontPath(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs focus:outline-none focus:border-[var(--accent)] appearance-none"
                  >
                    {fonts.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBold(!isBold)}
                      className={cn(
                        "h-10 px-3 rounded-lg border text-xs font-bold transition-all",
                        isBold ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                      title="加粗"
                    >
                      B
                    </button>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex-1 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center px-3 text-xs font-mono text-[var(--text-secondary)]">
                      {color.toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden">
                      {watermarkImage ? (
                        <img src={convertFileSrc(watermarkImage)} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={handleSelectWatermarkImage}>
                      选择图片...
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Layout Options */}
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">布局方式</label>
               <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">平铺模式</span>
                  <div 
                    className={cn(
                      "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                      tiled ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"
                    )}
                    onClick={() => setTiled(!tiled)}
                  >
                    <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm", tiled ? "left-6" : "left-1")} />
                  </div>
               </div>
               
               {tiled && (
                <Slider 
                  label="平铺间距" 
                  value={Math.round(gap * 10)} 
                  onChange={(v) => setGap(v / 10)} 
                  min={0} 
                  max={50} 
                />
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              <Slider 
                label={mode === "text" ? "字体大小" : "缩放比例 (%)"} 
                value={size} 
                onChange={setSize} 
                min={10} 
                max={200} 
              />
              {mode === "text" && (
                <Slider 
                  label={`行高 (${lineHeight.toFixed(1)})`}
                  value={lineHeight * 10} 
                  onChange={(v) => setLineHeight(v / 10)} 
                  min={8} 
                  max={30} 
                />
              )}
              <Slider 
                label={`不透明度 (${opacity}%)`}
                value={opacity} 
                onChange={setOpacity} 
                min={0} 
                max={100} 
              />
              <Slider 
                label={`旋转角度 (${angle}°)`}
                value={angle} 
                onChange={setAngle} 
                min={-180} 
                max={180} 
              />
            </div>

            {/* Position Grid (Only if NOT tiled) */}
            {!tiled && (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">位置布局 (支持拖拽)</label>
                <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                  {positions.map((pos, i) => {
                    const isActive = Math.abs(pos.x - posX) < 0.1 && Math.abs(pos.y - posY) < 0.1;
                    return (
                      <button
                        key={i}
                        onClick={() => { setPosX(pos.x); setPosY(pos.y); }}
                        className={cn(
                          "w-full aspect-square rounded border transition-all",
                          isActive 
                            ? "bg-[var(--accent)] border-[var(--accent)] ring-2 ring-[var(--accent)]/30" 
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Preview */}
          <div className="flex-1 bg-[var(--bg-app)] flex items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            {loadingPreview && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            
            <img 
              ref={imgRef}
              src={previewSrc || (previewPath ? convertFileSrc(previewPath) : "")} 
              className={cn(
                "max-w-full max-h-full object-contain shadow-2xl rounded-lg",
                !tiled && "cursor-crosshair active:cursor-grabbing"
              )}
              alt="Preview"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              draggable={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex items-center justify-end gap-4 bg-[var(--bg-app)]/50">
          <Button variant="ghost" onClick={closeDialog}>取消</Button>
          <Button variant="primary" onClick={handleExecute} disabled={isProcessing} className="shadow-lg shadow-[var(--accent)]/20 px-8">
            {isProcessing ? "处理中..." : "开始批量添加"}
          </Button>
        </div>
      </div>
    </div>
  );
}