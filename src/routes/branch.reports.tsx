import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, fmtMoney, fmtDate, type Bill } from "@/lib/store";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
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

  const filtered = useMemo(
    () =>
      mine.filter((b) => {
        const t = new Date(b.createdAt).getTime();
        if (from && t < new Date(from).getTime()) return false;
        if (to && t > new Date(to).getTime() + 86400000) return false;
        return true;
      }),
    [mine, from, to],
  );

  const revenue = filtered.reduce((s, b) => s + b.total, 0);
  const avg = filtered.length ? revenue / filtered.length : 0;

  const exportRows = useMemo(
    () =>
      filtered.map((b) => [
        b.number,
        b.customer ?? "",
        b.paymentMethod ?? "Cash",
        fmtDate(b.createdAt),
        String(b.items.reduce((s, i) => s + i.qty, 0)),
        String(b.subtotal),
        String(b.tax),
        String(b.total),
      ]),
    [filtered],
  );

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Bills & Reports"
        description="Your branch's billing history."
        actions={
          <ExportExcelButton
            filename={`branch-bills-report-${new Date().toISOString().split('T')[0]}`}
            headers={[
              "Invoice",
              "Customer",
              "Payment",
              "Date",
              "Items",
              "Subtotal",
              "Tax",
              "Total",
            ]}
            rows={exportRows}
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Bills" value={String(filtered.length)} />
        <Stat label="Revenue" value={fmtMoney(revenue)} />
        <Stat label="Avg ticket" value={fmtMoney(avg)} />
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 sm:flex sm:flex-wrap">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="self-center text-xs text-muted-foreground sm:ml-auto">
          Tap any row to preview & print
        </div>
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Invoice</th>
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Payment</th>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Items</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr
                key={b.id}
                onClick={() => setViewing(b)}
                className="cursor-pointer border-b border-border/60 transition hover:bg-muted/50"
              >
                <td className="px-5 py-3 font-medium">{b.number}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.customer ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.paymentMethod ?? "Cash"}</td>
                <td className="px-5 py-3 text-muted-foreground">{fmtDate(b.createdAt)}</td>
                <td className="px-5 py-3 text-right num">
                  {b.items.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td className="px-5 py-3 text-right num">{fmtMoney(b.total)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No bills yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm no-print"
          onClick={() => setViewing(null)}
        >
          <div className="mx-auto my-8 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-between">
              <button
                onClick={() => {
                  const oldTitle = document.title;
                  const safeCustomer = (viewing.customer || "Walk-in").replace(/[^a-z0-9]/gi, '_');
                  const dateStr = new Date(viewing.createdAt).toISOString().split('T')[0];
                  document.title = `${viewing.number}_${safeCustomer}_${dateStr}`;
                  window.print();
                  setTimeout(() => { document.title = oldTitle; }, 100);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-1.5 text-sm text-ink hover:opacity-90"
              >
                <Printer className="size-4" /> Print
              </button>
              <button
                onClick={() => setViewing(null)}
                className="rounded-md bg-paper p-1.5 text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <InvoiceDocument bill={viewing} branch={branch} />
          </div>
        </div>
      )}
    </>
  );
}
