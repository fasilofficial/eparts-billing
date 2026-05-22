import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { useStore, fmtMoney, type PurchaseCharge, type PurchaseItem, type PurchaseOrder } from "@/lib/store";
import { Pencil, Plus, ScanLine, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = (): PurchaseItem => ({ productName: "", quantity: 1, unitPrice: 0, tax: 0, discountPercent: 0, total: 0 });

export function PurchaseOrdersPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, suppliers, products, purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = useStore();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);

  const scoped = useMemo(
    () =>
      purchaseOrders.filter((po) => {
        if (!isAdmin && po.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && po.branchId !== branchFilter) return false;
        return `${po.number} ${po.supplierName}`.toLowerCase().includes(query.toLowerCase());
      }),
    [branchFilter, isAdmin, purchaseOrders, query, session?.branchId],
  );

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Purchasing"
        title="Purchase orders"
        description="Create branch-aware supplier purchase orders with items, shipping, attachments, and charges."
        actions={<button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"><Plus className="size-4" /> New Purchase Order</button>}
      />
      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input placeholder="Search PO or supplier..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink" />
        {isAdmin && <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"><option value="all">All branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
        <div className="text-xs text-muted-foreground sm:ml-auto">{scoped.length} purchase orders</div>
      </div>
      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground"><tr className="border-b border-border"><th className="px-5 py-3 text-left font-medium">PO</th><th className="px-5 py-3 text-left font-medium">Supplier</th><th className="px-5 py-3 text-left font-medium">Purchase Date</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Grand Total</th><th className="px-5 py-3" /></tr></thead>
          <tbody>
            {scoped.map((po) => (
              <tr key={po.id} className="group border-b border-border/60 transition hover:bg-muted/50">
                <td className="px-5 py-3 font-medium">{po.number}<div className="text-xs text-muted-foreground">{po.items.length} items</div></td>
                <td className="px-5 py-3">{po.supplierName}</td>
                <td className="px-5 py-3 num">{po.purchaseDate}</td>
                <td className="px-5 py-3">{po.status}</td>
                <td className="px-5 py-3 text-right num">{fmtMoney(po.grandTotal)}</td>
                <td className="px-5 py-3 text-right">
                  <button type="button" onClick={() => { setEditing(po); setOpen(true); }} className="rounded-md p-1.5 hover:bg-accent" aria-label="Edit purchase order"><Pencil className="size-3.5" /></button>
                  <button type="button" onClick={async () => { if (!confirm(`Delete ${po.number}?`)) return; try { await deletePurchaseOrder(po.id); toast.success("Purchase order deleted"); } catch (e: any) { toast.error(e.message || "Failed to delete purchase order"); } }} className="rounded-md p-1.5 text-destructive hover:bg-accent" aria-label="Delete purchase order"><Trash2 className="size-3.5" /></button>
                </td>
              </tr>
            ))}
            {scoped.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <PurchaseDialog
          isAdmin={isAdmin}
          branches={branches}
          suppliers={suppliers}
          products={products}
          defaultBranchId={defaultBranchId}
          initial={editing}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              const payload = isAdmin ? data : { ...data, branchId: session!.branchId! };
              if (editing) { await updatePurchaseOrder(editing.id, payload); toast.success("Purchase order updated"); }
              else { await addPurchaseOrder(payload); toast.success(data.status === "Draft" ? "Draft saved" : "Purchase order created"); }
              closeDialog();
            } catch (e: any) { toast.error(e.message || "Failed to save purchase order"); }
          }}
        />
      )}
    </>
  );
}

