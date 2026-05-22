import { useMemo, useState, type FormEvent } from "react";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { useStore, fmtMoney, type AccountTransfer } from "@/lib/store";
import { ArrowLeftRight, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

export function AccountTransfersPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, paymentAccounts, accountTransfers, addAccountTransfer, deleteAccountTransfer } = useStore();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const scoped = useMemo(
    () =>
      accountTransfers.filter(
        (t) =>
          (!isAdmin ? t.branchId === session?.branchId : t.branchId === branchId) &&
          `${t.referenceNumber} ${t.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [accountTransfers, branchId, isAdmin, query, session?.branchId],
  );

  const total = scoped.reduce((sum, t) => sum + t.transferAmount, 0);
  const thisMonthTransfers = scoped.filter((t) => {
    const transferDate = new Date(t.transferDate);
    const now = new Date();
    return transferDate.getMonth() === now.getMonth() && transferDate.getFullYear() === now.getFullYear();
  }).length;
  const avg = scoped.length ? total / scoped.length : 0;

  return (
    <>
      <PageHeader
        title="Account Transfers"
        description="Manage money transfers between your accounts"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft animate-fade-in"
          >
            <Plus className="size-4" /> New Transfer
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
        <Stat label="Total Transfers" value={String(scoped.length)} hint="Number of transactions" />
        <Stat label="Total Amount" value={fmtMoney(total)} hint="Aggregate sum transferred" />
        <Stat label="This Month" value={String(thisMonthTransfers)} hint="Transfers this calendar month" />
        <Stat label="Avg Transfer" value={fmtMoney(avg)} hint="Average transfer value" />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by reference or description..."
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3.5 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {isAdmin && (
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ink w-full sm:w-auto"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <div className="text-xs text-muted-foreground sm:ml-auto">
          {scoped.length} transfers found
        </div>
      </div>

      {scoped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/50 text-muted-foreground">
            <ArrowLeftRight className="size-6 text-muted-foreground animate-pulse" />
          </div>
          <h2 className="mt-4 text-base font-semibold">No transfers found</h2>
          <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first transfer</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft"
          >
            <Plus className="size-4" /> Create First Transfer
          </button>
        </div>
      ) : (
        <div className="responsive-table rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border bg-muted/20">
                <th className="px-5 py-3.5 text-left font-semibold">Reference</th>
                <th className="px-5 py-3.5 text-left font-semibold">From Account</th>
                <th className="px-5 py-3.5 text-left font-semibold">To Account</th>
                <th className="px-5 py-3.5 text-left font-semibold">Date</th>
                <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scoped.map((t) => (
                <tr key={t.id} className="border-b border-border/60 transition hover:bg-muted/10">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-foreground">{t.referenceNumber}</div>
                    {t.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground max-w-xs truncate">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground/80">{t.fromAccountName}</td>
                  <td className="px-5 py-3.5 font-medium text-foreground/80">{t.toAccountName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground num">{t.transferDate}</td>
                  <td className="px-5 py-3.5 text-right font-bold num text-foreground/90">{fmtMoney(t.transferAmount)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete transfer ${t.referenceNumber}?`)) return;
                        try {
                          await deleteAccountTransfer(t.id);
                          toast.success("Transfer deleted");
                        } catch (e: any) {
                          toast.error(e.message || "Failed to delete transfer");
                        }
                      }}
                      className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"
                      title="Delete transfer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <TransferDialog
          isAdmin={isAdmin}
          branches={branches}
          initialBranchId={isAdmin ? branchId : session!.branchId!}
          accounts={paymentAccounts}
          count={accountTransfers.length}
          onClose={() => setOpen(false)}
          onSave={async (data) => {
            try {
              await addAccountTransfer(data);
              toast.success("Transfer created successfully");
              setOpen(false);
            } catch (e: any) {
              toast.error(e.message || "Failed to complete transfer");
            }
          }}
        />
      )}
    </>
  );
}

function TransferDialog({
  isAdmin,
  branches,
  initialBranchId,
  accounts,
  count,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  initialBranchId: string;
  accounts: { id: string; branchId: string; accountName: string; status: string }[];
  count: number;
  onClose: () => void;
  onSave: (data: Omit<AccountTransfer, "id" | "createdAt" | "fromAccountName" | "toAccountName">) => void;
}) {
  const [branchId, setBranchId] = useState(initialBranchId);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("0.00");
  const [transferDate, setTransferDate] = useState(today());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [description, setDescription] = useState("");

  const activeAccounts = useMemo(() => {
    return accounts.filter((a) => a.branchId === branchId && a.status === "Active");
  }, [accounts, branchId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      toast.error("Please select both source and destination accounts");
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error("Source and destination accounts must be different");
      return;
    }
    const amount = Number(transferAmount) || 0;
    if (amount <= 0) {
      toast.error("Transfer amount must be greater than zero");
      return;
    }
    
    const autoRef = referenceNumber.trim() || `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    onSave({
      branchId,
      fromAccountId,
      toAccountId,
      transferAmount: amount,
      transferDate,
      referenceNumber: autoRef,
      description: description.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">New Transfer</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent transition">
            <X className="size-4" />
          </button>
        </div>
        <form className="space-y-5" onSubmit={submit}>
          {isAdmin && (
            <Select
              label="Branch *"
              value={branchId}
              onChange={(val) => {
                setBranchId(val);
                setFromAccountId("");
                setToAccountId("");
              }}
              options={branches.map((b) => b.name)}
              values={branches.map((b) => b.id)}
            />
          )}

          {activeAccounts.length < 2 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Notice:</span> You need at least 2 active accounts in this branch to execute a transfer. Currently, there are only {activeAccounts.length} active account(s) registered.
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-1.5">
              Transfer Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="From Account *"
                value={fromAccountId}
                onChange={(v) => {
                  setFromAccountId(v);
                  if (toAccountId === v) setToAccountId("");
                }}
                options={["Select source account", ...activeAccounts.map((a) => a.accountName)]}
                values={["", ...activeAccounts.map((a) => a.id)]}
              />
              <Select
                label="To Account *"
                value={toAccountId}
                onChange={setToAccountId}
                options={[
                  "Select destination account",
                  ...activeAccounts.filter((a) => a.id !== fromAccountId).map((a) => a.accountName),
                ]}
                values={[
                  "",
                  ...activeAccounts.filter((a) => a.id !== fromAccountId).map((a) => a.id),
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Transfer Amount (INR) *"
                type="number"
                value={transferAmount}
                onChange={setTransferAmount}
                required
                placeholder="0.00"
                helper="Amount to transfer"
              />
              <Field
                label="Transfer Date *"
                type="date"
                value={transferDate}
                onChange={setTransferDate}
                required
              />
              <Field
                label="Reference Number"
                value={referenceNumber}
                onChange={setReferenceNumber}
                placeholder="Auto-generated if empty"
                helper="e.g., TRF-2026-001"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-1.5">
              Additional Information
            </h3>
            <TextArea
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Add a description for this transfer..."
            />
          </div>

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
              disabled={activeAccounts.length < 2}
              className={`rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft ${activeAccounts.length < 2 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Create Transfer
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
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="grid gap-1.5 font-sans">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink w-full"
      />
      {helper && <span className="text-[10px] text-muted-foreground">{helper}</span>}
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
  values: string[];
}) {
  return (
    <label className="grid gap-1.5 font-sans">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink w-full"
      >
        {options.map((o, i) => (
          <option key={values[i]} value={values[i]}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 font-sans">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink w-full"
      />
    </label>
  );
}
