import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { AlertTriangle, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/inventory")({ component: AdminInventory });

function AdminInventory() {
  const { branches, products } = useStore();
  const [branchFilter, setBranchFilter] = useState("all");

  const visibleBranches = useMemo(
    () => (branchFilter === "all" ? branches : branches.filter((b) => b.id === branchFilter)),
    [branches, branchFilter],
  );

  const exportRows = useMemo(() => {
    const rows: string[][] = [];
    visibleBranches.forEach((b) => {
      products
        .filter((p) => p.branchId === b.id)
        .forEach((p) => {
          rows.push([
            b.name,
            p.name,
            p.sku,
            p.category ?? "",
            String(p.stock),
            p.stock <= 5 ? "Yes" : "No",
          ]);
        });
    });
    return rows;
  }, [visibleBranches, products]);

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Inventory"
        description="Branch-by-branch view with low-stock signals."
        actions={
          <ExportExcelButton
            filename="inventory-report"
            headers={["Branch", "Product", "SKU", "Category", "Stock", "Low stock"]}
            rows={exportRows}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {visibleBranches.map((b) => {
          const items = products.filter((p) => p.branchId === b.id);
          const lowCount = items.filter((p) => p.stock <= 5).length;
          return (
            <section key={b.id} className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <div className="font-display text-xl">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{items.length} SKUs</div>
                </div>
                {lowCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-[11px] text-destructive">
                    <AlertTriangle className="size-3" /> {lowCount} low
                  </span>
                )}
              </div>
              <ul>
                {items.map((p) => {
                  const low = p.stock <= 5;
                  const pct = Math.max(0, Math.min(100, (p.stock / 30) * 100));
                  return (
                    <li key={p.id} className="border-b border-border/60 px-5 py-3 last:border-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground num">{p.sku}</div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <div className={`text-sm num ${low ? "text-destructive" : ""}`}>
                            {p.stock}{" "}
                            <span className="text-xs text-muted-foreground">in stock</span>
                          </div>
                          <Link
                            to="/admin/products"
                            search={{ edit: p.id }}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] transition hover:bg-accent"
                          >
                            <Pencil className="size-3" />
                            Update stock
                          </Link>
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className={`h-full ${low ? "bg-destructive" : "bg-ink"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-muted-foreground">No products.</li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
