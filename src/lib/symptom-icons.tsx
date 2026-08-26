/** Seed symptom code → 官方 SVG 圖示（7+1），共用於 Dashboard 與 Record。 */
const SYMPTOM_ICON_SRC: Record<string, string> = {
  headache: "/icons/symptoms/headache.svg",
  dizziness: "/icons/symptoms/dizziness_unsteadiness.svg",
  fatigue: "/icons/symptoms/fatigue_low_energy.svg",
  sleep_difficulty: "/icons/symptoms/sleep_disturbance.svg",
  abdominal_gastrointestinal_discomfort:
    "/icons/symptoms/abdominal_gastrointestinal_discomfort.svg",
  muscle_joint_discomfort: "/icons/symptoms/muscle_joint_discomfort.svg",
  nose_throat_discomfort: "/icons/symptoms/nose_throat_discomfort.svg",
  other: "/icons/symptoms/other_discomfort.svg",
};

export function symptomIconSrc(code: string | null | undefined): string {
  return (
    (code && SYMPTOM_ICON_SRC[code]) || SYMPTOM_ICON_SRC["other"]!
  );
}

/** 直接顯示 SVG 內建的藍綠漸層圓底，外層不再加底色。 */
export function SymptomIcon({
  code,
  className = "size-11",
}: {
  code: string | null | undefined;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <img
      src={symptomIconSrc(code)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
