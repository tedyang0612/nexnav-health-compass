import { useEffect, type RefObject } from "react";
import { useBlocker } from "@tanstack/react-router";
import { ResponsiveModal } from "@/components/shell/responsive-modal";
import { Button } from "@/components/ui/button";

/**
 * 只在表單相對初始值有實際變更時啟用。
 * Primary「繼續編輯」留在原表單；Secondary「放棄變更並離開」才執行原本導覽。
 */
export function UnsavedChangesGuard({
  enabled,
  bypassRef,
}: {
  enabled: boolean;
  bypassRef?: RefObject<boolean>;
}) {
  const shouldBlock = () => enabled && !bypassRef?.current;
  const blocker = useBlocker({
    shouldBlockFn: shouldBlock,
    enableBeforeUnload: shouldBlock,
    withResolver: true,
  });

  useEffect(() => {
    if (!enabled || bypassRef?.current) return;
    const handler = (event: BeforeUnloadEvent) => {
      if (bypassRef?.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, bypassRef]);

  const open = blocker.status === "blocked";

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next && blocker.status === "blocked") blocker.reset();
      }}
      title="尚未儲存變更"
      description="您在這個頁面有尚未儲存的內容。"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              if (blocker.status === "blocked") blocker.reset();
            }}
          >
            繼續編輯
          </Button>
          <Button
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => {
              if (blocker.status === "blocked") blocker.proceed();
            }}
          >
            放棄變更並離開
          </Button>
        </div>
      }
    />
  );
}
