import { Slider } from "@/components/ui/slider";
import { SEVERITY_ANCHORS } from "@/lib/event-wizard";

/** 1–10 困擾程度，數值以文字同時呈現，不以顏色承載語意。 */
export function SeveritySlider({
  id,
  value,
  onChange,
  describedBy,
  invalid,
}: {
  id: string;
  value: number;
  onChange: (next: number) => void;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">目前選擇</span>
        <span className="text-lg font-semibold text-foreground" aria-hidden="true">
          {value}／10
        </span>
      </div>
      <Slider
        id={id}
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(next[0] ?? value)}
        aria-label="目前困擾程度（1–10）"
        aria-valuetext={`${value} / 10`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="py-2"
      />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {SEVERITY_ANCHORS.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
