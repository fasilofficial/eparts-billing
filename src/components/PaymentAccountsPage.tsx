import { useMemo, useState, type FormEvent } from "react";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { useStore, fmtMoney, type PaymentAccount } from "@/lib/store";
import { Banknote, CreditCard, Landmark, Pencil, Plus, Trash2, Wallet, X, Coins, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const accountTypes = ["Bank Account", "Cash", "Card", "UPI", "Cheque", "Other"] as const;

export function PaymentAccountsPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, paymentAccounts, addPaymentAccount, updatePaymentAccount, deletePaymentAccount } = useStore();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);
  const [statusFilter, setStatusFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);

  const scoped = useMemo(
    () =>
      paymentAccounts.filter((a) => {
        const matchesBranch = !isAdmin ? a.branchId === session?.branchId : branchFilter === "all" || a.branchId === branchFilter;
        const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? a.status === "Active" : a.status === "Inactive");
        const matchesQuery = `${a.accountName} ${a.accountNumber ?? ""}`.toLowerCase().includes(query.toLowerCase());
        return matchesBranch && matchesStatus && matchesQuery;
      }),
    [branchFilter, isAdmin, paymentAccounts, query, session?.branchId, statusFilter],
  );

  const stats = useMemo(() => {
    return {
      total: scoped.length,
      balance: scoped.reduce((sum, a) => sum + a.currentBalance, 0),
      bank: scoped.filter((a) => a.accountType === "Bank Account").length,
      cash: scoped.filter((a) => a.accountType === "Cash").length,
    };
  }, [scoped]);

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Payment Accounts"
        description="Manage your bank accounts, cash, and payment methods"
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft animate-fade-in"
          >
            <Plus className="size-4" /> Add Account
          </button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Accounts" value={String(stats.total)} hint="Accounts in scope" />
        <Stat label="Total Balance" value={fmtMoney(stats.balance)} hint="Aggregated balance" />
        <Stat label="Bank Accounts" value={String(stats.bank)} hint="Active commercial banks" />
        <Stat label="Cash Accounts" value={String(stats.cash)} hint="Liquid cash ledgers" />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or account number..."
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3.5 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        {isAdmin && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ink w-full sm:w-auto"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ink w-full sm:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">
          {scoped.length} accounts found
        </div>
      </div>

      {scoped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/50 text-muted-foreground">
            <ShieldAlert className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-semibold">No accounts found</h2>
          <p className="mt-1 text-sm text-muted-foreground">Get started by adding a payment method or ledger.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft"
          >
            <Plus className="size-4" /> Create Account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scoped.map((a) => {
            const Icon = iconFor(a.accountType);
            const isAccActive = a.status === "Active";
            const branchName = branches.find((b) => b.id === a.branchId)?.name ?? "Branch";
            return (
              <article
                key={a.id}
                className="group relative rounded-2xl border border-border bg-card p-5 transition hover:shadow-soft duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-foreground/80 transition group-hover:bg-ink group-hover:text-paper duration-300">
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg leading-snug truncate">{a.accountName}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{a.accountType}</span>
                      {a.accountNumber && (
                        <>
                          <span>·</span>
                          <span className="num font-medium text-foreground/70">{a.accountNumber}</span>
                        </>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Branch: {branchName}
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none ${
                      isAccActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Current Balance
                    </div>
                    <div className="mt-1.5 font-display text-2xl font-semibold num text-foreground leading-none">
                      {fmtMoney(a.currentBalance)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                      title="Edit account"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete ${a.accountName}?`)) return;
                        try {
                          await deletePaymentAccount(a.id);
                          toast.success("Account deleted");
                        } catch (e: any) {
                          toast.error(e.message || "Failed to delete account");
                        }
                      }}
                      className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"
                      title="Delete account"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && (
        <AccountDialog
          isAdmin={isAdmin}
          branches={branches}
          defaultBranchId={defaultBranchId}
          initial={editing}
          onClose={close}
          onSave={async (data) => {
            try {
              const payload = isAdmin ? data : { ...data, branchId: session!.branchId! };
              if (editing) {
                await updatePaymentAccount(editing.id, payload);
                toast.success("Account updated");
              } else {
                await addPaymentAccount(payload);
                toast.success("Account created");
              }
              close();
            } catch (e: any) {
              toast.error(e.message || "Failed to save account");
            }
          }}
        />
      )}
    </>
  );
}

function AccountDialog({
  isAdmin,
  branches,
  defaultBranchId,
  initial,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  defaultBranchId: string;
  initial: PaymentAccount | null;
  onClose: () => void;
  onSave: (data: Omit<PaymentAccount, "id" | "createdAt">) => void;
}) {
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [accountType, setAccountType] = useState<PaymentAccount["accountType"]>(initial?.accountType ?? "Bank Account");
  const [status, setStatus] = useState<"Active" | "Inactive">(initial?.status ?? "Active");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [openingBalance, setOpeningBalance] = useState(String(initial?.openingBalance ?? 0));
  const [description, setDescription] = useState(initial?.description ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const balance = Number(openingBalance) || 0;
    onSave({
      branchId,
      accountName,
      accountType,
      status,
      accountNumber: accountNumber || undefined,
      openingBalance: balance,
      currentBalance: initial?.currentBalance ?? balance,
      description: description || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-paper max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">{initial ? "Edit Account" : "Add Account"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent transition">
            <X className="size-4" />
          </button>
        </div>
        <form className="space-y-6" onSubmit={submit}>
          {isAdmin && (
            <Select
              label="Branch *"
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => b.name)}
              values={branches.map((b) => b.id)}
            />
          )}

          {/* Section: Basic Information */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-1.5">
              Basic Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Account Name *"
                value={accountName}
                onChange={setAccountName}
                required
                placeholder="e.g., Main Business Account"
              />
              <Select
                label="Account Type *"
                value={accountType}
                onChange={(v) => setAccountType(v as PaymentAccount["accountType"])}
                options={[...accountTypes]}
              />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Status *</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                  <input
                    type="radio"
                    name="dialog-status"
                    checked={status === "Active"}
                    onChange={() => setStatus("Active")}
                    className="size-4 text-ink focus:ring-ink focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                  <input
                    type="radio"
                    name="dialog-status"
                    checked={status === "Inactive"}
                    onChange={() => setStatus("Inactive")}
                    className="size-4 text-ink focus:ring-ink focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Account Details */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-1.5">
              Account Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Account Number (Optional)"
                value={accountNumber}
                onChange={setAccountNumber}
                placeholder="XXXX-XXXX-XXXX"
              />
              <Field
                label="Opening Balance (INR) *"
                type="number"
                value={openingBalance}
                onChange={setOpeningBalance}
                required
                helper="Initial account balance"
              />
            </div>
          </div>

          {/* Section: Additional Information */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/60 pb-1.5">
              Additional Information
            </h3>
            <TextArea label="Description" value={description} onChange={setDescription} placeholder="Enter account details or usage context..." />
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
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft"
            >
              {initial ? "Save changes" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const iconFor = (type: string) => {
  switch (type) {
    case "Bank Account":
      return Landmark;
    case "Cash":
      return Banknote;
    case "Card":
      return CreditCard;
    case "UPI":
      return Coins;
    default:
      return Wallet;
  }
};

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
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
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
  values?: string[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink w-full"
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
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink w-full"
      />
    </label>
  );
}
