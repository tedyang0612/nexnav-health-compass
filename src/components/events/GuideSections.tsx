import { SectionCard } from "@/components/shell";
import type { GuideViewModel } from "@/lib/guide";

/** P08 改善方向內容呈現：只顯示已核准 snapshot，不新增任何醫療文案。 */
export function GuideSections({ guide }: { guide: GuideViewModel }) {
  const { content, suggestions } = guide;

  return (
    <div className="space-y-5">
      <SectionCard>
        <h2 className="text-lg font-semibold text-foreground">{content.title}</h2>
        <p className="text-sm text-muted-foreground">{content.summary_disclaimer}</p>
      </SectionCard>

      <SectionCard title={content.factors_title} description={content.factors_intro}>
        <ul className="space-y-2">
          {content.factors.map((factor) => (
            <li key={factor} className="flex gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <span className="min-w-0">{factor}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{content.factors_disclaimer}</p>
      </SectionCard>

      <SectionCard title="可以先嘗試的調整">
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.code}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {suggestion.description}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{content.suggestion_note}</p>
      </SectionCard>

      <SectionCard title="接下來可以觀察">
        <ul className="space-y-2">
          {content.observations.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-heal/40 bg-heal-muted p-4">
          <p className="text-sm text-foreground">{content.escalation}</p>
        </div>
      </SectionCard>

      {content.sources.length > 0 ? (
        <SectionCard title="資訊來源">
          <ul className="space-y-2">
            {content.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  <span className="min-w-0">{source.title}</span>
                  <ExternalLinkIcon />
                  <span className="sr-only">（在新分頁開啟）</span>
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
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
