import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/inventory")({ component: AdminInventory });

function AdminInventory() {
  const { branches, products } = useStore();

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Inventory"
        description="Branch-by-branch view with low-stock signals."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {branches.map((b) => {
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
                        <div className={`text-sm num ${low ? "text-destructive" : ""}`}>
                          {p.stock} <span className="text-muted-foreground text-xs">in stock</span>
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
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
