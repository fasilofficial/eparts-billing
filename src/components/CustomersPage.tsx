import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { useStore, fmtDate, fmtMoney, type Customer } from "@/lib/store";
import {
  Building2,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

const countryCodes = ["+91", "+1", "+44", "+971", "+61"];

const parsePhone = (value?: string) => {
  if (!value) return { code: "+91", number: "" };
  const match = value.match(/^(\+\d+)\s*(.*)$/);
  return match ? { code: match[1], number: match[2] } : { code: "+91", number: value };
};

export function CustomersPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const confirm = useConfirm();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin
    ? session?.defaultBranchId || branches[0]?.id || ""
    : session?.branchId || "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);

  // Filters Modal State
  const [filterOpen, setFilterOpen] = useState(false);
  const [custType, setCustType] = useState<"All" | "Business" | "Direct">("All");
  const [payStatus, setPayStatus] = useState<"All" | "Pending" | "Paid">("All");
  const [amountFrom, setAmountFrom] = useState("0");
  const [amountTo, setAmountTo] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  const scopedCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        if (!isAdmin && customer.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && customer.branchId !== branchFilter) return false;

        // 1. Customer Type filter
        if (custType !== "All" && customer.type !== custType) return false;

        // Compute pending amount: Receivable is money the customer owes us
        const pendingAmount =
          customer.balanceType === "Receivable" ? customer.openingBalanceAmount : 0;

        // 2. Payment Status filter
        if (payStatus === "Pending" && pendingAmount <= 0) return false;
        if (payStatus === "Paid" && pendingAmount > 0) return false;

        // 3. Pending Amount From
        if (amountFrom !== "") {
          const fromVal = Number(amountFrom);
          if (!isNaN(fromVal) && pendingAmount < fromVal) return false;
        }

        // 4. Pending Amount To
        if (amountTo !== "") {
          const toVal = Number(amountTo);
          if (!isNaN(toVal) && pendingAmount > toVal) return false;
        }

        // 5. Created Date From
        if (createdFrom) {
          const t = new Date(customer.createdAt).getTime();
          if (t < new Date(createdFrom).getTime()) return false;
        }

        // 6. Created Date To
        if (createdTo) {
          const t = new Date(customer.createdAt).getTime();
          if (t >= new Date(createdTo).getTime() + 86400000) return false;
        }

        const text = `${customer.name} ${customer.phone} ${customer.email ?? ""}`.toLowerCase();
        return query === "" || text.includes(query.toLowerCase());
      }),
    [
      branchFilter,
      customers,
      isAdmin,
      query,
      session?.branchId,
      custType,
      payStatus,
      amountFrom,
      amountTo,
      createdFrom,
      createdTo,
    ],
  );

  const exportRows = useMemo(
    () =>
      scopedCustomers.map((customer) => {
        const branch = branches.find((b) => b.id === customer.branchId);
        return [
          customer.name,
          customer.phone,
          customer.email ?? "",
          customer.type,
          branch?.name ?? "",
          String(customer.openingBalanceAmount),
          customer.balanceType,
        ];
      }),
    [branches, scopedCustomers],
  );

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Customer management"
        description="Create customer accounts and keep branch balances attached to the right location."
        actions={
          <>
            <ExportExcelButton
              filename={isAdmin ? "customers" : "branch-customers"}
              headers={[
                "Name",
                "Phone",
                "Email",
                "Type",
                "Branch",
                "Opening balance",
                "Balance type",
              ]}
              rows={exportRows}
            />
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
            >
              <Plus className="size-4" /> Add customer
            </button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full max-w-md gap-2">
          <input
            placeholder="Search customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent cursor-pointer"
          >
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            Filter
          </button>
        </div>
        {isAdmin && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink w-full sm:w-auto"
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
        <div className="text-xs text-muted-foreground sm:ml-auto">
          {scopedCustomers.length} customers
        </div>
      </div>

      <div className="grid gap-3">
        {scopedCustomers.map((customer) => {
          const branch = branches.find((b) => b.id === customer.branchId);
          const Icon = customer.isBusinessCustomer ? Building2 : UserRound;
          return (
            <article
              key={customer.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-md bg-accent">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold">{customer.name}</h2>
                      <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {customer.type}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="num">{customer.phone}</span>
                      {customer.email && <span> · {customer.email}</span>}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {branch?.name ?? "Unknown branch"} · Added {fmtDate(customer.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-start justify-between gap-3 sm:block sm:text-right">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {customer.balanceType}
                    </div>
                    <div className="num text-lg">{fmtMoney(customer.openingBalanceAmount)}</div>
                  </div>
                  <div className="flex gap-1 sm:mt-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(customer);
                        setOpen(true);
                      }}
                      className="rounded-md p-1.5 hover:bg-accent"
                      aria-label={`Edit ${customer.name}`}
                      title="Edit customer"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !(await confirm({
                            title: "Delete customer?",
                            description: `Are you sure you want to delete ${customer.name}?`,
                          }))
                        )
                          return;
                        try {
                          await deleteCustomer(customer.id);
                          toast.success("Customer deleted");
                        } catch (e: any) {
                          toast.error(e.message || "Failed to delete customer");
                        }
                      }}
                      className="rounded-md p-1.5 text-destructive hover:bg-accent"
                      aria-label={`Delete ${customer.name}`}
                      title="Delete customer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {scopedCustomers.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            No customers found matching filters.
          </div>
        )}
      </div>

      {open && (
        <CustomerDialog
          isAdmin={isAdmin}
          branches={branches}
          initial={editing}
          defaultBranchId={defaultBranchId}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateCustomer(editing.id, data);
                toast.success("Customer updated");
              } else {
                await addCustomer(data);
                toast.success("Customer added");
              }
              closeDialog();
            } catch (e: any) {
              toast.error(e.message || "Failed to save customer");
            }
          }}
        />
      )}

      {filterOpen && (
        <CustomerFilterModal
          custType={custType}
          setCustType={setCustType}
          payStatus={payStatus}
          setPayStatus={setPayStatus}
          amountFrom={amountFrom}
          setAmountFrom={setAmountFrom}
          amountTo={amountTo}
          setAmountTo={setAmountTo}
          createdFrom={createdFrom}
          setCreatedFrom={setCreatedFrom}
          createdTo={createdTo}
          setCreatedTo={setCreatedTo}
          onClose={() => setFilterOpen(false)}
          onClear={() => {
            setCustType("All");
            setPayStatus("All");
            setAmountFrom("0");
            setAmountTo("");
            setCreatedFrom("");
            setCreatedTo("");
          }}
        />
      )}
    </>
  );
}

