import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_NOTE,
  buildChartTicks,
  formatDisplayDate,
  formatShortDate,
  type ChartPoint,
} from "@/lib/reassess";

/** P0 唯一趨勢圖：困擾程度。僅呈現實際紀錄點，不補值、不平均。 */
export function SeverityTrendChart({
  points,
  accessibleText,
}: {
  points: ChartPoint[];
  accessibleText: string;
}) {
  const ticks = buildChartTicks(points);

  return (
    <div className="space-y-3">
      <p className="sr-only">{accessibleText}</p>
      <ChartLegend />
      <div className="h-[300px] w-full sm:h-72 lg:h-80" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={ticks}
              tickFormatter={(v: number) => formatShortDate(pointDate(points, v))}
              tickMargin={8}
              fontSize={12}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <YAxis
              domain={[1, 10]}
              ticks={[1, 3, 5, 7, 10]}
              allowDecimals={false}
              width={32}
              fontSize={12}
              stroke="currentColor"
              className="text-muted-foreground"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as ChartPoint | undefined;
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-sm">
                    <p className="font-medium text-foreground">
                      {formatDisplayDate(p.date)}
                      {p.isInitial ? "（初始紀錄）" : "（每日追蹤）"}
                    </p>
                    <p className="text-muted-foreground">困擾程度 {p.severity}／10</p>
                  </div>
                );
              }}
            />
            <Line
              type="linear"
              dataKey="severity"
              stroke="currentColor"
              className="text-primary"
              strokeWidth={2}
              dot={renderDot}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="sr-only">
        {points.map((p) => (
          <li key={`${p.date}-${p.isInitial}`}>
            {formatDisplayDate(p.date)}
            {p.isInitial ? "（初始紀錄）" : "（每日追蹤）"}：困擾程度 {p.severity}／10
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{CHART_NOTE}</p>
    </div>
  );
}

function ChartLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full border-2 border-foreground bg-foreground"
        />
        初始紀錄
      </li>
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full border-2 border-primary bg-surface-elevated"
        />
        每日追蹤
      </li>
    </ul>
  );
}

type DotProps = { cx?: number; cy?: number; payload?: ChartPoint };

function renderDot(props: unknown) {
  const { cx, cy, payload } = props as DotProps;
  if (cx == null || cy == null || !payload) return <g />;
  if (payload.isInitial) {
    return (
      <circle
        key={`d-${payload.x}-initial`}
        cx={cx}
        cy={cy}
        r={4.5}
        className="fill-foreground stroke-foreground"
        strokeWidth={2}
      />
    );
  }
  return (
    <circle
      key={`d-${payload.x}`}
      cx={cx}
      cy={cy}
      r={4}
      className="fill-surface-elevated stroke-primary"
      strokeWidth={2}
    />
  );
}

function pointDate(points: ChartPoint[], x: number): string {
  return points.find((p) => p.x === x)?.date ?? "";
}
