import {
  Bone,
  BatteryLow,
  Brain,
  MoreHorizontal,
  Moon,
  Orbit,
  Soup,
  Wind,
  type LucideIcon,
} from "lucide-react";

/** Seed symptom code → 對應 icon（7+1）。 */
const SYMPTOM_ICONS: Record<string, LucideIcon> = {
  headache: Brain,
  dizziness: Orbit,
  fatigue: BatteryLow,
  sleep_difficulty: Moon,
  abdominal_gastrointestinal_discomfort: Soup,
  muscle_joint_discomfort: Bone,
  nose_throat_discomfort: Wind,
  other: MoreHorizontal,
};

export function symptomIcon(code: string | null | undefined): LucideIcon {
  return (code && SYMPTOM_ICONS[code]) || MoreHorizontal;
}

/** 藍綠漸層圓形 icon 容器。 */
export function SymptomIcon({
  code,
  className = "size-10",
  iconClassName = "size-5",
}: {
  code: string | null | undefined;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = symptomIcon(code);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-heal text-white ${className}`}
    >
      <Icon className={iconClassName} strokeWidth={2} />
    </span>
  );
}
