import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, fmtDate, type Branch } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar } from "@/components/ui/BulkActionBar";

export const Route = createFileRoute("/admin/branches")({ component: AdminBranches });

function AdminBranches() {
  const { branches, products, bills, addBranch, updateBranch, deleteBranch, deleteBranches } =
    useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const confirm = useConfirm();

  const branchIds = useMemo(() => branches.map((b) => b.id), [branches]);
  const isAllSelected = branches.length > 0 && branches.every((b) => selectedIds.includes(b.id));
  const isSomeSelected = branches.some((b) => selectedIds.includes(b.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !branchIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...branchIds])));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) return;
    if (
      !(await confirm({
        title: `Delete ${count} branch${count > 1 ? "es" : ""}?`,
        description: `Are you sure you want to delete ${count} selected branch${count > 1 ? "es" : ""}? This action cannot be undone.`,
      }))
    ) {
      return;
    }

    try {
      setIsDeletingBulk(true);
      await deleteBranches(selectedIds);
      toast.success(`${count} branch${count > 1 ? "es" : ""} deleted`);
      setSelectedIds([]);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete selected branches");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Branches"
        description="Create branches and assign credentials for their teams."
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto cursor-pointer"
          >
            <Plus className="size-4" /> New branch
          </button>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        {branches.length > 0 && (
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <Checkbox
              checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectAll}
            />
            <span>Select all branches</span>
          </label>
        )}
        <div className="text-xs text-muted-foreground ml-auto">
          {branches.length} branches
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={branches.length}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={() => setSelectedIds(branchIds)}
        onDelete={handleBulkDelete}
        isDeleting={isDeletingBulk}
        entityLabel="branches"
        className="mb-4"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => {
          const productCount = products.filter((p) => p.branchId === b.id).length;
          const billCount = bills.filter((x) => x.branchId === b.id).length;
          const isSelected = selectedIds.includes(b.id);
          return (
            <article
              key={b.id}
              className={`group rounded-xl border bg-card p-5 transition shadow-sm ${
                isSelected
                  ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                  : "border-border hover:shadow-soft"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(b.id)}
                      aria-label={`Select ${b.name}`}
                    />
                  </div>
                  <div>
                    <div className="font-display text-2xl leading-tight">{b.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{b.email}</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditing(b);
                      setOpen(true);
                    }}
                    className="rounded-md p-1.5 hover:bg-accent cursor-pointer"
                    aria-label={`Edit ${b.name}`}
                    title="Edit branch"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        await confirm({
                          title: "Delete branch?",
                          description: `Are you sure you want to delete branch ${b.name}?`,
                        })
                      ) {
                        try {
                          await deleteBranch(b.id);
                          toast.success("Branch removed");
                          setSelectedIds((prev) => prev.filter((id) => id !== b.id));
                        } catch (e: any) {
                          toast.error(e.message || "Failed to delete branch");
                        }
                      }
                    }}
                    className="rounded-md p-1.5 text-destructive hover:bg-accent cursor-pointer"
                    aria-label={`Delete ${b.name}`}
                    title="Delete branch"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="num text-lg">{productCount}</div>
                  <div className="text-muted-foreground">Products</div>
                </div>
                <div>
                  <div className="num text-lg">{billCount}</div>
                  <div className="text-muted-foreground">Bills</div>
                </div>
                <div>
                  <div className="text-sm sm:text-lg">{fmtDate(b.createdAt)}</div>
                  <div className="text-muted-foreground">Created</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {open && (
        <BranchDialog
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateBranch(editing.id, data);
                toast.success("Branch updated");
              } else {
                await addBranch(data);
                toast.success("Branch created");
              }
              setOpen(false);
            } catch (e: any) {
              toast.error(e.message || "Operation failed");
            }
          }}
        />
      )}
    </>
  );
}

function BranchDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Branch | null;
  onClose: () => void;
  onSave: (d: Omit<Branch, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");

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
            <h2 className="font-display text-2xl">{initial ? "Edit branch" : "Create branch"}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, email, password, address });
          }}
        >
          <Field label="Branch name" value={name} onChange={setName} required />
          <Field label="Email" value={email} onChange={setEmail} type="email" required />
          <Field label="Password" value={password} onChange={setPassword} type="text" required />
          <Field label="Address (optional)" value={address} onChange={setAddress} />
          <button
            type="submit"
            className="w-full rounded-md bg-ink py-2.5 text-sm text-paper hover:opacity-90"
          >
            {initial ? "Save changes" : "Create branch"}
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
        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink"
      />
    </div>
  );
}