function PurchaseDialog({ isAdmin, branches, suppliers, products, defaultBranchId, initial, onClose, onSave }: { isAdmin: boolean; branches: { id: string; name: string }[]; suppliers: { id: string; companyName: string; branchId: string }[]; products: { id: string; name: string; sku: string; barcode?: string; sellingPrice?: number; price: number; branchId: string }[]; defaultBranchId: string; initial: PurchaseOrder | null; onClose: () => void; onSave: (data: Omit<PurchaseOrder, "id" | "number" | "createdAt">) => void }) {
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [supplierInput, setSupplierInput] = useState(initial?.supplierName ?? "");
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? today());
  const [expectedDelivery, setExpectedDelivery] = useState(initial?.expectedDelivery ?? "");
  const [items, setItems] = useState<PurchaseItem[]>(initial?.items.length ? initial.items : [emptyItem()]);
  const [attachments, setAttachments] = useState<string[]>(initial?.attachments ?? []);
  const [shippingCharge, setShippingCharge] = useState(String(initial?.shippingCharge ?? 0));
  const [shippingDetails, setShippingDetails] = useState(initial?.shippingDetails ?? "");
  const [charges, setCharges] = useState<PurchaseCharge[]>(initial?.additionalCharges ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const branchSuppliers = suppliers.filter((s) => s.branchId === branchId);
  const branchProducts = products.filter((p) => p.branchId === branchId);
  const subtotal = items.reduce((sum, item) => sum + computeLine(item), 0);
  const chargesTotal = charges.reduce((sum, charge) => sum + (Number(charge.amount) || 0), 0);
  const grandTotal = +(subtotal + (Number(shippingCharge) || 0) + chargesTotal).toFixed(2);

  const updateItem = (index: number, patch: Partial<PurchaseItem>) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, ...patch };
      return { ...next, total: computeLine(next) };
    }));
  };

  const submit = (status: "Draft" | "Created") => {
    const supplier = branchSuppliers.find((s) => s.id === supplierId);
    const supplierName = supplier?.companyName || supplierInput.trim();
    if (!supplierName) { toast.error("Supplier is required"); return; }
    const cleanItems = items.filter((item) => item.productName.trim());
    if (cleanItems.length === 0) { toast.error("Add at least one item"); return; }
    onSave({ branchId, supplierId: supplier?.id, supplierName, purchaseDate, expectedDelivery: expectedDelivery || undefined, attachments, shippingCharge: Number(shippingCharge) || 0, shippingDetails: shippingDetails || undefined, additionalCharges: charges.filter((c) => c.label || c.amount), notes: notes || undefined, subtotal, grandTotal, status, items: cleanItems });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-6xl rounded-xl border border-border bg-card p-6 shadow-paper" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{initial ? "Edit" : "New"}</div><h2 className="font-display text-2xl">{initial ? "Edit purchase order" : "New purchase order"}</h2></div><button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-accent"><X className="size-4" /></button></div>
        <form className="grid gap-5" onSubmit={(e: FormEvent) => e.preventDefault()}>
          {isAdmin && <SelectField label="Branch *" value={branchId} onChange={setBranchId} options={branches.map((b) => b.name)} values={branches.map((b) => b.id)} required />}
          <div className="grid gap-4 sm:grid-cols-3"><ComboSelect label="Supplier *" value={supplierInput} onText={setSupplierInput} selected={supplierId} onSelect={setSupplierId} options={branchSuppliers.map((s) => ({ id: s.id, label: s.companyName }))} /><Field label="Purchase date *" type="date" value={purchaseDate} onChange={setPurchaseDate} required /><Field label="Expected delivery" type="date" value={expectedDelivery} onChange={setExpectedDelivery} /></div>
          <div className="responsive-table rounded-xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground"><tr className="border-b border-border"><th className="px-3 py-2">#</th><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit Price</th><th className="px-3 py-2">Tax</th><th className="px-3 py-2">Disc %</th><th className="px-3 py-2 text-right">Total</th><th /></tr></thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-border/60">
                    <td className="px-3 py-2 num">{index + 1}</td>
                    <td className="px-3 py-2"><ProductPicker item={item} products={branchProducts} onChange={(patch) => updateItem(index, patch)} /></td>
                    <td className="px-3 py-2"><MiniInput type="number" value={String(item.quantity)} onChange={(value) => updateItem(index, { quantity: Number(value) || 1 })} /></td>
                    <td className="px-3 py-2"><MiniInput type="number" value={String(item.unitPrice)} onChange={(value) => updateItem(index, { unitPrice: Number(value) || 0 })} /></td>
                    <td className="px-3 py-2"><MiniInput type="number" value={String(item.tax)} onChange={(value) => updateItem(index, { tax: Number(value) || 0 })} /></td>
                    <td className="px-3 py-2"><MiniInput type="number" value={String(item.discountPercent)} onChange={(value) => updateItem(index, { discountPercent: Number(value) || 0 })} /></td>
                    <td className="px-3 py-2 text-right num">{fmtMoney(computeLine(item))}</td>
                    <td className="px-3 py-2 text-right"><button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} className="rounded-md p-1.5 text-destructive hover:bg-accent"><Trash2 className="size-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])} className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"><Plus className="size-4" /> Add item</button>
          <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">Attachments</span><input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setAttachments(Array.from(e.target.files || []).map((file) => file.name))} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />{attachments.length > 0 && <span className="text-xs text-muted-foreground">{attachments.length} files selected</span>}</label>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Shipping charge" type="number" step="0.01" value={shippingCharge} onChange={setShippingCharge} /><Field label="Shipping details" value={shippingDetails} onChange={setShippingDetails} /></div>
          <div className="grid gap-2">{charges.map((charge, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]"><Field label="Charge label" value={charge.label} onChange={(value) => setCharges((prev) => prev.map((c, i) => i === index ? { ...c, label: value } : c))} /><Field label="Amount" type="number" step="0.01" value={String(charge.amount)} onChange={(value) => setCharges((prev) => prev.map((c, i) => i === index ? { ...c, amount: Number(value) || 0 } : c))} /><button type="button" onClick={() => setCharges((prev) => prev.filter((_, i) => i !== index))} className="self-end rounded-md p-2 text-destructive hover:bg-accent"><Trash2 className="size-4" /></button></div>)}<button type="button" onClick={() => setCharges((prev) => [...prev, { label: "", amount: 0 }])} className="w-fit rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">+ Add Charge</button></div>
          <TextArea label="Notes" value={notes} onChange={setNotes} />
          <div className="ml-auto w-full max-w-sm rounded-xl border border-border bg-background p-4 text-sm"><Row label="Subtotal" value={fmtMoney(subtotal)} /><Row label="Shipping" value={fmtMoney(Number(shippingCharge) || 0)} /><Row label="Additional charges" value={fmtMoney(chargesTotal)} /><div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold"><span>Grand Total</span><span className="num">{fmtMoney(grandTotal)}</span></div></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button><button type="button" onClick={() => submit("Draft")} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Save as Draft</button><button type="button" onClick={() => submit("Created")} className="rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90">Create Purchase</button></div>
        </form>
      </div>
    </div>
  );
}

