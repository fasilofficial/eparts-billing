import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, fmtMoney, fmtDate } from "@/lib/store";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { BranchLeaderboard } from "@/components/branch/BranchLeaderboard";
import { ProductStockBarChart } from "@/components/charts/ProductStockBarChart";
import { ArrowUpRight, ReceiptText } from "lucide-react";

export const Route = createFileRoute("/branch/")({ component: BranchOverview });

function BranchOverview() {
  const { session, bills, products } = useStore();
  const myBills = bills.filter((b) => b.branchId === session?.branchId);
  const myProducts = products.filter((p) => p.branchId === session?.branchId);
  const today = new Date().toDateString();
  const todayBills = myBills.filter((b) => new Date(b.createdAt).toDateString() === today);
  const todayRevenue = todayBills.reduce((s, b) => s + b.total, 0);
  const totalRevenue = myBills.reduce((s, b) => s + b.total, 0);
  const lowStock = myProducts.filter((p) => p.stock <= 5).length;

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Your workspace."
        description="Quiet command for your shop floor."
        actions={
          <Link
            to="/branch/billing"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
          >
            <ReceiptText className="size-4" /> New bill
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Today's sales"
          value={fmtMoney(todayRevenue)}
          hint={`${todayBills.length} bills`}
        />
        <Stat label="Total revenue" value={fmtMoney(totalRevenue)} hint="All-time" />
        <Stat label="Total bills" value={String(myBills.length)} />
        <Stat label="Low stock" value={String(lowStock)} hint="≤ 5 units" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BranchLeaderboard currentBranchId={session?.branchId} />
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Product stock</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Current quantity on hand for your catalog.
          </p>
          <div className="mt-4">
            <ProductStockBarChart products={myProducts} />
          </div>
        </section>
      </div>

      <section className="responsive-table mt-12 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl">Recent bills</h2>
          <Link
            to="/branch/reports"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View all <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Invoice</th>
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {myBills.slice(0, 8).map((b) => (
              <tr key={b.id} className="border-b border-border/60 transition hover:bg-muted/50">
                <td className="px-5 py-3 font-medium">{b.number}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.customer ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{fmtDate(b.createdAt)}</td>
                <td className="px-5 py-3 text-right num">{fmtMoney(b.total)}</td>
              </tr>
            ))}
            {myBills.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No bills yet. Create your first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
