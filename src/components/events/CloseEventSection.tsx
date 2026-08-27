import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/shell/responsive-modal";
import { useCloseEvent } from "@/hooks/useEventLifecycle";

/**
 * P0 Addendum：Reassess 頁的「結束狀況追蹤」入口（僅 active event 顯示）。
 * Secondary/outline 樣式，不使用 destructive red 或品牌漸層。
 */
export function CloseEventSection({
  eventId,
  isPriorityCare,
}: {
  eventId: string;
  isPriorityCare: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const navigate = useNavigate();
  const closeEvent = useCloseEvent(eventId);

  const handleConfirm = async () => {
    setFailed(false);
    try {
      await closeEvent.mutateAsync();
      setOpen(false);
      toast.success("狀況追蹤已結束");
      await navigate({ to: "/dashboard" });
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="pt-1">
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
      >
        結束狀況追蹤
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={(next) => {
          if (closeEvent.isPending) return;
          setOpen(next);
        }}
        title="是否確認結束這次狀況追蹤？"
        description="結束後，這個狀況將移至「已結束的狀況」，不再進行每日追蹤。過去的追蹤紀錄與已建立的摘要仍會保留。"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={closeEvent.isPending}
              onClick={() => setOpen(false)}
            >
              繼續追蹤
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={closeEvent.isPending}
              onClick={() => void handleConfirm()}
            >
              {closeEvent.isPending ? "處理中…" : "確認結束"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            結束後仍可查看紀錄，並建立就醫或專業諮詢摘要。
          </p>

          {isPriorityCare ? (
            <div className="flex items-start gap-2 rounded-lg border border-urgent border-l-4 border-l-urgent bg-urgent-muted px-3 py-2">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-urgent-strong"
              />
              <p className="text-sm leading-6 text-foreground">
                目前的安全確認曾提示需要優先尋求醫療協助。結束追蹤不代表相關警訊已解除；若目前仍有相同狀況，請優先尋求醫療協助。
              </p>
            </div>
          ) : null}

          {failed ? (
            <p role="alert" className="text-sm font-medium text-urgent-strong">
              目前無法結束狀況追蹤，請稍後再試一次。
            </p>
          ) : null}
        </div>
      </ResponsiveModal>
    </div>
  );
}
