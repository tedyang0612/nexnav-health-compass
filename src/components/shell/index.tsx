import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 共用版型基礎元件（P01）。
 * 這些元件只提供結構與樣式，不包含任何健康或醫療內容。
 */

export function PageContainer({
  children,
  className,
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        width === "narrow" && "max-w-2xl",
        width === "default" && "max-w-5xl",
        width === "wide" && "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  children,
  footer,
  className,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-4 border-border bg-surface-elevated p-5 sm:p-6", className)}>
      {title || description ? (
        <div className="space-y-1">
          {title ? (
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
      {footer ? <div className="pt-1">{footer}</div> : null}
    </Card>
  );
}

/** Mobile 預設滿寬的主要行動按鈕外框。 */
export function PrimaryCta({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      size="lg"
      className={cn("min-h-11 w-full sm:w-auto", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

type BannerTone = "info" | "note" | "attention";

/** 狀態訊息列：以文字與圖示標示狀態，不單靠顏色。 */
export function StatusBanner({
  tone = "info",
  label,
  title,
  description,
  icon,
  actions,
}: {
  tone?: BannerTone;
  label?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  const toneClass =
    tone === "attention"
      ? "border-heal/40 bg-heal-muted"
      : tone === "note"
        ? "border-border bg-muted"
        : "border-border bg-surface-elevated";

  return (
    <section
      role="status"
      className={cn("rounded-xl border p-4 sm:p-5", toneClass)}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground">
          {icon ?? <InfoIcon />}
        </span>
        <div className="min-w-0 space-y-1">
          {label ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
          ) : null}
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          {actions ? <div className="pt-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function LoadingState({ label = "載入中…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <SkeletonBlock />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <InfoIcon />
      </span>
      <p className="text-base font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "目前無法載入這個頁面",
  description = "請稍後再試一次，或返回上一頁。",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface px-6 py-12 text-center"
    >
      <span aria-hidden="true" className="text-muted-foreground">
        <AlertIcon />
      </span>
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="outline" className="min-h-11" onClick={onRetry}>
          重試
        </Button>
      ) : null}
    </div>
  );
}

/** 表單欄位外框：label、說明、錯誤訊息與 a11y 綁定。 */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-muted-foreground">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
