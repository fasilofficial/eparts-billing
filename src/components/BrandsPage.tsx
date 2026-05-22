import { useMemo, useState, type FormEvent } from "react";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { useStore, type Brand } from "@/lib/store";
import { Award, Pencil, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function BrandsPage() {
  const { session, brands, addBrand, updateBrand, deleteBrand } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const isAdmin = session?.role === "admin";

  const scoped = useMemo(
    () =>
      brands.filter(
        (b) =>
          b.name.toLowerCase().includes(query.toLowerCase()) &&
          (status === "All" || (status === "Active" ? b.isActive : !b.isActive)),
      ),
    [brands, query, status],
  );

  const total = brands.length;
  const active = brands.filter((b) => b.isActive).length;

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Brands"
        description="Manage your product brand entities globally"
        actions={
          isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft animate-fade-in"
            >
              <Plus className="size-4" /> Add Brand
            </button>
          )
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Stat label="Total Brands" value={String(total)} hint="Registered product brands" />
        <Stat label="Active Brands" value={String(active)} hint="Operational and visible brands" />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand name..."
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3.5 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ink w-full sm:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">
          {scoped.length} brands found
        </div>
      </div>

      {scoped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center animate-fade-in">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/50 text-muted-foreground">
            <Award className="size-6 text-muted-foreground animate-pulse" />
          </div>
          <h2 className="mt-4 text-base font-semibold">No brands found</h2>
          <p className="mt-1 text-sm text-muted-foreground">Global product brands list is currently empty.</p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft"
            >
              <Plus className="size-4" /> Create First Brand
            </button>
          )}
        </div>
      ) : (
        <div className="responsive-table rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border bg-muted/20">
                <th className="px-5 py-3.5 text-left font-semibold">Brand Name</th>
                <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                {isAdmin && <th className="px-5 py-3.5 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {scoped.map((b) => (
                <tr key={b.id} className="border-b border-border/60 transition hover:bg-muted/10">
                  <td className="px-5 py-3.5 font-medium text-foreground">{b.name}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold leading-none ${
                        b.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(b);
                            setOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                          title="Edit brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${b.name}?`)) return;
                            try {
                              await deleteBrand(b.id);
                              toast.success("Brand deleted successfully");
                            } catch (e: any) {
                              toast.error(e.message || "Failed to delete brand");
                            }
                          }}
                          className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"
                          title="Delete brand"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <BrandDialog
          initial={editing}
          onClose={close}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateBrand(editing.id, data);
                toast.success("Brand updated successfully");
              } else {
                await addBrand(data);
                toast.success("Brand created successfully");
              }
              close();
            } catch (e: any) {
              toast.error(e.message || "Failed to save brand");
            }
          }}
        />
      )}
    </>
  );
}

function BrandDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Brand | null;
  onClose: () => void;
  onSave: (data: Omit<Brand, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a brand name");
      return;
    }
    onSave({ name: name.trim(), isActive });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">{initial ? "Edit Brand" : "Add Brand"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent transition">
            <X className="size-4" />
          </button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="grid gap-1.5 font-sans">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Brand Name *</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple, Samsung, Bosch"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink w-full"
            />
          </label>

          <label className="inline-flex items-center gap-2 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border text-ink focus:ring-ink focus:ring-offset-0 size-4 cursor-pointer"
            />
            <span className="text-sm font-medium">Active</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft"
            >
              {initial ? "Save changes" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
