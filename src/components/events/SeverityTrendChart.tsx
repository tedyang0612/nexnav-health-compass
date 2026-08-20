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
      <div className="h-64 w-full sm:h-72" aria-hidden="true">
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
              width={36}
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
                      {p.isInitial ? "（初始）" : ""}
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
              dot={{ r: 3.5 }}
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
            {p.isInitial ? "（初始）" : ""}：困擾程度 {p.severity}／10
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{CHART_NOTE}</p>
    </div>
  );
}

function pointDate(points: ChartPoint[], x: number): string {
  return points.find((p) => p.x === x)?.date ?? "";
}
