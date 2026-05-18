import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { AlertTriangle, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/branch/inventory")({ component: BranchInventory });

function BranchInventory() {
  const { session, products, updateProduct } = useStore();
  const mine = products.filter((p) => p.branchId === session?.branchId);
  const lowCount = mine.filter((p) => p.stock <= 5).length;

  const exportRows = useMemo(
    () =>
      mine.map((p) => [
        p.name,
        p.sku,
        p.category ?? "",
        String(p.stock),
        p.stock <= 5 ? "Yes" : "No",
      ]),
    [mine],
  );

  return (
    <>
      <PageHeader
        eyebrow="Stock"
        title="Inventory"
        description="Adjust stock levels in real time."
        actions={
          <ExportExcelButton
            filename="branch-inventory"
            headers={["Product", "SKU", "Category", "Stock", "Low stock"]}
            rows={exportRows}
          />
        }
      />

      {lowCount > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          {lowCount} items are running low. Consider restocking.
        </div>
      )}

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium">SKU</th>
              <th className="px-5 py-3 text-center font-medium">Adjust</th>
              <th className="px-5 py-3 text-right font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((p) => (
              <InventoryRow
                key={p.id}
                product={p}
                onChange={(stock) => updateProduct(p.id, { stock })}
              />
            ))}
            {mine.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No products in inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InventoryRow({
  product,
  onChange,
}: {
  product: { id: string; name: string; sku: string; stock: number };
  onChange: (n: number) => void;
}) {
  const [val, setVal] = useState(product.stock);
  const set = (n: number) => {
    setVal(n);
    onChange(n);
  };
  return (
    <tr className="border-b border-border/60">
      <td className="px-5 py-3 font-medium">{product.name}</td>
      <td className="px-5 py-3 text-muted-foreground num">{product.sku}</td>
      <td className="px-5 py-3">
        <div className="mx-auto flex w-fit items-center gap-2">
          <button
            type="button"
            onClick={() => set(Math.max(0, val - 1))}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="number"
            value={val}
            onChange={(e) => set(+e.target.value || 0)}
            className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-sm num"
          />
          <button
            type="button"
            onClick={() => set(val + 1)}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </td>
      <td className={`px-5 py-3 text-right num ${val <= 5 ? "text-destructive" : ""}`}>{val}</td>
    </tr>
  );
}
