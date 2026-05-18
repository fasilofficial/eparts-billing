import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, fmtMoney, fmtDate } from "@/lib/store";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { branches, products, bills } = useStore();
  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const today = new Date().toDateString();
  const todayRevenue = bills.filter((b) => new Date(b.createdAt).toDateString() === today).reduce((s, b) => s + b.total, 0);
  const weekStart = Date.now() - 7 * 86400000;
  const weekRevenue = bills.filter((b) => new Date(b.createdAt).getTime() >= weekStart).reduce((s, b) => s + b.total, 0);
  const lowStock = products.filter((p) => p.stock <= 5).length;

  return (
    <>
      <PageHeader eyebrow="Headquarters" title="Good day." description="A glance at every branch, every bill, in one place." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total revenue" value={fmtMoney(totalRevenue)} hint="All branches" />
        <Stat label="Bills generated" value={String(bills.length)} hint="To date" />
        <Stat label="Branches" value={String(branches.length)} hint="Active locations" />
        <Stat label="Low-stock items" value={String(lowStock)} hint="≤ 5 units" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Today" value={fmtMoney(todayRevenue)} />
        <Stat label="This week" value={fmtMoney(weekRevenue)} />
        <Stat label="This month" value={fmtMoney(totalRevenue)} />
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="responsive-table lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-xl">Recent bills</h2>
            <Link to="/admin/bills" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
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
              const branchRevenue = bills.filter((x) => x.branchId === b.id).reduce((s, x) => s + x.total, 0);
              return (
                <li key={b.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{b.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm num">{fmtMoney(branchRevenue)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Revenue</div>
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
