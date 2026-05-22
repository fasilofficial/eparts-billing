import { useMemo, useState } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { InvoiceDocument } from "@/components/InvoiceDocument";
import { useStore, fmtMoney, type Bill, type BillItem } from "@/lib/store";
import {
  Minus,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
  UserRound,
  ArrowLeft,
  ShoppingCart,
  QrCode,
  Check,
  Coins,
  Wallet,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface ExtendedBillItem {
  productId: string;
  name: string;
  sku?: string;
  price: number;
  qty: number;
  taxPercent: number;
  discountType: "%" | "₹";
  discountValue: number;
}

const todayFormatted = () => {
  const date = new Date();
  return date.toISOString().slice(0, 10);
};

export function BillingPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, products, customers, paymentAccounts, addBill } = useStore();
  const isAdmin = mode === "admin";
  const [branchId, setBranchId] = useState(
    isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "",
  );
  
  // Sale details state
  const [saleDate, setSaleDate] = useState(todayFormatted());
  const [dueDate, setDueDate] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string;
    name: string;
    phone: string;
  } | null>(null);
  
  // Dialog Open States
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const branch = branches.find((b) => b.id === branchId);
  const branchProducts = products.filter((p) => p.branchId === branchId);
  const branchCustomers = customers.filter((c) => c.branchId === branchId);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ExtendedBillItem[]>([]);
  const [notes, setNotes] = useState("");
  const [orderDiscountType, setOrderDiscountType] = useState<"Percentage" | "Fixed">("Percentage");
  const [orderDiscountValue, setOrderDiscountValue] = useState("0");
  
  // Payment Modal parameters
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Other">("Cash");
  const [amountToCollect, setAmountToCollect] = useState("0.00");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [notesOptional, setNotesOptional] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm
  });

  const [issued, setIssued] = useState<Bill | null>(null);

  // Filtered products list for product search dropdown
  const filteredProducts = useMemo(
    () =>
      branchProducts
        .filter(
          (p) =>
            p.isActive &&
            (query === "" ||
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.sku.toLowerCase().includes(query.toLowerCase())),
        )
        .slice(0, 5),
    [branchProducts, query],
  );

  // Active accounts depending on selected payment method type
  const activeAccounts = useMemo(() => {
    return paymentAccounts.filter(
      (a) =>
        a.branchId === branchId &&
        a.status === "Active" &&
        (paymentMethod === "Cash" ? a.accountType === "Cash" : a.accountType !== "Cash"),
    );
  }, [paymentAccounts, branchId, paymentMethod]);

  // Handle auto-selection of accounts when activeAccounts list updates
  useMemo(() => {
    if (activeAccounts.length > 0) {
      setSelectedAccountId(activeAccounts[0].id);
    } else {
      setSelectedAccountId("");
    }
  }, [activeAccounts]);

  // Filtered customer list for Customer Selection Modal
  const filteredCustomers = useMemo(
    () =>
      branchCustomers.filter(
        (c) =>
          customerSearchQuery === "" ||
          c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
          c.phone.includes(customerSearchQuery),
      ),
    [branchCustomers, customerSearchQuery],
  );

  // Calculations
  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const itemBase = item.price * item.qty;
      const itemDiscount =
        item.discountType === "%"
          ? itemBase * (item.discountValue / 100)
          : item.discountValue;
      const subtotalAfterDiscount = Math.max(0, itemBase - itemDiscount);
      const itemTax = subtotalAfterDiscount * (item.taxPercent / 100);
      const total = subtotalAfterDiscount + itemTax;
      return {
        ...item,
        itemDiscount,
        itemTax,
        total,
      };
    });
  }, [items]);

  const itemsSubtotal = calculatedItems.reduce((s, it) => s + (it.price * it.qty - it.itemDiscount), 0);
  const itemsTax = calculatedItems.reduce((s, it) => s + it.itemTax, 0);

  const orderDiscount = useMemo(() => {
    const val = Number(orderDiscountValue) || 0;
    if (orderDiscountType === "Percentage") {
      return itemsSubtotal * (val / 100);
    }
    return val;
  }, [itemsSubtotal, orderDiscountType, orderDiscountValue]);

  const grandTotal = Math.max(0, itemsSubtotal - orderDiscount + itemsTax);

  const addItem = (productId: string) => {
    const product = branchProducts.find((x) => x.id === productId);
    if (!product) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: 1,
          taxPercent: 0,
          discountType: "%",
          discountValue: 0,
        },
      ];
    });
    setQuery("");
  };

  const removeQty = (id: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== id));
  };

  const setItemProperty = <K extends keyof ExtendedBillItem>(
    productId: string,
    key: K,
    val: ExtendedBillItem[K],
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [key]: val } : i)),
    );
  };

  const openPaymentCollector = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first.");
      setCustModalOpen(true);
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item to proceed.");
      return;
    }
    setAmountToCollect(grandTotal.toFixed(2));
    setPaymentModalOpen(true);
  };

  const completeSale = async () => {
    if (!branchId) {
      toast.error("Select a branch");
      return;
    }
    try {
      const bill = await addBill({
        branchId,
        customer: selectedCustomer?.name || "Walk-in Customer",
        customerId: selectedCustomer?.id,
        paymentMethod: paymentMethod === "Cash" ? "Cash" : "Other",
        saleDate,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        discountType: orderDiscountType,
        discountAmount: orderDiscount,
        subtotal: itemsSubtotal,
        tax: itemsTax,
        total: grandTotal,
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          qty: it.qty,
        })),
      });

      if (bill) {
        setIssued(bill);
        setItems([]);
        setSelectedCustomer(null);
        setNotes("");
        setDueDate("");
        setOrderDiscountValue("0");
        setPaymentModalOpen(false);
        toast.success(`Sale Completed successfully! Bill ${bill.number} generated.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to complete sale");
    }
  };

  const selectQuickWalkin = () => {
    setSelectedCustomer({
      name: "Walk-in Customer",
      phone: "0000000000",
    });
    setCustModalOpen(false);
  };

  return (
    <>
      {issued && (
        <div className="print-only-wrapper">
          <InvoiceDocument bill={issued} branch={branches.find((b) => b.id === issued.branchId)} />
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg p-2 hover:bg-accent border border-border bg-card transition"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">New Sale</h1>
            <div className="text-xs text-muted-foreground">
              {new Date(saleDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition">
            Drafts
          </button>
          <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent transition">
            Save as Draft
          </button>
          <button
            onClick={openPaymentCollector}
            className="rounded-lg bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold shadow-soft hover:bg-indigo-700 transition"
          >
            Complete Sale
          </button>
        </div>
      </div>

      <div className="space-y-6 animate-fade-in">
        {/* Customer and Dates Box */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Customer select box */}
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Customer *</span>
              {!selectedCustomer ? (
                <div
                  onClick={() => setCustModalOpen(true)}
                  className="flex items-center justify-between border border-border rounded-xl p-3.5 bg-background hover:bg-accent/40 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-accent text-muted-foreground">
                      <UserRound className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground/80">Select Customer</div>
                      <div className="text-xs text-muted-foreground">Click to choose</div>
                    </div>
                  </div>
                  <Plus className="size-4 text-muted-foreground" />
                </div>
              ) : (
                <div
                  onClick={() => setCustModalOpen(true)}
                  className="flex items-center justify-between border border-emerald-300 rounded-xl p-3.5 bg-emerald-50/40 hover:bg-emerald-50/70 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-emerald-500 text-white font-bold text-base shadow-sm">
                      {selectedCustomer.name[0]?.toUpperCase() || "W"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-900">{selectedCustomer.name}</div>
                      <div className="text-xs text-emerald-700">{selectedCustomer.phone}</div>
                    </div>
                  </div>
                  <Check className="size-4 text-emerald-600 font-bold" />
                </div>
              )}
            </div>

            {/* Sale Date */}
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sale Date *</span>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-ink w-full"
              />
            </label>

            {/* Due Date */}
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none focus:border-ink w-full"
              />
            </label>
          </div>
        </div>

        {/* Sale Items Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="bg-muted/10 px-5 py-4 border-b border-border/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Sale Items</h2>
            {isAdmin && (
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setItems([]);
                }}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-ink"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Search bar row */}
          <div className="p-4 border-b border-border bg-background/50 flex gap-2 relative">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search and select product to add to sale..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:border-ink"
              />
              
              {/* Product search suggestions */}
              {query && (
                <ul className="absolute left-0 right-0 top-full mt-2 z-40 bg-card border border-border rounded-xl shadow-paper overflow-hidden divide-y divide-border">
                  {filteredProducts.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => addItem(p.id)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                        </div>
                        <div className="text-sm font-semibold">{fmtMoney(p.price)}</div>
                      </button>
                    </li>
                  ))}
                  {filteredProducts.length === 0 && (
                    <li className="px-4 py-4 text-center text-sm text-muted-foreground">
                      No matching products found.
                    </li>
                  )}
                </ul>
              )}
            </div>
            <button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 shadow-soft transition shrink-0">
              <QrCode className="size-4" />
            </button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent/40 text-muted-foreground animate-bounce">
                <ShoppingCart className="size-6 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground/80">No items added yet</h3>
              <p className="text-xs text-muted-foreground">Search and select products above to add them to this sale</p>
            </div>
          ) : (
            <div className="responsive-table">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/10 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">#</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-center w-32">Quantity</th>
                    <th className="px-4 py-3 text-left w-32">Unit Price</th>
                    <th className="px-4 py-3 text-left w-32">Tax</th>
                    <th className="px-4 py-3 text-left w-40">Discount</th>
                    <th className="px-4 py-3 text-right w-32">Total</th>
                    <th className="px-4 py-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item, idx) => (
                    <tr key={item.productId} className="border-b border-border/60 hover:bg-muted/10 transition">
                      <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 place-items-center rounded bg-accent/50 text-muted-foreground shrink-0">
                            <ShoppingCart className="size-4" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{item.name}</div>
                            {item.sku && <div className="text-[10px] text-muted-foreground">SKU: {item.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setItemProperty(item.productId, "qty", Math.max(1, item.qty - 1))}
                            className="rounded-md border border-border p-1 hover:bg-accent"
                          >
                            <Minus className="size-3" />
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => setItemProperty(item.productId, "qty", Math.max(1, Number(e.target.value) || 1))}
                            className="w-12 rounded-md border border-border bg-background py-1 text-center text-sm font-semibold num"
                          />
                          <button
                            type="button"
                            onClick={() => setItemProperty(item.productId, "qty", item.qty + 1)}
                            className="rounded-md border border-border p-1 hover:bg-accent"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => setItemProperty(item.productId, "price", Number(e.target.value) || 0)}
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm font-semibold num"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.taxPercent}
                          onChange={(e) => setItemProperty(item.productId, "taxPercent", Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
                        >
                          <option value="0">No Tax</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <select
                            value={item.discountType}
                            onChange={(e) => setItemProperty(item.productId, "discountType", e.target.value as "%" | "₹")}
                            className="rounded-md border border-border bg-background px-1 py-1 text-sm outline-none shrink-0"
                          >
                            <option value="%">%</option>
                            <option value="₹">₹</option>
                          </select>
                          <input
                            type="number"
                            value={item.discountValue}
                            onChange={(e) => setItemProperty(item.productId, "discountValue", Number(e.target.value) || 0)}
                            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold num"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold num text-foreground/80">
                        {fmtMoney(item.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeQty(item.productId)}
                          className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition"
                          title="Delete item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sale Notes and Summary Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sale Notes Card */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-foreground">Sale Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions for this sale..."
              className="min-h-36 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ink"
            />
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Summary</h2>
            
            {/* Sale Discount Box */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4 space-y-3 border-dashed">
              <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-emerald-700" />
                Sale Discount
              </div>
              <div className="grid grid-cols-2 gap-2 border border-emerald-200 bg-white rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setOrderDiscountType("Percentage")}
                  className={`rounded-md py-1.5 text-center text-xs font-semibold transition cursor-pointer select-none ${
                    orderDiscountType === "Percentage"
                      ? "bg-emerald-600 text-white"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  Percentage %
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDiscountType("Fixed")}
                  className={`rounded-md py-1.5 text-center text-xs font-semibold transition cursor-pointer select-none ${
                    orderDiscountType === "Fixed"
                      ? "bg-emerald-600 text-white"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  Fixed Amount
                </button>
              </div>
              <input
                type="number"
                value={orderDiscountValue}
                onChange={(e) => setOrderDiscountValue(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-semibold num"
              />
            </div>

            <div className="space-y-2.5 pt-2 text-sm border-t border-border/80">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-semibold text-foreground num">{fmtMoney(itemsSubtotal)}</span>
              </div>
              {orderDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Order Discount:</span>
                  <span className="font-semibold num">-{fmtMoney(orderDiscount)}</span>
                </div>
              )}
              {itemsTax > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tax:</span>
                  <span className="font-semibold text-foreground num">{fmtMoney(itemsTax)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-border/60">
                <span className="font-bold text-foreground">Grand Total:</span>
                <span className="font-display text-3xl font-bold text-indigo-600 num">
                  {fmtMoney(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Customer Dialog */}
      {custModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => setCustModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Select Customer</h2>
              <button
                onClick={() => setCustModalOpen(false)}
                className="rounded-lg p-1.5 hover:bg-accent transition"
              >
                <X className="size-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Quick walkin customer option button */}
              <button
                onClick={selectQuickWalkin}
                className="w-full text-center border border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 text-indigo-700 rounded-xl py-3 text-sm font-semibold transition cursor-pointer select-none"
              >
                Quick sale without customer details
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search customer by name or phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-ink"
                />
              </div>

              <ul className="max-h-60 overflow-y-auto divide-y divide-border/60 border border-border rounded-xl">
                {filteredCustomers.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelectedCustomer({
                          id: c.id,
                          name: c.name,
                          phone: c.phone,
                        });
                        setCustModalOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-sm text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {c.type}
                      </span>
                    </button>
                  </li>
                ))}
                {filteredCustomers.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No customers found.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Complete Payment Modal */}
      {paymentModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-paper my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-xl font-bold text-foreground">Complete Payment</h2>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="rounded-lg p-1.5 hover:bg-accent transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Collect Payment Summary card */}
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-2">
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="size-4 text-indigo-600" />
                  Collect Payment
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1.5 border-t border-border/40">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</div>
                    <div className="text-base font-bold num text-foreground">{fmtMoney(grandTotal)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Paid</div>
                    <div className="text-base font-bold num text-emerald-600">{fmtMoney(Number(amountToCollect) || 0)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Balance</div>
                    <div className="text-base font-bold num text-rose-600">
                      {fmtMoney(Math.max(0, grandTotal - (Number(amountToCollect) || 0)))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Select Amount */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Select Amount</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["Full", "Half", "Quarter", "10%", "Custom"] as const).map((opt) => {
                    let active = false;
                    const val = Number(amountToCollect) || 0;
                    if (opt === "Full" && val === grandTotal) active = true;
                    else if (opt === "Half" && val === +(grandTotal / 2).toFixed(2)) active = true;
                    else if (opt === "Quarter" && val === +(grandTotal / 4).toFixed(2)) active = true;
                    else if (opt === "10%" && val === +(grandTotal / 10).toFixed(2)) active = true;
                    else if (opt === "Custom" && val !== grandTotal && val !== +(grandTotal / 2).toFixed(2) && val !== +(grandTotal / 4).toFixed(2) && val !== +(grandTotal / 10).toFixed(2)) active = true;
                    
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (opt === "Full") setAmountToCollect(grandTotal.toFixed(2));
                          else if (opt === "Half") setAmountToCollect((grandTotal / 2).toFixed(2));
                          else if (opt === "Quarter") setAmountToCollect((grandTotal / 4).toFixed(2));
                          else if (opt === "10%") setAmountToCollect((grandTotal / 10).toFixed(2));
                        }}
                        className={`rounded-xl py-2 text-center text-xs font-bold transition cursor-pointer select-none ${
                          active
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "border border-border bg-card text-foreground hover:bg-accent"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount to Collect */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount to Collect *</span>
                <div className="relative rounded-xl border border-emerald-400 bg-emerald-50/10 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-2xl font-semibold text-foreground/70">₹</span>
                  <input
                    type="number"
                    value={amountToCollect}
                    onChange={(e) => setAmountToCollect(e.target.value)}
                    className="w-full text-center text-2xl font-bold bg-transparent outline-none border-none py-1 num"
                  />
                  <div className="text-emerald-600 cursor-pointer p-1">
                    <Plus className="size-4" />
                  </div>
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Method *</span>
                <div className="grid grid-cols-2 gap-3">
                  {(["Cash", "Other"] as const).map((method) => (
                    <div
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`relative border rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none transition ${
                        paymentMethod === method
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <Coins className="size-5 text-indigo-600" />
                      <span className="text-sm font-bold text-foreground">{method}</span>
                      
                      {paymentMethod === method && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5">
                          <Check className="size-2.5 font-bold" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Account */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Payment Account {paymentMethod === "Cash" ? "(Auto-selected)" : ""}
                </span>
                <div
                  className={`rounded-xl border px-3 py-2 bg-background flex items-center justify-between ${
                    paymentMethod === "Cash" && activeAccounts.length > 0
                      ? "border-emerald-400 bg-emerald-50/10"
                      : "border-border"
                  }`}
                >
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none border-none cursor-pointer py-1 text-foreground/80"
                  >
                    {paymentMethod === "Other" && (
                      <option value="">Select Account (Optional)</option>
                    )}
                    {activeAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} - {a.accountType}
                      </option>
                    ))}
                    {activeAccounts.length === 0 && (
                      <option value="">No Active {paymentMethod} Accounts</option>
                    )}
                  </select>
                  {paymentMethod === "Cash" && activeAccounts.length > 0 && (
                    <Check className="size-4 text-emerald-600 font-bold ml-2" />
                  )}
                </div>
              </div>

              {/* Transaction Reference (Other payment type only) */}
              {paymentMethod === "Other" && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Reference</span>
                  <input
                    placeholder="Enter reference number..."
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ink"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes (Optional)</span>
                <textarea
                  placeholder="Add any notes..."
                  value={notesOptional}
                  onChange={(e) => setNotesOptional(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ink min-h-16"
                />
              </div>

              {/* Payment Date */}
              <label className="grid gap-1.5 font-sans">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Date</span>
                <input
                  type="datetime-local"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-ink w-full"
                />
              </label>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="w-full rounded-xl border border-border bg-card py-3 text-center text-sm font-bold text-foreground hover:bg-accent transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={completeSale}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-center text-sm font-bold text-white transition cursor-pointer shadow-soft ${
                    Number(amountToCollect) > 0
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Check className="size-4" />
                  Collect ₹{Number(amountToCollect).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {issued && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm no-print" onClick={() => setIssued(null)}>
          <div className="mx-auto my-8 max-w-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-paper border border-border px-4 py-2 text-sm font-bold text-ink hover:opacity-90 transition shadow-soft"
              >
                <Printer className="size-4" /> Print
              </button>
              <button
                type="button"
                onClick={() => setIssued(null)}
                className="rounded-full bg-paper border border-border p-2 text-ink hover:bg-accent transition"
              >
                <X className="size-4" />
              </button>
            </div>
            <InvoiceDocument bill={issued} branch={branches.find((b) => b.id === issued.branchId)} />
          </div>
        </div>
      )}
    </>
  );
}
