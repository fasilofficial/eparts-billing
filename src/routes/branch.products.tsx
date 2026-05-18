import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, fmtMoney, type Product } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import {
  SortableTableHead,
  type SortDirection,
} from "@/components/admin/SortableTableHead";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/branch/products")({ component: BranchProducts });

type SortKey = "stock" | "price";

function BranchProducts() {
  const { session, products, addProduct, updateProduct, deleteProduct } = useStore();
  const mine = products.filter((p) => p.branchId === session?.branchId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stock");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const filtered = useMemo(
    () =>
      mine.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()),
      ),
    [mine, query],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const exportRows = useMemo(
    () =>
      sorted.map((p) => [p.name, p.sku, String(p.stock), String(p.price), p.category ?? ""]),
    [sorted],
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage the items you sell at this branch."
        actions={
          <>
            <ExportExcelButton
              filename="branch-products"
              headers={["Product", "SKU", "Stock", "Price", "Category"]}
              rows={exportRows}
            />
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
            >
              <Plus className="size-4" /> Add product
            </button>
          </>
        }
      />

      <div className="mb-4">
        <input
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium">SKU</th>
              <SortableTableHead
                label="Stock"
                active={sortKey === "stock"}
                direction={sortDir}
                onClick={() => toggleSort("stock")}
                className="text-right"
              />
              <SortableTableHead
                label="Price"
                active={sortKey === "price"}
                direction={sortDir}
                onClick={() => toggleSort("price")}
                className="text-right"
              />
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                className="group border-b border-border/60 transition hover:bg-muted/50"
              >
                <td className="px-5 py-3 font-medium">{p.name}</td>
                <td className="px-5 py-3 text-muted-foreground num">{p.sku}</td>
                <td
                  className={`px-5 py-3 text-right num ${p.stock <= 5 ? "text-destructive" : ""}`}
                >
                  {p.stock}
                </td>
                <td className="px-5 py-3 text-right num">{fmtMoney(p.price)}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                      className="rounded-md p-1.5 hover:bg-accent"
                      aria-label={`Edit ${p.name}`}
                      title="Edit product"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete?")) {
                          deleteProduct(p.id);
                          toast.success("Removed");
                        }
                      }}
                      className="rounded-md p-1.5 text-destructive hover:bg-accent"
                      aria-label={`Delete ${p.name}`}
                      title="Delete product"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <ProductDialog
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={(data) => {
            if (editing) {
              updateProduct(editing.id, data);
              toast.success("Updated");
            } else {
              addProduct({ ...data, branchId: session!.branchId! });
              toast.success("Added");
            }
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function ProductDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Product | null;
  onClose: () => void;
  onSave: (d: Omit<Product, "id" | "branchId">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [category, setCategory] = useState(initial?.category ?? "");

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
            onSave({ name, sku, price: +price, stock: +stock, category });
          }}
        >
          <Field label="Name" value={name} onChange={setName} required />
          <Field label="SKU" value={sku} onChange={setSku} required />
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