const computeLine = (item: PurchaseItem) => {
  const base = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  const tax = Number(item.tax) || 0;
  const discount = base * ((Number(item.discountPercent) || 0) / 100);
  return +(base + tax - discount).toFixed(2);
};

function ProductPicker({ item, products, onChange }: { item: PurchaseItem; products: { id: string; name: string; sku: string; barcode?: string; sellingPrice?: number; price: number }[]; onChange: (patch: Partial<PurchaseItem>) => void }) {
  const id = "purchase-product-options";
  const selectProduct = (value: string) => {
    const product = products.find((p) => p.name === value || p.sku === value || p.barcode === value);
    if (product) onChange({ productId: product.id, productName: product.name, unitPrice: product.sellingPrice ?? product.price });
    else onChange({ productName: value, productId: undefined });
  };
  return <div className="relative"><input list={id} value={item.productName} onChange={(e) => selectProduct(e.target.value)} className="w-full rounded-md border border-border bg-card px-2 py-1.5 pr-8 text-sm outline-none focus:border-ink" /><ScanLine className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><datalist id={id}>{products.map((product) => <option key={product.id} value={product.name}>{product.sku}</option>)}</datalist></div>;
}
function ComboSelect({ label, value, onText, selected, onSelect, options }: { label: string; value: string; onText: (value: string) => void; selected: string; onSelect: (value: string) => void; options: { id: string; label: string }[] }) {
  const id = `${label}-options`;
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><input required list={id} value={value} onChange={(e) => { const match = options.find((o) => o.label === e.target.value); onSelect(match?.id ?? ""); onText(e.target.value); }} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" /><datalist id={id}>{options.map((option) => <option key={option.id} value={option.label} />)}</datalist>{selected && <span className="text-xs text-muted-foreground">Existing supplier selected</span>}</label>;
}
function Field({ label, value, onChange, type = "text", required, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><input type={type} step={step} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" /></label>;
}
function SelectField({ label, value, onChange, options, values, required }: { label: string; value: string; onChange: (value: string) => void; options: string[]; values?: string[]; required?: boolean }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"><option value="">Select</option>{options.map((option, index) => <option key={values?.[index] ?? option} value={values?.[index] ?? option}>{option}</option>)}</select></label>;
}
function MiniInput({ value, onChange, type = "text" }: { value: string; onChange: (value: string) => void; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-sm outline-none focus:border-ink" />;
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" /></label>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between py-1"><span className="text-muted-foreground">{label}</span><span className="num">{value}</span></div>;
}
