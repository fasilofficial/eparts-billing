import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { useStore, fmtMoney, type ReturnRecord } from "@/lib/store";
import { RotateCcw, SlidersHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

const today = () => new Date().toISOString().slice(0, 10);

const statusColors: Record<string, string> = {
  Open: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50",
  Approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  Refunded:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50",
  Rejected:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
};

export function ReturnsPage({
  mode,
  type,
}: {
  mode: "admin" | "branch";
  type: "Sale" | "Purchase";
}) {
  const { session, branches, returns, addReturn, updateReturn, deleteReturn } = useStore();
  const confirm = useConfirm();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin
    ? session?.defaultBranchId || branches[0]?.id || ""
    : session?.branchId || "";
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);
  const [status, setStatus] = useState("All Status");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReturnRecord | null>(null);

  const scoped = useMemo(
    () =>
      returns.filter((r) => {
        if (r.type !== type) return false;
        if (!isAdmin && r.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && r.branchId !== branchFilter) return false;
        if (status !== "All Status" && r.status !== status) return false;
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        return `${r.number} ${r.partyName}`.toLowerCase().includes(query.toLowerCase());
      }),
    [branchFilter, fromDate, isAdmin, query, returns, session?.branchId, status, toDate, type],
  );

  const title = type === "Sale" ? "Sale Returns" : "Purchase Returns";
  const partyLabel = type === "Sale" ? "Customer" : "Supplier";

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title={title}
        description={`Manage and track returned products and refunds for ${type.toLowerCase()}s.`}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90"
            >
              <Plus className="size-4" />
              New Return
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          placeholder={`Search by return # or ${partyLabel.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3.5 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {isAdmin && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ink sm:w-auto"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <div className="text-xs text-muted-foreground sm:ml-auto">
          {scoped.length} returns found
        </div>
      </div>

      {scoped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/50 text-muted-foreground">
            <RotateCcw className="size-6 animate-pulse" />
          </div>
          <h2 className="mt-4 text-base font-semibold">No returns found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {type === "Sale"
              ? "Customer returns will appear here"
              : "Supplier returns will appear here"}
          </p>
        </div>
      ) : (
        <div className="responsive-table rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border bg-muted/20">
                <th className="px-5 py-3.5 text-left font-semibold">Return #</th>
                <th className="px-5 py-3.5 text-left font-semibold">{partyLabel}</th>
                <th className="px-5 py-3.5 text-left font-semibold">Date</th>
                <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scoped.map((r) => (
                <tr key={r.id} className="border-b border-border/60 transition hover:bg-muted/10">
                  <td className="px-5 py-3.5 font-medium">{r.number}</td>
                  <td className="px-5 py-3.5 font-medium text-foreground/80">{r.partyName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground num">{r.date}</td>
                  <td className="px-5 py-3.5 text-right font-semibold num">{fmtMoney(r.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColors[r.status] || "bg-muted text-muted-foreground border-border"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                        title="Edit return"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !(await confirm({
                              title: "Delete return record?",
                              description: `Are you sure you want to delete return record ${r.number}?`,
                            }))
                          )
                            return;
                          try {
                            await deleteReturn(r.id);
                            toast.success("Return deleted");
                          } catch (e: any) {
                            toast.error(e.message || "Failed to delete return");
                          }
                        }}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"
                        title="Delete return"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filterOpen && (
        <FilterModal
          status={status}
          fromDate={fromDate}
          toDate={toDate}
          onStatus={setStatus}
          onFrom={setFromDate}
          onTo={setToDate}
          onClose={() => setFilterOpen(false)}
          onClear={() => {
            setStatus("All Status");
            setFromDate("");
            setToDate("");
          }}
        />
      )}

      {open && (
        <ReturnDialog
          type={type}
          isAdmin={isAdmin}
          branches={branches}
          defaultBranchId={defaultBranchId}
          initial={editing}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              const payload = isAdmin ? data : { ...data, branchId: session!.branchId! };
              if (editing) {
                await updateReturn(editing.id, payload);
                toast.success("Return updated");
              } else {
                await addReturn(payload);
                toast.success("Return created");
              }
              closeDialog();
            } catch (e: any) {
              toast.error(e.message || "Failed to save return");
            }
          }}
        />
      )}
    </>
  );
}

function FilterModal({
  status,
  fromDate,
  toDate,
  onStatus,
  onFrom,
  onTo,
  onClose,
  onClear,
}: {
  status: string;
  fromDate: string;
  toDate: string;
  onStatus: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
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
          <h2 className="font-display text-2xl">Filters</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent transition">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid gap-4">
          <Select
            label="Status"
            value={status}
            onChange={onStatus}
            options={["All Status", "Open", "Approved", "Refunded", "Rejected"]}
          />
          <Field label="From date" type="date" value={fromDate} onChange={onFrom} />
          <Field label="To date" type="date" value={toDate} onChange={onTo} />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReturnDialog({
  type,
  isAdmin,
  branches,
  defaultBranchId,
  initial,
  onClose,
  onSave,
}: {
  type: "Sale" | "Purchase";
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  defaultBranchId: string;
  initial: ReturnRecord | null;
  onClose: () => void;
  onSave: (data: Omit<ReturnRecord, "id" | "number" | "createdAt">) => void;
}) {
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [partyName, setPartyName] = useState(initial?.partyName ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [amount, setAmount] = useState(String(initial?.amount ?? 0));
  const [status, setStatus] = useState(initial?.status ?? "Open");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      branchId,
      partyName,
      date,
      amount: Number(amount) || 0,
      status,
      type,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">{initial ? "Edit return" : "New return"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent transition">
            <X className="size-4" />
          </button>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          {isAdmin && (
            <Select
              label="Branch *"
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => b.name)}
              values={branches.map((b) => b.id)}
            />
          )}
          <Field
            label={type === "Sale" ? "Customer *" : "Supplier *"}
            value={partyName}
            onChange={setPartyName}
            required
            placeholder={type === "Sale" ? "Enter customer name" : "Enter supplier name"}
          />
          <Field label="Date *" type="date" value={date} onChange={setDate} required />
          <Field label="Amount *" type="number" value={amount} onChange={setAmount} required />
          <Select
            label="Status *"
            value={status}
            onChange={setStatus}
            options={["Open", "Approved", "Refunded", "Rejected"]}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90"
            >
              {initial ? "Save changes" : "Create return"}
            </button>
          </div>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  values,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  values?: string[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
      >
        {options.map((o, i) => (
          <option key={values?.[i] ?? o} value={values?.[i] ?? o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
