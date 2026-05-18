import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { useStore, fmtMoney, fmtDate } from "@/lib/store";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getDateRange,
  isWithinRange,
  REVENUE_PERIOD_LABELS,
  type RevenuePeriod,
} from "@/lib/date-ranges";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.45 0.02 85)",
  "oklch(0.55 0.02 85)",
  "oklch(0.65 0.02 85)",
];

function AdminOverview() {
  const { branches, products, bills } = useStore();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { start, end } = getDateRange(revenuePeriod, customFrom, customTo);

  const periodBills = useMemo(
    () => bills.filter((b) => isWithinRange(b.createdAt, start, end)),
    [bills, start, end],
  );

  const totalRevenue = periodBills.reduce((s, b) => s + b.total, 0);
  const lowStock = products.filter((p) => p.stock <= 5).length;

  const branchRevenueData = useMemo(() => {
    return branches
      .map((branch) => {
        const revenue = periodBills
          .filter((b) => b.branchId === branch.id)
          .reduce((s, b) => s + b.total, 0);
        return { name: branch.name, revenue, fillKey: branch.id };
      })
      .filter((row) => row.revenue > 0);
  }, [branches, periodBills]);

  const revenueChartConfig = useMemo(() => {
    const config: ChartConfig = { revenue: { label: "Revenue" } };
    branchRevenueData.forEach((row, i) => {
      config[row.fillKey] = {
        label: row.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
    return config;
  }, [branchRevenueData]);

  const stockChartData = useMemo(
    () =>
      products.map((p) => {
        const branch = branches.find((b) => b.id === p.branchId);
        return {
          name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
          fullName: p.name,
          branch: branch?.name ?? "",
          stock: p.stock,
        };
      }),
    [products, branches],
  );

  const stockChartConfig = {
    stock: { label: "Stock", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <>
      <PageHeader
        eyebrow="Headquarters"
        title="Good day."
        description="A glance at every branch, every bill, in one place."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Period revenue"
          value={fmtMoney(totalRevenue)}
          hint={REVENUE_PERIOD_LABELS[revenuePeriod]}
        />
        <Stat label="Bills in period" value={String(periodBills.length)} hint="Filtered" />
        <Stat label="Branches" value={String(branches.length)} hint="Active locations" />
        <Stat label="Low-stock items" value={String(lowStock)} hint="≤ 5 units" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-xl">Branch revenue</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Share of revenue by branch for the selected period.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(REVENUE_PERIOD_LABELS) as RevenuePeriod[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRevenuePeriod(key)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                    revenuePeriod === key
                      ? "border-ink bg-ink text-paper"
                      : "border-border text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {REVENUE_PERIOD_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {revenuePeriod === "custom" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          {branchRevenueData.length > 0 ? (
            <ChartContainer config={revenueChartConfig} className="mx-auto mt-6 aspect-square max-h-[320px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => fmtMoney(Number(value))}
                      nameKey="name"
                    />
                  }
                />
                <Pie
                  data={branchRevenueData}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={2}
                >
                  {branchRevenueData.map((entry, index) => (
                    <Cell
                      key={entry.fillKey}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="mt-8 py-12 text-center text-sm text-muted-foreground">
              No revenue in this period.
            </p>
          )}

          <ul className="mt-4 space-y-2 border-t border-border pt-4">
            {branches.map((b, i) => {
              const revenue = periodBills
                .filter((x) => x.branchId === b.id)
                .reduce((s, x) => s + x.total, 0);
              const pct = totalRevenue ? Math.round((revenue / totalRevenue) * 100) : 0;
              return (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {b.name}
                  </span>
                  <span className="num text-muted-foreground">
                    {fmtMoney(revenue)} · {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Product stock</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Current quantity on hand for each product.
          </p>
          <ChartContainer config={stockChartConfig} className="mt-6 aspect-[4/3] max-h-[360px] w-full">
            <BarChart data={stockChartData} margin={{ left: 0, right: 8, bottom: 48 }}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                angle={-40}
                textAnchor="end"
                height={72}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as { fullName?: string; branch?: string };
                      return row?.fullName
                        ? `${row.fullName}${row.branch ? ` · ${row.branch}` : ""}`
                        : "";
                    }}
                  />
                }
              />
              <Bar dataKey="stock" fill="var(--color-stock)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </section>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="responsive-table lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-xl">Recent bills</h2>
            <Link
              to="/admin/bills"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left font-medium">Invoice</th>
                <th className="px-5 py-3 text-left font-medium">Branch</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {bills.slice(0, 6).map((b) => {
                const br = branches.find((x) => x.id === b.branchId);
                return (
                  <tr key={b.id} className="border-b border-border/60 transition hover:bg-muted/50">
                    <td className="px-5 py-3 font-medium">{b.number}</td>
                    <td className="px-5 py-3 text-muted-foreground">{br?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{fmtDate(b.createdAt)}</td>
                    <td className="px-5 py-3 text-right num">{fmtMoney(b.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Branches</h2>
          <ul className="mt-4 space-y-3">
            {branches.map((b) => {
              const branchRevenue = bills
                .filter((x) => x.branchId === b.id)
                .reduce((s, x) => s + x.total, 0);
              return (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{b.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm num">{fmtMoney(branchRevenue)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Revenue
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