function CustomerFilterModal({
  custType,
  setCustType,
  payStatus,
  setPayStatus,
  amountFrom,
  setAmountFrom,
  amountTo,
  setAmountTo,
  createdFrom,
  setCreatedFrom,
  createdTo,
  setCreatedTo,
  onClose,
  onClear,
}: {
  custType: "All" | "Business" | "Direct";
  setCustType: (v: "All" | "Business" | "Direct") => void;
  payStatus: "All" | "Pending" | "Paid";
  setPayStatus: (v: "All" | "Pending" | "Paid") => void;
  amountFrom: string;
  setAmountFrom: (v: string) => void;
  amountTo: string;
  setAmountTo: (v: string) => void;
  createdFrom: string;
  setCreatedFrom: (v: string) => void;
  createdTo: string;
  setCreatedTo: (v: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-paper max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="font-display text-2xl">Filter Customers</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Customer Type Toggle */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Customer Type</span>
            <div className="grid grid-cols-3 gap-2">
              {(["All", "Business", "Direct"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCustType(t)}
                  className={`rounded-md py-2 text-center text-sm font-medium transition cursor-pointer select-none ${
                    custType === t
                      ? "bg-ink text-paper font-semibold"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status Toggle */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Payment Status</span>
            <div className="grid grid-cols-3 gap-2">
              {(["All", "Pending", "Paid"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPayStatus(s)}
                  className={`rounded-md py-2 text-center text-sm font-medium transition cursor-pointer select-none ${
                    payStatus === s
                      ? "bg-ink text-paper font-semibold"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Amount From */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Pending Amount From</span>
            <input
              type="number"
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink transition"
            />
            <span className="text-[10px] text-muted-foreground block">Minimum pending amount</span>
          </div>

          {/* Pending Amount To */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Pending Amount To</span>
            <input
              type="number"
              value={amountTo}
              onChange={(e) => setAmountTo(e.target.value)}
              placeholder="No limit"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink transition"
            />
            <span className="text-[10px] text-muted-foreground block font-sans">
              Maximum pending amount (leave empty for no limit)
            </span>
          </div>

          {/* Created Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Created From
              </span>
              <input
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full"
              />
            </label>
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Created To
              </span>
              <input
                type="date"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => {
                onClear();
                onClose();
              }}
              className="w-1/2 rounded-md border border-border bg-card py-2 text-center text-sm font-semibold hover:bg-accent transition cursor-pointer"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-md bg-ink py-2 text-center text-sm font-semibold text-paper hover:opacity-90 transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDialog({
  isAdmin,
  branches,
  initial,
  defaultBranchId,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  initial: Customer | null;
  defaultBranchId: string;
  onClose: () => void;
  onSave: (data: Omit<Customer, "id" | "createdAt">) => void;
}) {
  const primaryPhone = parsePhone(initial?.phone);
  const alternatePhone = parsePhone(initial?.secondaryPhone);
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [isBusinessCustomer, setIsBusinessCustomer] = useState(
    initial?.isBusinessCustomer ?? false,
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [phoneCode, setPhoneCode] = useState(primaryPhone.code);
  const [phone, setPhone] = useState(primaryPhone.number);
  const [secondaryCode, setSecondaryCode] = useState(alternatePhone.code);
  const [secondaryPhone, setSecondaryPhone] = useState(alternatePhone.number);
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [type, setType] = useState<"Business" | "Direct">(initial?.type ?? "Direct");
  const [openingBalanceAmount, setOpeningBalanceAmount] = useState(
    String(initial?.openingBalanceAmount ?? "0.00"),
  );
  const [balanceType, setBalanceType] = useState<"Receivable" | "Payable">(
    initial?.balanceType ?? "Receivable",
  );
  const [balanceDate, setBalanceDate] = useState(initial?.balanceDate ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      toast.error("Select a branch");
      return;
    }
    onSave({
      branchId,
      isBusinessCustomer,
      name: name.trim(),
      phone: `${phoneCode} ${phone}`.trim(),
      secondaryPhone: secondaryPhone ? `${secondaryCode} ${secondaryPhone}`.trim() : undefined,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
      type,
      openingBalanceAmount: Number(openingBalanceAmount) || 0,
      balanceType,
      balanceDate: balanceDate || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto my-6 w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {initial ? "Edit" : "New"}
            </div>
            <h2 className="font-display text-2xl">{initial ? "Edit customer" : "Add customer"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form className="grid gap-4" onSubmit={submit}>
          {isAdmin && (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Branch *
              </span>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={isBusinessCustomer}
              onChange={(e) => {
                setIsBusinessCustomer(e.target.checked);
                setType(e.target.checked ? "Business" : "Direct");
              }}
            />
            This is a business customer
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *" value={name} onChange={setName} required />
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Type *</span>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value as "Business" | "Direct")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option>Business</option>
                <option>Direct</option>
              </select>
            </label>
            <PhoneField
              label="Phone *"
              code={phoneCode}
              value={phone}
              onCode={setPhoneCode}
              onChange={setPhone}
              required
            />
            <PhoneField
              label="Secondary phone"
              code={secondaryCode}
              value={secondaryPhone}
              onCode={setSecondaryCode}
              onChange={setSecondaryPhone}
            />
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field
              label="Opening balance"
              type="number"
              step="0.01"
              value={openingBalanceAmount}
              onChange={setOpeningBalanceAmount}
            />
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Balance type
              </span>
              <select
                value={balanceType}
                onChange={(e) => setBalanceType(e.target.value as "Receivable" | "Payable")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="Receivable">Receivable (Customer owes us)</option>
                <option value="Payable">Payable (We owe customer)</option>
              </select>
            </label>
            <Field label="Balance date" type="date" value={balanceDate} onChange={setBalanceDate} />
          </div>

          <TextArea label="Address" value={address} onChange={setAddress} />
          <TextArea label="Notes" value={notes} onChange={setNotes} />

          <button
            type="submit"
            className="rounded-md bg-ink py-2.5 text-sm text-paper hover:opacity-90"
          >
            {initial ? "Save changes" : "Save customer"}
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
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}

function PhoneField({
  label,
  code,
  value,
  onCode,
  onChange,
  required,
}: {
  label: string;
  code: string;
  value: string;
  onCode: (value: string) => void;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
        <select
          value={code}
          onChange={(e) => onCode(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-2 text-sm outline-none focus:border-ink"
        >
          {countryCodes.map((countryCode) => (
            <option key={countryCode}>{countryCode}</option>
          ))}
        </select>
        <input
          type="tel"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
