import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, fmtMoney, fmtDate, type Bill, type BillItem } from "@/lib/store";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { X, Printer, Trash2, Pencil, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

export const Route = createFileRoute("/admin/bills")({ component: AdminBills });

// ── Edit-bill form state ─────────────────────────────────────────────────────
interface EditItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

function billToEditItems(bill: Bill): EditItem[] {
  return bill.items.map((i) => ({
    productId: i.productId ?? "",
    name: i.name,
    price: i.price,
    qty: i.qty,
  }));
}

// ── Edit Bill Modal ──────────────────────────────────────────────────────────
function EditBillModal({
  bill,
  onClose,
}: {
  bill: Bill;
  onClose: () => void;
}) {
  const { updateBill } = useStore();

  const [saleDate, setSaleDate] = useState(bill.saleDate ?? bill.createdAt.slice(0, 10));
  const [customer, setCustomer] = useState(bill.customer ?? "");
  const [paymentMethod, setPaymentMethod] = useState(bill.paymentMethod ?? "Cash");
  const [notes, setNotes] = useState(bill.notes ?? "");
  const [items, setItems] = useState<EditItem[]>(billToEditItems(bill));
  const [saving, setSaving] = useState(false);

  // Computed totals
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal; // simple mode: no taxes/discounts in edit (preserve existing discount)

  const setItemField = <K extends keyof EditItem>(idx: number, key: K, val: EditItem[K]) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      { productId: `manual-${Date.now()}`, name: "", price: 0, qty: 1 },
    ]);

  const handleSave = async () => {
    if (!saleDate) {
      toast.error("Sale date is required.");
      return;
    }
    setSaving(true);
    try {
      await updateBill(bill.id, {
        customer: customer.trim() || "Walk-in Customer",
        saleDate,
        paymentMethod,
        notes: notes.trim() || undefined,
        subtotal,
        total,
        items,
      });
      toast.success("Bill updated successfully.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update bill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto my-8 max-w-2xl rounded-2xl border border-border bg-card shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Edit Bill
            </p>
            <h2 className="text-lg font-bold text-foreground">{bill.number}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Sale Date + Customer */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sale Date *
              </span>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </span>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Walk-in Customer"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full"
              />
            </label>
          </div>

          {/* Payment Method */}
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Method
            </span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full"
            >
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </label>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Items
              </span>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold hover:bg-accent transition"
              >
                <Plus className="size-3" /> Add Row
              </button>
            </div>

            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-center w-24">Qty</th>
                    <th className="px-3 py-2 text-left w-28">Price</th>
                    <th className="px-3 py-2 text-right w-24">Total</th>
                    <th className="px-3 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t border-border/60">
                      <td className="px-3 py-2">
                        <input
                          value={item.name}
                          onChange={(e) => setItemField(idx, "name", e.target.value)}
                          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm focus:border-border focus:bg-background outline-none"
                          placeholder="Item name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="inline-flex items-center gap-1 justify-center w-full">
                          <button
                            type="button"
                            onClick={() =>
                              setItemField(idx, "qty", Math.max(1, item.qty - 1))
                            }
                            className="rounded border border-border p-0.5 hover:bg-accent"
                          >
                            <Minus className="size-3" />
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              setItemField(idx, "qty", Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-10 text-center rounded border border-border bg-background text-sm font-semibold outline-none py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => setItemField(idx, "qty", item.qty + 1)}
                            className="rounded border border-border p-0.5 hover:bg-accent"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            setItemField(idx, "price", Number(e.target.value) || 0)
                          }
                          className="w-full rounded border border-border bg-background px-2 py-0.5 text-sm font-semibold outline-none num"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold num text-foreground/80">
                        {fmtMoney(item.price * item.qty)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="rounded p-1 text-destructive hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-xs text-muted-foreground"
                      >
                        No items. Click "Add Row" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t border-border bg-muted/10">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground"
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold num text-foreground">
                      {fmtMoney(subtotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this bill..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink min-h-20"
            />
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-ink text-paper px-5 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
function AdminBills() {
  const { bills, branches, deleteBill } = useStore();
  const [branchFilter, setBranchFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [viewing, setViewing] = useState<Bill | null>(null);
  const [editing, setEditing] = useState<Bill | null>(null);
  const confirm = useConfirm();

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      if (branchFilter !== "all" && b.branchId !== branchFilter) return false;
      const effectiveDate = b.saleDate || b.createdAt;
      const t = new Date(effectiveDate).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      if (minAmt && b.total < parseFloat(minAmt)) return false;
      if (maxAmt && b.total > parseFloat(maxAmt)) return false;
      return true;
    });
  }, [bills, branchFilter, from, to, minAmt, maxAmt]);

  const totalRevenue = filtered.reduce((s, b) => s + b.total, 0);
  const avgTicket = filtered.length ? totalRevenue / filtered.length : 0;

  const exportRows = useMemo(
    () =>
      filtered.map((b) => {
        const br = branches.find((x) => x.id === b.branchId);
        return [
          b.number,
          br?.name ?? "",
          b.customer ?? "",
          b.paymentMethod ?? "Cash",
          fmtDate(b.createdAt),
          String(b.subtotal),
          String(b.tax),
          String(b.total),
        ];
      }),
    [filtered, branches],
  );

  return (
    <>
      {/* Print-only wrapper: hidden on screen, shown during print */}
      {viewing && (
        <div className="print-only-wrapper">
          <InvoiceDocument
            bill={viewing}
            branch={branches.find((b) => b.id === viewing.branchId)}
          />
        </div>
      )}

      <PageHeader
        eyebrow="Billing"
        title="Bills & Reports"
        description="Every invoice across the network."
        actions={
          <ExportExcelButton
            filename={`bills-report-${new Date().toISOString().split("T")[0]}`}
            headers={[
              "Invoice",
              "Branch",
              "Customer",
              "Payment",
              "Date",
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
        <Stat label="Revenue" value={fmtMoney(totalRevenue)} />
        <Stat label="Avg ticket" value={fmtMoney(avgTicket)} />
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
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
        <input
          type="number"
          placeholder="Min $"
          value={minAmt}
          onChange={(e) => setMinAmt(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Max $"
          value={maxAmt}
          onChange={(e) => setMaxAmt(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Invoice</th>
              <th className="px-5 py-3 text-left font-medium">Branch</th>
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Payment</th>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 text-right font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const br = branches.find((x) => x.id === b.branchId);
              return (
                <tr
                  key={b.id}
                  className="cursor-pointer border-b border-border/60 transition hover:bg-muted/50"
                  onClick={() => setViewing(b)}
                >
                  <td className="px-5 py-3 font-medium">{b.number}</td>
                  <td className="px-5 py-3 text-muted-foreground">{br?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{b.customer ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{b.paymentMethod ?? "Cash"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(b.saleDate || b.createdAt)}</td>
                  <td className="px-5 py-3 text-right num">{fmtMoney(b.total)}</td>
                  <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(b)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent inline-flex items-center"
                        title="Edit Bill"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            await confirm({
                              title: "Delete bill?",
                              description: `Are you sure you want to delete bill ${b.number}? This will restore its items to stock.`,
                            })
                          ) {
                            try {
                              await deleteBill(b.id);
                              toast.success("Bill deleted");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to delete bill");
                            }
                          }
                        }}
                        className="rounded-md p-1 text-destructive hover:bg-accent inline-flex items-center"
                        title="Delete Bill"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No bills match these filters.
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
            <div className="mb-3 flex justify-between text-paper">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const oldTitle = document.title;
                    const safeCustomer = (viewing.customer || "Walk-in").replace(
                      /[^a-z0-9]/gi,
                      "_",
                    );
                    const dateStr = new Date(viewing.createdAt).toISOString().split("T")[0];
                    document.title = `${viewing.number}_${safeCustomer}_${dateStr}`;
                    window.print();
                    setTimeout(() => {
                      document.title = oldTitle;
                    }, 100);
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-1.5 text-sm text-ink hover:opacity-90"
                >
                  <Printer className="size-4" /> Print
                </button>
                <button
                  onClick={() => {
                    setViewing(null);
                    setEditing(viewing);
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-1.5 text-sm text-ink hover:opacity-90"
                >
                  <Pencil className="size-4" /> Edit
                </button>
                <button
                  onClick={async () => {
                    if (
                      await confirm({
                        title: "Delete bill?",
                        description: `Are you sure you want to delete bill ${viewing.number}? This will restore its items to stock.`,
                      })
                    ) {
                      try {
                        await deleteBill(viewing.id);
                        toast.success("Bill deleted");
                        setViewing(null);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed to delete bill");
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90"
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="rounded-md bg-paper p-1.5 text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <InvoiceDocument
              bill={viewing}
              branch={branches.find((b) => b.id === viewing.branchId)}
            />
          </div>
        </div>
      )}

      {editing && (
        <EditBillModal
          bill={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
