import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { useStore, fmtMoney, type Expense } from "@/lib/store";
import { Pencil, Plus, Trash2, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { ImageLightbox } from "./ImageLightbox";
import { supabase } from "@/lib/supabase";

const today = () => new Date().toISOString().slice(0, 10);
export function ExpensesPage({ mode }: { mode: "admin" | "branch" }) {
  const {
    session,
    branches,
    suppliers,
    customers,
    expenses,
    categories: dbCategories,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore();

  const expenseCategories = useMemo(() => {
    const fromDb = dbCategories
      .filter((c) => c.type === "Expense" && c.isActive)
      .map((c) => c.name);
    const defaults = [
      "Rent",
      "Utilities",
      "Salary",
      "Travel",
      "Office Supplies",
      "Repairs",
      "Marketing",
    ];
    return Array.from(new Set([...defaults, ...fromDb]));
  }, [dbCategories]);
  const confirm = useConfirm();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin
    ? session?.defaultBranchId || branches[0]?.id || ""
    : session?.branchId || "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    photos: string[];
    currentIndex: number;
  }>({ isOpen: false, photos: [], currentIndex: 0 });

  const scoped = useMemo(
    () =>
      expenses.filter((expense) => {
        if (!isAdmin && expense.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && expense.branchId !== branchFilter) return false;
        return `${expense.description} ${expense.expenseNumber}`
          .toLowerCase()
          .includes(query.toLowerCase());
      }),
    [branchFilter, expenses, isAdmin, query, session?.branchId],
  );

  const now = new Date();
  const stats = {
    month: scoped.filter((e) => sameMonth(e.date, now)).reduce((sum, e) => sum + e.total, 0),
    unpaid: scoped.filter((e) => e.status === "Unpaid").reduce((sum, e) => sum + e.total, 0),
    year: scoped
      .filter((e) => new Date(e.date).getFullYear() === now.getFullYear())
      .reduce((sum, e) => sum + e.total, 0),
    recurring: scoped.filter((e) => e.isRecurring).length,
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Expenses"
        title="Expenses"
        description="Track branch-aware operating expenses, tax, suppliers, receipts, and recurring costs."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-4" /> New Expense
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="This Month" value={fmtMoney(stats.month)} color="text-destructive" />
        <Stat label="Unpaid" value={fmtMoney(stats.unpaid)} color="text-orange-600" />
        <Stat label="This Year" value={fmtMoney(stats.year)} color="text-blue-600" />
        <Stat label="Recurring" value={String(stats.recurring)} color="text-purple-600" />
      </div>

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input
          placeholder="Search description or reference..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
        {isAdmin && (
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
        )}
        <div className="text-xs text-muted-foreground sm:ml-auto">{scoped.length} expenses</div>
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Description</th>
              <th className="px-5 py-3 text-left font-medium">Category</th>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {scoped.map((expense) => (
              <tr
                key={expense.id}
                className="group border-b border-border/60 transition hover:bg-muted/50"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {expense.receipt && expense.receipt.startsWith("http") ? (
                      expense.receipt.toLowerCase().includes(".pdf") ? (
                        <a
                          href={expense.receipt}
                          target="_blank"
                          rel="noreferrer"
                          className="size-10 flex-shrink-0 rounded-md border border-border flex items-center justify-center bg-muted text-muted-foreground hover:bg-accent transition"
                          title="View PDF receipt in new tab"
                        >
                          <FileText className="size-5 text-red-500" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setLightbox({
                              isOpen: true,
                              photos: [expense.receipt!],
                              currentIndex: 0,
                            });
                          }}
                          className="size-10 flex-shrink-0 rounded-md border border-border overflow-hidden bg-muted hover:opacity-80 transition"
                          title="Click to preview receipt"
                        >
                          <img src={expense.receipt} alt="" className="size-full object-cover" />
                        </button>
                      )
                    ) : expense.receipt ? (
                      <div
                        className="size-10 flex-shrink-0 rounded-md border border-border flex items-center justify-center bg-muted text-muted-foreground text-[10px] p-0.5 text-center break-all overflow-hidden"
                        title={expense.receipt}
                      >
                        📄 {expense.receipt.slice(0, 10)}
                      </div>
                    ) : null}
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-xs text-muted-foreground">{expense.expenseNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{expense.category}</td>
                <td className="px-5 py-3 num">{expense.date}</td>
                <td className="px-5 py-3 text-right num">{fmtMoney(expense.total)}</td>
                <td className="px-5 py-3">
                  {expense.status}
                  {expense.isRecurring && (
                    <span className="ml-2 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      Recurring
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(expense);
                      setOpen(true);
                    }}
                    className="rounded-md p-1.5 hover:bg-accent"
                    aria-label="Edit expense"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !(await confirm({
                          title: "Delete expense?",
                          description: `Are you sure you want to delete expense ${expense.expenseNumber}?`,
                        }))
                      )
                        return;
                      try {
                        await deleteExpense(expense.id);
                        toast.success("Expense deleted");
                      } catch (e: any) {
                        toast.error(e.message || "Failed to delete expense");
                      }
                    }}
                    className="rounded-md p-1.5 text-destructive hover:bg-accent"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {scoped.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No expenses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <ExpenseDialog
          isAdmin={isAdmin}
          branches={branches}
          suppliers={suppliers}
          customers={customers}
          defaultBranchId={defaultBranchId}
          initial={editing}
          count={expenses.length}
          categories={expenseCategories}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              const payload = isAdmin ? data : { ...data, branchId: session!.branchId! };
              if (editing) {
                await updateExpense(editing.id, payload);
                toast.success("Expense updated");
              } else {
                await addExpense(payload);
                toast.success("Expense created");
              }
              closeDialog();
            } catch (e: any) {
              toast.error(e.message || "Failed to save expense");
            }
          }}
        />
      )}

      <ImageLightbox
        isOpen={lightbox.isOpen}
        photos={lightbox.photos}
        currentIndex={lightbox.currentIndex}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
        onChangeIndex={(idx) => setLightbox((prev) => ({ ...prev, currentIndex: idx }))}
      />
    </>
  );
}

