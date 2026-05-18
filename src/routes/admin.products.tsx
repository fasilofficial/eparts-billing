import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore, fmtMoney } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

function AdminProducts() {
  const { products, branches } = useStore();
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

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

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="All products"
        description="Every SKU across every branch."
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
        <div className="text-xs text-muted-foreground sm:ml-auto">{filtered.length} items</div>
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium">SKU</th>
              <th className="px-5 py-3 text-left font-medium">Branch</th>
              <th className="px-5 py-3 text-right font-medium">Stock</th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const br = branches.find((b) => b.id === p.branchId);
              const low = p.stock <= 5;
              return (
                <tr key={p.id} className="border-b border-border/60 transition hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-muted-foreground num">{p.sku}</td>
                  <td className="px-5 py-3 text-muted-foreground">{br?.name ?? "—"}</td>
                  <td className={`px-5 py-3 text-right num ${low ? "text-destructive" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-5 py-3 text-right num">{fmtMoney(p.price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
