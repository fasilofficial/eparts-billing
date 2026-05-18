import { useState } from "react";
import { X } from "lucide-react";
import type { Branch, Product } from "@/lib/store";

export type ProductFormValues = Omit<Product, "id">;

export function ProductFormDialog({
  initial,
  branches,
  onClose,
  onSave,
}: {
  initial: Product | null;
  branches: Branch[];
  onClose: () => void;
  onSave: (data: ProductFormValues) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [branchId, setBranchId] = useState(initial?.branchId ?? branches[0]?.id ?? "");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {initial ? "Edit" : "New"}
            </div>
            <h2 className="font-display text-2xl">{initial ? "Edit product" : "Add product"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!branchId) return;
            onSave({ name, sku, price: +price, stock: +stock, category, branchId });
          }}
        >
          <Field label="Name" value={name} onChange={setName} required />
          <Field label="SKU" value={sku} onChange={setSku} required />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Branch</label>
            <select
              required
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Price"
              value={String(price)}
              onChange={(v) => setPrice(+v || 0)}
              type="number"
              required
            />
            <Field
              label="Stock"
              value={String(stock)}
              onChange={(v) => setStock(+v || 0)}
              type="number"
              required
            />
          </div>
          <Field label="Category (optional)" value={category} onChange={setCategory} />
          <button
            type="submit"
            className="w-full rounded-md bg-ink py-2.5 text-sm text-paper hover:opacity-90"
          >
            {initial ? "Save changes" : "Add product"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </div>
  );
}
