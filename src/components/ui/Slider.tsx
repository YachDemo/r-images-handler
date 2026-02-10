interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({ label, value, min, max, onChange, disabled }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{label}</span>}
        <span className="text-sm text-[var(--md-sys-color-on-surface)] font-mono w-12 text-right">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-1 bg-[var(--md-sys-color-surface-container-highest)] rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[var(--md-sys-color-primary)]
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
          "
          style={{
            background: `linear-gradient(to right, var(--md-sys-color-primary) 0%, var(--md-sys-color-primary) ${percentage}%, var(--md-sys-color-surface-container-highest) ${percentage}%, var(--md-sys-color-surface-container-highest) 100%)`,
          }}
        />
        {/* 中点标记 */}
        {min < 0 && max > 0 && (
          <div
            className="absolute w-1 h-1 rounded-full bg-[var(--md-sys-color-on-surface-variant)] pointer-events-none opacity-50"
            style={{ left: `${((0 - min) / (max - min)) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
