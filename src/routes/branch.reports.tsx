import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, fmtMoney, fmtDate, type Bill } from "@/lib/store";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { X, Printer } from "lucide-react";

export const Route = createFileRoute("/branch/reports")({ component: BranchReports });

function BranchReports() {
  const { session, branches, bills } = useStore();
  const branch = branches.find((b) => b.id === session?.branchId);
  const mine = bills.filter((b) => b.branchId === session?.branchId);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [viewing, setViewing] = useState<Bill | null>(null);

  const filtered = useMemo(() => mine.filter((b) => {
    const t = new Date(b.createdAt).getTime();
    if (from && t < new Date(from).getTime()) return false;
    if (to && t > new Date(to).getTime() + 86400000) return false;
    return true;
  }), [mine, from, to]);

  const revenue = filtered.reduce((s, b) => s + b.total, 0);
  const avg = filtered.length ? revenue / filtered.length : 0;

  return (
    <>
      <PageHeader eyebrow="History" title="Bills & Reports" description="Your branch's billing history." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Bills" value={String(filtered.length)} />
        <Stat label="Revenue" value={fmtMoney(revenue)} />
        <Stat label="Avg ticket" value={fmtMoney(avg)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <div className="ml-auto self-center text-xs text-muted-foreground">Tap any row to preview & print</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Invoice</th>
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Items</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} onClick={() => setViewing(b)} className="cursor-pointer border-b border-border/60 transition hover:bg-muted/50">
                <td className="px-5 py-3 font-medium">{b.number}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.customer ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{fmtDate(b.createdAt)}</td>
                <td className="px-5 py-3 text-right num">{b.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td className="px-5 py-3 text-right num">{fmtMoney(b.total)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No bills yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm no-print" onClick={() => setViewing(null)}>
          <div className="mx-auto my-8 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-between">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-1.5 text-sm text-ink hover:opacity-90">
                <Printer className="size-4" /> Print
              </button>
              <button onClick={() => setViewing(null)} className="rounded-md bg-paper p-1.5 text-ink"><X className="size-4" /></button>
            </div>
            <InvoiceDocument bill={viewing} branch={branch} />
          </div>
        </div>
      )}
    </>
  );
}
