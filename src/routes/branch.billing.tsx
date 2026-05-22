import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore, fmtMoney, type Bill, type BillItem } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { Plus, Minus, Trash2, X, Printer, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/branch/billing")({ component: NewBill });

function NewBill() {
  const { session, branches, products, addBill } = useStore();
  const branch = branches.find((b) => b.id === session?.branchId);
  const mine = products.filter((p) => p.branchId === session?.branchId);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [taxPercent, setTaxPercent] = useState(5);
  const [issued, setIssued] = useState<Bill | null>(null);

  const filtered = useMemo(
    () =>
      mine
        .filter(
          (p) =>
            query === "" ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8),
    [mine, query],
  );

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = +(subtotal * (taxPercent / 100)).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const addItem = (productId: string) => {
    const p = mine.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing)
        return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) setItems((prev) => prev.filter((i) => i.productId !== id));
    else setItems((prev) => prev.map((i) => (i.productId === id ? { ...i, qty } : i)));
  };

  const issue = async () => {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    const bill = await addBill({
      branchId: session!.branchId!,
      customer: customer || "Walk-in",
      paymentMethod,
      items,
      subtotal,
      tax,
      total,
    });
    if (bill) {
      setIssued(bill);
      setItems([]);
      setCustomer("");
      toast.success(`Bill ${bill.number} created`);
    } else {
      toast.error("Failed to create bill");
    }
  };

  return (
    <>
      {/* Print-only wrapper: hidden on screen, shown during print */}
      {issued && (
        <div className="print-only-wrapper">
          <InvoiceDocument bill={issued} branch={branch} />
        </div>
      )}

      <PageHeader
        eyebrow="Point of sale"
        title="New bill"
        description="Fast, distraction-free billing."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: product picker */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search products by name or SKU…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ink"
              />
            </div>
          </div>
          <ul className="divide-y divide-border/60">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => addItem(p.id)}
                  disabled={p.stock <= 0}
                  className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition hover:bg-muted/50 disabled:opacity-40"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground num">
                      {p.sku} · {p.stock} in stock
                    </div>
                  </div>
                  <div className="shrink-0 num text-sm">{fmtMoney(p.price)}</div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No products found.
              </li>
            )}
          </ul>
        </div>

        {/* Right: cart */}
        <aside className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Current bill
            </div>
            <input
              placeholder="Customer name (optional)"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mt-2 w-full border-b border-border bg-transparent py-1.5 text-sm outline-none focus:border-ink"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-3 w-full rounded-md border border-border bg-transparent py-2 px-2 text-sm outline-none focus:border-ink"
            >
              {(import.meta.env.VITE_PAYMENT_METHODS || "Cash,Card,UPI").split(",").map(pm => (
                <option key={pm} value={pm.trim()}>{pm.trim()}</option>
              ))}
            </select>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {items.length === 0 && (
              <div className="px-5 py-16 text-center text-sm text-muted-foreground">
                Add items to begin.
              </div>
            )}
            {items.map((it) => (
              <div
                key={it.productId}
                className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3 sm:flex-nowrap sm:px-5"
              >
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <div className="truncate text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground num">{fmtMoney(it.price)}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQty(it.productId, it.qty - 1)}
                    className="rounded-md border border-border p-1 hover:bg-accent"
                  >
                    <Minus className="size-3" />
                  </button>
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) => setQty(it.productId, +e.target.value || 0)}
                    className="w-12 rounded-md border border-border bg-background px-1 py-0.5 text-center text-sm num"
                  />
                  <button
                    onClick={() => setQty(it.productId, it.qty + 1)}
                    className="rounded-md border border-border p-1 hover:bg-accent"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
                <div className="ml-auto w-20 text-right text-sm num sm:ml-0 sm:w-16">
                  {fmtMoney(it.price * it.qty)}
                </div>
                <button
                  onClick={() => setQty(it.productId, 0)}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border p-5 text-sm">
            <Row label="Subtotal" value={fmtMoney(subtotal)} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Tax</span>
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(+e.target.value || 0)}
                  className="w-16 rounded-md border border-border bg-background px-2 py-0.5 text-center text-xs num outline-none focus:border-ink"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
              <span className="num">{fmtMoney(tax)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="font-display text-2xl num sm:text-3xl">{fmtMoney(total)}</span>
            </div>
            <button
              onClick={issue}
              disabled={items.length === 0}
              className="mt-3 w-full rounded-md bg-ink py-3 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
            >
              Issue bill
            </button>
          </div>
        </aside>
      </div>

      {/* Screen modal – hidden during print via no-print */}
      {issued && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm no-print"
          onClick={() => setIssued(null)}
        >
          <div className="mx-auto my-8 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-md bg-paper px-3 py-1.5 text-sm text-ink hover:opacity-90"
              >
                <Printer className="size-4" /> Print
              </button>
              <button
                onClick={() => setIssued(null)}
                className="rounded-md bg-paper p-1.5 text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <InvoiceDocument bill={issued} branch={branch} />
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}
