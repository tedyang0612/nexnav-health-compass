import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shell";
import {
  DURATION_UNITS,
  FREQUENCY_OPTIONS,
  LIFE_CONTEXT_FIELDS,
  NOT_FILLED,
  type EventFormValues,
  type SymptomOption,
} from "@/lib/event-wizard";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function StepReview({
  values,
  options,
  onEditStep,
  disabled,
}: {
  values: EventFormValues;
  options: SymptomOption[];
  onEditStep: (step: 1 | 2) => void;
  disabled: boolean;
}) {
  const primary = options.find((o) => o.id === values.primarySymptomId);
  const isOther = !!primary?.is_other;
  const frequency =
    FREQUENCY_OPTIONS.find((f) => f.value === values.frequencyLevel)?.label ??
    NOT_FILLED;
  const unit =
    DURATION_UNITS.find((u) => u.value === values.durationUnit)?.label ?? "";

  const associated = [
    ...values.associatedSymptomIds
      .map((id) => options.find((o) => o.id === id)?.display_name)
      .filter((n): n is string => !!n),
    ...values.customAssociatedSymptoms.map((t) => t.trim()).filter(Boolean),
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="主要不適症狀"
        footer={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            disabled={disabled}
            onClick={() => onEditStep(1)}
          >
            返回修改
          </Button>
        }
      >
        <dl>
          <Row label="主要不適症狀" value={primary?.display_name ?? NOT_FILLED} />
          {isOther ? (
            <Row
              label="自訂描述"
              value={values.customPrimarySymptom.trim() || NOT_FILLED}
            />
          ) : null}
          <Row label="不適開始日期" value={values.startedOn || NOT_FILLED} />
          <Row label="目前困擾程度" value={`${values.severity}／10`} />
          <Row label="最近的發生頻率" value={frequency} />
          <Row
            label="頻率補充描述"
            value={values.frequencyDescription.trim() || NOT_FILLED}
          />
          <Row
            label="每次持續時間"
            value={
              values.durationValue && unit
                ? `${values.durationValue} ${unit}`
                : NOT_FILLED
            }
          />
        </dl>
      </SectionCard>

      <SectionCard
        title="相關症狀與生活狀況"
        footer={
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            disabled={disabled}
            onClick={() => onEditStep(2)}
          >
            返回修改
          </Button>
        }
      >
        <dl>
          <Row
            label="相關症狀"
            value={associated.length > 0 ? associated.join("、") : NOT_FILLED}
          />
          {LIFE_CONTEXT_FIELDS.map((field) => (
            <Row
              key={field.key}
              label={field.label}
              value={
                field.options.find((o) => o.value === values[field.key])?.label ??
                NOT_FILLED
              }
            />
          ))}
          <Row
            label="補充描述"
            value={values.supplementalDescription.trim() || NOT_FILLED}
          />
        </dl>
      </SectionCard>
    </div>
  );
}