function ExpenseDialog({
  isAdmin,
  branches,
  suppliers,
  customers,
  defaultBranchId,
  initial,
  count,
  categories,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  suppliers: { id: string; companyName: string; branchId: string }[];
  customers: { id: string; name: string; branchId: string }[];
  defaultBranchId: string;
  initial: Expense | null;
  count: number;
  categories: string[];
  onClose: () => void;
  onSave: (data: Omit<Expense, "id" | "createdAt">) => void;
}) {
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [expenseNumber, setExpenseNumber] = useState(
    initial?.expenseNumber ?? `EXP-${1000 + count + 1}`,
  );
  const [date, setDate] = useState(initial?.date ?? today());
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? 0));
  const [taxRate, setTaxRate] = useState(String(initial?.taxRate ?? 0));
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? "");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [relatedDocumentType, setRelatedDocumentType] = useState(
    initial?.relatedDocumentType ?? "None",
  );
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring ?? false);
  const [receipt, setReceipt] = useState(initial?.receipt ?? "");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<"Paid" | "Unpaid">(initial?.status ?? "Paid");
  const subtotal = Number(amount) || 0;
  const total = +(subtotal + subtotal * ((Number(taxRate) || 0) / 100)).toFixed(2);
  const branchSuppliers = suppliers.filter((s) => s.branchId === branchId);
  const branchCustomers = customers.filter((c) => c.branchId === branchId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    let receiptUrl = receipt;

    if (newFile) {
      setUploading(true);
      const toastId = toast.loading("Uploading receipt...");
      try {
        const fileExt = newFile.name.split(".").pop();
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const fileName = `${uniqueId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
          .from("repairs")
          .upload(filePath, newFile, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from("repairs").getPublicUrl(filePath);

        receiptUrl = urlData.publicUrl;
        toast.dismiss(toastId);
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Receipt upload failed: ${err.message}`);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    onSave({
      branchId,
      expenseNumber: expenseNumber || `EXP-${1000 + count + 1}`,
      date,
      category,
      description,
      amount: subtotal,
      taxRate: Number(taxRate) || 0,
      subtotal,
      total,
      supplierId: supplierId || undefined,
      customerId: customerId || undefined,
      relatedDocumentType,
      isRecurring,
      receipt: receiptUrl || undefined,
      notes: notes || undefined,
      status,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto my-6 w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {initial ? "Edit" : "New"}
            </div>
            <h2 className="font-display text-2xl">{initial ? "Edit expense" : "Create expense"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <form className="grid gap-5" onSubmit={submit}>
          {isAdmin && (
            <SelectField
              label="Branch *"
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => b.name)}
              values={branches.map((b) => b.id)}
              required
            />
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Expense number" value={expenseNumber} onChange={setExpenseNumber} />
            <Field label="Date *" type="date" value={date} onChange={setDate} required />
            <ComboField
              label="Category *"
              value={category}
              onChange={setCategory}
              options={categories}
              required
            />
          </div>
          <TextArea label="Description *" value={description} onChange={setDescription} required />
          <div className="grid gap-4 sm:grid-cols-4">
            <Field
              label="Amount *"
              type="number"
              step="0.01"
              value={amount}
              onChange={setAmount}
              required
            />
            <Field
              label="Tax rate %"
              type="number"
              step="0.01"
              value={taxRate}
              onChange={setTaxRate}
            />
            <ReadOnly label="Subtotal" value={fmtMoney(subtotal)} />
            <ReadOnly label="Total" value={fmtMoney(total)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <SelectField
              label="Supplier"
              value={supplierId}
              onChange={setSupplierId}
              options={["No Supplier", ...branchSuppliers.map((s) => s.companyName)]}
              values={["", ...branchSuppliers.map((s) => s.id)]}
            />
            <SelectField
              label="Customer"
              value={customerId}
              onChange={setCustomerId}
              options={["No Customer", ...branchCustomers.map((c) => c.name)]}
              values={["", ...branchCustomers.map((c) => c.id)]}
            />
            <SelectField
              label="Related document"
              value={relatedDocumentType}
              onChange={setRelatedDocumentType}
              options={["None", "Purchase", "Repair", "Sale"]}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as "Paid" | "Unpaid")}
              options={["Paid", "Unpaid"]}
            />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />{" "}
            This is a recurring expense
          </label>
          <div className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Receipt upload
            </span>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setNewFile(file);
                    setReceipt(file.name);
                  }
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />
              {(receipt || newFile) && (
                <div className="relative group size-10 flex-shrink-0 rounded-md border border-border overflow-hidden bg-muted">
                  {newFile ? (
                    newFile.type === "application/pdf" ? (
                      <div className="size-full flex items-center justify-center bg-muted text-muted-foreground text-[10px] font-bold">
                        PDF
                      </div>
                    ) : (
                      <img
                        src={URL.createObjectURL(newFile)}
                        alt=""
                        className="size-full object-cover"
                      />
                    )
                  ) : receipt.toLowerCase().includes(".pdf") ? (
                    <div className="size-full flex items-center justify-center bg-muted text-muted-foreground text-[10px] font-bold">
                      PDF
                    </div>
                  ) : (
                    <img src={receipt} alt="" className="size-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setReceipt("");
                      setNewFile(null);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-ink/50 text-paper opacity-0 group-hover:opacity-100 transition"
                    title="Remove receipt"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <TextArea label="Notes" value={notes} onChange={setNotes} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : initial ? "Save changes" : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const sameMonth = (iso: string, date: Date) => {
  const other = new Date(iso);
  return other.getFullYear() === date.getFullYear() && other.getMonth() === date.getMonth();
};

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 num text-xl font-semibold ${color}`}>{value}</div>
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
function SelectField({
  label,
  value,
  onChange,
  options,
  values,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  values?: string[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
      >
        {options.map((option, index) => (
          <option key={values?.[index] ?? option} value={values?.[index] ?? option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
function ComboField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const filtered = useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().includes((value || "").toLowerCase())
    );
  }, [options, value]);

  return (
    <div className="relative grid gap-1.5 text-left">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        required={required}
        value={value}
        autoComplete="off"
        placeholder="+ create category"
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-[100%] z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-md">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm num">{value}</div>
    </div>
  );
}
function TextArea({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
