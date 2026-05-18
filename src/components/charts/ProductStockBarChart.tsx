import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const stockChartConfig = {
  stock: { label: "Stock", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ProductStockBarChart({
  products,
}: {
  products: { name: string; stock: number; category?: string }[];
}) {
  const chartData = products.map((p) => ({
    name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
    fullName: p.name,
    category: p.category ?? "",
    stock: p.stock,
  }));

  if (chartData.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">No products to chart yet.</p>
    );
  }

  return (
    <ChartContainer config={stockChartConfig} className="aspect-[4/3] max-h-[360px] w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 8, bottom: 48 }}>
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
                const row = payload?.[0]?.payload as { fullName?: string; category?: string };
                if (!row?.fullName) return "";
                return row.category ? `${row.fullName} · ${row.category}` : row.fullName;
              }}
            />
          }
        />
        <Bar dataKey="stock" fill="var(--color-stock)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
