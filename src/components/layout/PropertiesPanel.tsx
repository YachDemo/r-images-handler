import { useState, useEffect } from "react";
import { useSelectionStore } from "../../stores/selectionStore";
import { useFileStore } from "../../stores/fileStore";
import { Info, Calendar, HardDrive, Maximize2, FileType, Loader2, Grid3X3, Image as ImageIcon } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useBatchStore } from "../../stores/batchStore";
import { Button } from "../ui/Button";

export function PropertiesPanel({ width }: { width: number }) {
  const { selectedPaths } = useSelectionStore();
  const { images } = useFileStore();
  const { openCollageDialog } = useBatchStore();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const selectedImages = images.filter((img) => selectedPaths.has(img.path));
  const selectedImage = selectedImages.length === 1 ? selectedImages[0] : null;

  useEffect(() => {
    if (selectedImage?.path) {
      setImageLoaded(false);
      const src = convertFileSrc(selectedImage.path);
      setImageSrc(src);
    } else {
      setImageSrc(null);
    }
  }, [selectedImage?.path]);

  const totalSize = selectedImages.reduce((sum, img) => sum + img.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <aside 
      style={{ width }} 
      className="bg-[var(--bg-surface)] flex flex-col h-full overflow-hidden flex-shrink-0 border-l border-[var(--border-subtle)]"
    >
      {/* 标题 */}
      <div className="h-[var(--toolbar-height)] px-6 flex items-center border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50 backdrop-blur-md">
        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] select-none">
          属性详情
        </span>
      </div>

      {/* 属性内容 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {selectedImage ? (
          <div className="animate-fade-in p-6 space-y-8">
            {/* 预览图卡片 */}
            <div className="space-y-3">
              <div className="aspect-video w-full rounded-xl bg-[var(--bg-app)] border border-[var(--border-strong)] overflow-hidden relative flex items-center justify-center group shadow-2xl shadow-black/40">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface)]">
                    <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
                  </div>
                )}
                {/* 棋盘格背景 (Refined) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{ backgroundImage: 'conic-gradient(#fff 0.25turn, transparent 0.25turn 0.5turn, #fff 0.5turn 0.75turn, transparent 0.75turn)', backgroundSize: '16px 16px' }}>
                </div>
                <img
                  src={imageSrc || ""}
                  alt={selectedImage.name}
                  className={`max-w-full max-h-full object-contain transition-all duration-500 ease-out z-10 ${imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95 blur-sm"}`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              <div className="px-1 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>PREVIEW</span>
                <span>{selectedImage.width} × {selectedImage.height}</span>
              </div>
            </div>

            {/* 文件基本信息 */}
            <section className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-[var(--text-primary)] text-sm font-semibold break-words leading-relaxed select-all" title={selectedImage.name}>
                  {selectedImage.name}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono break-all leading-tight opacity-70" title={selectedImage.path}>
                  {selectedImage.path}
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
                <InfoSection title="文件详情">
                  <InfoRow icon={Maximize2} label="分辨率" value={`${selectedImage.width} × ${selectedImage.height}`} />
                  <InfoRow icon={HardDrive} label="文件大小" value={selectedImage.sizeFormatted} />
                  <InfoRow icon={FileType} label="文件格式" value={selectedImage.extension.toUpperCase()} />
                  <InfoRow icon={Calendar} label="修改日期" value={selectedImage.modifiedFormatted} />
                </InfoSection>
              </div>
            </section>
          </div>
        ) : selectedImages.length > 1 ? (
          <div className="animate-fade-in p-6 space-y-8">
            {/* 多图预览堆叠效果 */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-[var(--bg-app)]/30 rounded-xl border border-[var(--border-subtle)] shadow-inner">
              {selectedImages.slice(0, 9).map((img) => (
                <div
                  key={img.path}
                  className="aspect-square rounded-lg bg-[var(--bg-surface)] overflow-hidden border border-[var(--border-subtle)] shadow-sm hover:border-[var(--accent)]/50 transition-colors"
                >
                  <img
                    src={convertFileSrc(img.path)}
                    alt={img.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
              ))}
              {selectedImages.length > 9 && (
                <div className="aspect-square rounded-lg bg-[var(--bg-surface-active)] flex items-center justify-center border border-[var(--border-subtle)] border-dashed">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">+{selectedImages.length - 9}</span>
                </div>
              )}
            </div>

            <section className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-[var(--text-primary)] font-semibold text-sm leading-tight">
                  已选择 {selectedImages.length} 个资源
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">批量操作就绪</p>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <InfoSection title="统计详情">
                  <InfoRow icon={HardDrive} label="总占用" value={formatSize(totalSize)} />
                  <InfoRow 
                    icon={FileType} 
                    label="包含格式" 
                    value={[...new Set(selectedImages.map(i => i.extension.toUpperCase()))].slice(0, 3).join(", ") + (new Set(selectedImages.map(i => i.extension)).size > 3 ? "..." : "")} 
                  />
                </InfoSection>
              </div>

              {selectedImages.length >= 2 && (
                <div className="pt-4">
                  <Button
                    variant="primary"
                    className="w-full h-10 text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                    onClick={openCollageDialog}
                  >
                    <Grid3X3 className="w-3.5 h-3.5 mr-2" />
                    创建图片拼图
                  </Button>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] animate-fade-in p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center shadow-inner border border-[var(--border-subtle)]">
              <ImageIcon className="w-8 h-8 opacity-20" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">未选中任何内容</p>
              <p className="text-[11px] opacity-50 max-w-[160px] leading-relaxed">在图库中点击一张或多张图片来查看其属性和操作</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">
        {title}
      </h4>
      <div className="space-y-3 px-1">{children}</div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-[11px] group">
      <div className="flex items-center gap-2.5 text-[var(--text-secondary)] flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-[var(--text-primary)] truncate max-w-[140px] text-right font-mono select-all font-medium opacity-90" title={value}>
        {value}
      </span>
    </div>
  );
}
