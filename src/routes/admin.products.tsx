import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, fmtMoney, type Product } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import {
  SortableTableHead,
  type SortDirection,
} from "@/components/admin/SortableTableHead";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

type ProductsSearch = {
  edit?: string;
};

export const Route = createFileRoute("/admin/products")({
  validateSearch: (search: Record<string, unknown>): ProductsSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  component: AdminProducts,
});

type SortKey = "stock" | "price";

function AdminProducts() {
  const { products, branches, addProduct, updateProduct, deleteProduct } = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stock");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    if (!search.edit) return;
    const product = products.find((p) => p.id === search.edit);
    if (product) {
      setEditing(product);
      setOpen(true);
    }
  }, [search.edit, products]);

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    navigate({ to: "/admin/products", search: {} });
  };

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (branchFilter === "all" || p.branchId === branchFilter) &&
          (query === "" ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase().includes(query.toLowerCase())),
      ),
    [products, branchFilter, query],
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
      sorted.map((p) => {
        const br = branches.find((b) => b.id === p.branchId);
        return [p.name, p.sku, br?.name ?? "", String(p.stock), String(p.price), p.category ?? ""];
      }),
    [sorted, branches],
  );

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="All products"
        description="Every SKU across every branch."
        actions={
          <>
            <ExportExcelButton
              filename="products-catalog"
              headers={["Product", "SKU", "Branch", "Stock", "Price", "Category"]}
              rows={exportRows}
            />
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90"
            >
              <Plus className="size-4" /> Add product
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input
          placeholder="Search products or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">{sorted.length} items</div>
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium">SKU</th>
              <th className="px-5 py-3 text-left font-medium">Branch</th>
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
            {sorted.map((p) => {
              const br = branches.find((b) => b.id === p.branchId);
              const low = p.stock <= 5;
              return (
                <tr key={p.id} className="group border-b border-border/60 transition hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-muted-foreground num">{p.sku}</td>
                  <td className="px-5 py-3 text-muted-foreground">{br?.name ?? "—"}</td>
                  <td className={`px-5 py-3 text-right num ${low ? "text-destructive" : ""}`}>
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
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete ${p.name}?`)) {
                            deleteProduct(p.id);
                            toast.success("Product removed");
                          }
                        }}
                        className="rounded-md p-1.5 text-destructive hover:bg-accent"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No products match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <ProductFormDialog
          initial={editing}
          branches={branches}
          onClose={closeDialog}
          onSave={(data) => {
            if (editing) {
              updateProduct(editing.id, data);
              toast.success("Product updated");
            } else {
              addProduct(data);
              toast.success("Product added");
            }
            closeDialog();
          }}
        />
      )}
    </>
  );
}
