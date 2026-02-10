import { Slider } from "../ui/Slider";
import { useEditorStore } from "../../stores/editorStore";
import { Sun, Contrast, Palette } from "lucide-react";

export function ColorSliders() {
  const {
    brightness,
    contrast,
    saturation,
    setBrightness,
    setContrast,
    setSaturation,
    isProcessing,
  } = useEditorStore();

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wider flex items-center gap-2">
        <Palette className="w-4 h-4" />
        色彩调整
      </h3>

      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <Sun className="w-4 h-4 text-[#6b6b6b] mt-1 flex-shrink-0" />
          <div className="flex-1">
            <Slider
              label="亮度"
              value={brightness}
              min={-100}
              max={100}
              onChange={setBrightness}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Contrast className="w-4 h-4 text-[#6b6b6b] mt-1 flex-shrink-0" />
          <div className="flex-1">
            <Slider
              label="对比度"
              value={contrast}
              min={-100}
              max={100}
              onChange={setContrast}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Palette className="w-4 h-4 text-[#6b6b6b] mt-1 flex-shrink-0" />
          <div className="flex-1">
            <Slider
              label="饱和度"
              value={saturation}
              min={-100}
              max={100}
              onChange={setSaturation}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
