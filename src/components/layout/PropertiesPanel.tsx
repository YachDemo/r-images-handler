import { useState, useEffect } from "react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { Info, Calendar, HardDrive, Maximize2, FileType, Loader2, Grid3X3, Image as ImageIcon, BarChart3, Palette, Tag, Camera, Aperture, Clock, MapPin, X, Plus } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useBatchStore } from "../../stores/batchStore";
import { useTagStore } from "../../stores/tagStore";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function PropertiesPanel() {
  const { selectedPaths } = useSelectionStore();
  const { images } = useFileStore();
  const { openCollageDialog } = useBatchStore();
  const { addTag, removeTag, getTags } = useTagStore();
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Focused image for multi-selection detail view
  const [focusedImage, setFocusedImage] = useState<any | null>(null);
  
  // Tagging state
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isBatchTagging, setIsBatchTagging] = useState(false);
  const [batchTag, setBatchTag] = useState("");

  const selectedImages = Array.from(selectedPaths).map((path) => {
    const found = images.find((img) => img.path === path);
    if (found) return found;
    // Fallback for cross-folder selection
    const name = path.split(/[/\\]/).pop() || path;
    const extension = name.split(".").pop() || "";
    return {
      path,
      name,
      extension,
      size: 0,
      sizeFormatted: "未知",
      width: 0,
      height: 0,
      modified: 0,
      modifiedFormatted: "-",
      thumbnailPath: null,
    };
  });
  
  // Reset focus when selection changes
  useEffect(() => {
    setFocusedImage(null);
    setIsAddingTag(false);
    setNewTag("");
  }, [selectedPaths]);

  const selectedImage = selectedImages.length === 1 ? selectedImages[0] : null;
  // Determine which image to show details for (single selection OR focused in multi-select)
  const displayImage = selectedImage || focusedImage;
  const currentTags = displayImage ? getTags(displayImage.path) : [];

  useEffect(() => {
    if (displayImage?.path) {
      setImageLoaded(false);
      const src = convertFileSrc(displayImage.path);
      setImageSrc(src);
    } else {
      setImageSrc(null);
    }
  }, [displayImage?.path]);

  const handleAddTag = () => {
    if (newTag.trim() && displayImage) {
      addTag(displayImage.path, newTag.trim());
      setNewTag("");
      setIsAddingTag(false);
    }
  };

  const handleBatchAddTag = () => {
    if (batchTag.trim()) {
      selectedImages.forEach(img => addTag(img.path, batchTag.trim()));
      setBatchTag("");
      setIsBatchTagging(false);
    }
  };

  const totalSize = selectedImages.reduce((sum, img) => sum + img.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      {/* 标题栏 */}
      <div className="h-[var(--toolbar-height)] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-md sticky top-0 z-10">
        <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] select-none">
          属性检查器
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent)] text-white shadow-sm">
           {selectedImages.length} 选中
        </span>
      </div>

      {/* 属性内容滚动区 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        
        {/* 多选模式下的概览网格 (始终显示) */}
        {selectedImages.length > 1 && (
            <PropertyCard title="多选概览" icon={Grid3X3}>
               <div className="flex flex-col gap-4">
                 <div className="grid grid-cols-4 gap-2">
                    {selectedImages.slice(0, 8).map((img) => {
                      const isFocused = focusedImage?.path === img.path;
                      return (
                        <div 
                          key={img.path} 
                          className={cn(
                            "aspect-square rounded bg-[var(--bg-app)] overflow-hidden border cursor-pointer transition-all hover:scale-105",
                            isFocused ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30" : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                          )}
                          onClick={() => setFocusedImage(img)}
                        >
                          <img src={convertFileSrc(img.path)} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                        </div>
                      );
                    })}
                 </div>
                 {!focusedImage && (
                   <div className="p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] flex flex-col gap-2">
                      <div className="flex justify-between text-xs">
                         <span className="text-[var(--text-muted)]">已选数量</span>
                         <span className="text-[var(--text-primary)] font-bold">{selectedImages.length} 张</span>
                      </div>
                      <div className="flex justify-between text-xs">
                         <span className="text-[var(--text-muted)]">总大小</span>
                         <span className="text-[var(--text-primary)] font-mono">{formatSize(totalSize)}</span>
                      </div>
                   </div>
                 )}
               </div>
            </PropertyCard>
        )}

        {/* 详情展示区 (单选 或 多选时的聚焦) */}
        {displayImage ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            {focusedImage && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">选中图片详情</span>
                <button 
                  onClick={() => setFocusedImage(null)}
                  className="p-1 rounded hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="关闭详情"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 1. 预览卡片 */}
            <PropertyCard className="overflow-hidden p-0 border-0 bg-[var(--bg-app)]">
              <div className="aspect-video w-full bg-[var(--bg-app)] relative flex items-center justify-center group">
                 {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface)]">
                    <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                     style={{ backgroundImage: 'conic-gradient(#fff 0.25turn, transparent 0.25turn 0.5turn, #fff 0.5turn 0.75turn, transparent 0.75turn)', backgroundSize: '16px 16px' }}>
                </div>
                <img
                  src={imageSrc || ""}
                  alt={displayImage.name}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-all duration-500 ease-out z-10",
                    imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95 blur-sm"
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
                
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/90 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {displayImage.width} × {displayImage.height}
                </div>
              </div>
            </PropertyCard>

            {/* 2. 基本信息卡片 */}
            <PropertyCard title="基本信息" icon={Info}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">文件名</label>
                  <p className="text-sm font-medium text-[var(--text-primary)] break-words select-all leading-snug">
                    {displayImage.name}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">路径</label>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)] break-all leading-tight opacity-80 select-all p-2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                    {displayImage.path}
                  </p>
                </div>
                 <div className="grid grid-cols-2 gap-2 pt-1">
                   <InfoBadge icon={FileType} label={displayImage.extension.toUpperCase()} />
                   <InfoBadge icon={HardDrive} label={displayImage.sizeFormatted} />
                 </div>
              </div>
            </PropertyCard>

             {/* 3. 图像分析卡片 (模拟) */}
            <PropertyCard title="图像分析" icon={BarChart3}>
               <div className="flex flex-col gap-4">
                  {/* 模拟直方图 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>RGB 直方图</span>
                      <span>ISO 200</span>
                    </div>
                    <div className="h-16 flex items-end gap-[1px] opacity-80">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="flex-1 bg-[var(--accent)]/30 rounded-t-[1px]" style={{ height: `${Math.random() * 80 + 20}%` }} />
                      ))}
                      {[...Array(20)].map((_, i) => (
                         <div key={`g-${i}`} className="flex-1 bg-green-500/30 rounded-t-[1px]" style={{ height: `${Math.random() * 80 + 20}%` }} />
                      ))}
                      {[...Array(20)].map((_, i) => (
                         <div key={`b-${i}`} className="flex-1 bg-blue-500/30 rounded-t-[1px]" style={{ height: `${Math.random() * 80 + 20}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* 模拟色板 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                       <Palette className="w-3 h-3" />
                       <span>主色调</span>
                    </div>
                    <div className="flex gap-2">
                       {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'].map(color => (
                         <div key={color} className="h-6 flex-1 rounded-md shadow-sm ring-1 ring-inset ring-black/10" style={{ backgroundColor: color }} />
                       ))}
                    </div>
                  </div>
               </div>
            </PropertyCard>

             {/* 4. 元数据卡片 (真实数据) */}
            <PropertyCard title="拍摄信息" icon={Camera}>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                 <InfoRow icon={Camera} label="设备" value={displayImage.exif?.cameraModel || "-"} />
                 <InfoRow icon={Aperture} label="光圈" value={displayImage.exif?.fNumber || "-"} />
                 <InfoRow icon={Maximize2} label="焦距" value={displayImage.exif?.focalLength || "-"} />
                 <InfoRow icon={Clock} label="曝光" value={displayImage.exif?.shutterSpeed || "-"} />
                 <InfoRow icon={MapPin} label="ISO" value={displayImage.exif?.iso || "-"} />
                 <InfoRow icon={Calendar} label="时间" value={displayImage.modifiedFormatted} fullWidth />
              </div>
            </PropertyCard>

             {/* 5. 标签管理 (真实功能) */}
             <PropertyCard title="标签" icon={Tag}>
                <div className="flex flex-wrap gap-2 mb-2">
                   {currentTags.length > 0 ? (
                     currentTags.map(tag => (
                       <div key={tag} className="group px-2 py-1 rounded-md bg-[var(--accent-surface)] border border-[var(--accent-glow)] text-[var(--accent)] text-xs font-medium flex items-center gap-1">
                         <span>{tag}</span>
                         <button 
                           onClick={() => removeTag(displayImage.path, tag)}
                           className="w-3 h-3 rounded-full hover:bg-[var(--accent)]/20 flex items-center justify-center transition-colors"
                         >
                           <X className="w-2 h-2" />
                         </button>
                       </div>
                     ))
                   ) : (
                     <p className="text-[10px] text-[var(--text-muted)] italic py-1">暂无标签</p>
                   )}
                </div>
                
                {isAddingTag ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <input
                      type="text"
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag();
                        if (e.key === "Escape") setIsAddingTag(false);
                      }}
                      onBlur={() => { if (!newTag) setIsAddingTag(false); }}
                      placeholder="输入标签..."
                      className="flex-1 h-7 px-2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs focus:outline-none focus:border-[var(--accent)]"
                    />
                    <Button size="sm" variant="primary" onClick={handleAddTag} className="h-7 px-2 text-xs">
                      确定
                    </Button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingTag(true)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加标签</span>
                  </button>
                )}
             </PropertyCard>
          </div>
        ) : (
          /* 多选时未选中聚焦图片，显示批量操作 */
          selectedImages.length > 1 && !focusedImage && (
            <PropertyCard title="批量操作" icon={BarChart3}>
               <div className="flex flex-col gap-3">
                  <Button variant="primary" className="w-full justify-start" onClick={openCollageDialog}>
                     <Grid3X3 className="w-4 h-4 mr-2" />
                     创建拼图
                  </Button>
                  
                  {isBatchTagging ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input
                        type="text"
                        autoFocus
                        value={batchTag}
                        onChange={(e) => setBatchTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleBatchAddTag();
                          if (e.key === "Escape") setIsBatchTagging(false);
                        }}
                        onBlur={() => { if (!batchTag) setIsBatchTagging(false); }}
                        placeholder="输入标签..."
                        className="flex-1 h-8 px-2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-xs focus:outline-none focus:border-[var(--accent)]"
                      />
                      <Button size="sm" variant="primary" onClick={handleBatchAddTag} className="h-8 px-3 text-xs">
                        确定
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-active)]"
                      onClick={() => setIsBatchTagging(true)}
                    >
                       <Tag className="w-4 h-4 mr-2" />
                       批量添加标签
                    </Button>
                  )}
               </div>
            </PropertyCard>
          )
        )}
        
        {/* 空状态 */}
        {selectedImages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-center gap-4 opacity-60">
             <div className="p-4 rounded-full bg-[var(--bg-app)] border border-[var(--border-subtle)]">
               <ImageIcon className="w-8 h-8" />
             </div>
             <p className="text-sm">选择图片查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ 
  children, 
  title, 
  icon: Icon,
  className 
}: { 
  children: React.ReactNode; 
  title?: string; 
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div className={cn("w-full bg-[var(--bg-surface-hover)]/30 border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm transition-all hover:border-[var(--border-strong)] flex flex-col gap-3", className)}>
      {title && (
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]/50">
          {Icon && <Icon className="w-4 h-4 text-[var(--text-muted)]" />}
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function InfoBadge({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)]">
      <Icon className="w-3 h-3 text-[var(--text-secondary)]" />
      <span className="text-[10px] font-mono text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, fullWidth = false }: { icon: any, label: string, value: string, fullWidth?: boolean }) {
  return (
    <div className={cn("flex items-start gap-3 py-1", fullWidth ? "col-span-2" : "")}>
      <Icon className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
      <div className="flex flex-col gap-0.5 min-w-0">
         <span className="text-[10px] text-[var(--text-muted)] leading-none">{label}</span>
         <span className="text-[12px] text-[var(--text-primary)] font-medium leading-tight break-words">{value}</span>
      </div>
    </div>
  );
}
