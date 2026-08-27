import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageContainer, SectionCard } from "@/components/shell";

/** 已結束狀況的共用阻擋畫面（Safety／Guide 使用）。 */
export function ClosedEventNotice({
  eventId,
  description,
}: {
  eventId: string;
  description: string;
}) {
  return (
    <PageContainer width="narrow" className="space-y-6">
      <SectionCard title="這項狀況追蹤已結束">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="pt-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/events/$eventId/reassess" params={{ eventId }}>
              查看追蹤紀錄
            </Link>
          </Button>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
