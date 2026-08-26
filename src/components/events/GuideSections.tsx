import { Link } from "@tanstack/react-router";
import { SectionCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import type { GuideViewModel } from "@/lib/guide";

/** P08 改善方向內容呈現：只顯示已核准 snapshot，不新增任何醫療文案。 */
export function GuideSections({ guide, eventId }: { guide: GuideViewModel; eventId: string }) {
  const { content, suggestions } = guide;
  const [labelPart, ...restParts] = content.title.split("｜");
  const hasSplit = restParts.length > 0;
  const displayHeading = hasSplit ? restParts.join("｜") : (labelPart ?? content.title);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 摘要：淡 teal 底 + 左側 accent，與一般白卡區隔 */}
      <section className="rounded-xl border border-heal/30 border-l-4 border-l-heal bg-heal-muted/40 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-heal">
          改善方向
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {displayHeading}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {content.summary_disclaimer}
        </p>
      </section>

      <GuideCard>
        <SectionTitle>{content.factors_title}</SectionTitle>
        <p className="text-sm text-foreground/80">{content.factors_intro}</p>
        <ul className="mt-3 space-y-3">
          {content.factors.map((factor) => (
            <li key={factor} className="flex gap-2.5 text-sm text-foreground/85">
              <span aria-hidden="true" className="shrink-0 text-xs leading-6 text-heal">
                ◆
              </span>
              <span className="min-w-0 leading-relaxed">{factor}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          {content.factors_disclaimer}
        </p>
        <SourceLine sources={content.sources} />
      </GuideCard>

      <section className="space-y-3">
        <GuideCard>
          <SectionTitle>可以先嘗試的調整</SectionTitle>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.code}
                className="flex h-full flex-col rounded-lg border border-border/70 bg-surface p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="text-xs font-semibold tabular-nums text-heal"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {suggestion.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/75">
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {content.suggestion_note}
          </p>
          <SourceLine sources={content.sources} />
        </GuideCard>
      </section>

      <GuideCard>
        <SectionTitle>接下來可以觀察</SectionTitle>
        <ul className="mt-3 space-y-3">
          {content.observations.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-foreground/85">
              <span aria-hidden="true" className="shrink-0 text-xs leading-6 text-heal">
                ◆
              </span>
              <span className="min-w-0 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        {/* 尚未判定危急的重新評估提醒：使用黃色 caution，紅色僅保留給已確認的安全警訊。 */}
        <div className="mt-5 rounded-lg border border-caution/50 border-l-4 border-l-caution bg-caution-muted p-4">
          <p className="text-sm font-medium leading-relaxed text-caution-strong">
            {content.escalation}
          </p>
        </div>
      </GuideCard>

      <SectionCard title="接下來，持續記錄變化">
        <p className="text-sm leading-relaxed text-muted-foreground">
          建議先嘗試改善調整，並持續每天花一點時間記錄目前感受與生活狀況，
          <span className="sm:hidden">之後可以查看變化趨勢。</span>
        </p>
        <p className="hidden text-sm leading-relaxed text-muted-foreground sm:block">
          之後可以查看變化趨勢。
        </p>

        <div className="pt-1">
          <Button
            asChild
            size="lg"
            className="min-h-13 w-full rounded-xl sm:w-auto sm:min-w-72"
          >
            <Link to="/events/$eventId/track/today" params={{ eventId }}>
              開始每日追蹤
            </Link>
          </Button>
        </div>
      </SectionCard>

      {content.sources.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface-elevated px-4 py-3 sm:px-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            內容參考來源
          </h2>
          <ul className="mt-2 space-y-1.5">
            {content.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 rounded-sm text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-heal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="min-w-0">{source.title}</span>
                  <ExternalLinkIcon />
                  <span className="sr-only">（在新分頁開啟）</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}


function GuideCard({ children }: { children: React.ReactNode }) {
  return (
    <SectionCard className="gap-0 border-border/80 p-4 shadow-none sm:p-5">
      {children}
    </SectionCard>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 flex items-center gap-2 text-base font-semibold text-foreground">
      <span aria-hidden="true" className="h-4 w-1 shrink-0 rounded-full bg-heal" />
      <span className="min-w-0">{children}</span>
    </h2>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-1 shrink-0"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}
