import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { useStore, fmtMoney, type Supplier } from "@/lib/store";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const countryCodes = ["+91", "+1", "+44", "+971", "+61"];
const paymentTerms = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt"];

export function SuppliersPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, suppliers, addSupplier, updateSupplier, deleteSupplier } = useStore();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);

  const scoped = useMemo(
    () =>
      suppliers.filter((supplier) => {
        if (!isAdmin && supplier.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && supplier.branchId !== branchFilter) return false;
        return `${supplier.companyName} ${supplier.email ?? ""} ${supplier.phone ?? ""}`.toLowerCase().includes(query.toLowerCase());
      }),
    [branchFilter, isAdmin, query, session?.branchId, suppliers],
  );

  const stats = {
    total: scoped.length,
    active: scoped.filter((s) => s.status === "Active").length,
    inactive: scoped.filter((s) => s.status === "Inactive").length,
    outstanding: scoped.reduce((sum, s) => sum + (s.balanceType === "Payable" ? s.openingBalanceAmount : -s.openingBalanceAmount), 0),
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Suppliers"
        title="Suppliers"
        description="Manage supplier contacts, balances, terms, and credit limits."
        actions={
          <button type="button" onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto">
            <Plus className="size-4" /> Add Supplier
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Total Suppliers" value={String(stats.total)} />
        <Stat label="Active" value={String(stats.active)} />
        <Stat label="Inactive" value={String(stats.inactive)} />
        <Stat label="Total Outstanding" value={fmtMoney(stats.outstanding)} />
      </div>

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input placeholder="Search name, email, phone..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink" />
        {isAdmin && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink">
            <option value="all">All branches</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        )}
        <div className="text-xs text-muted-foreground sm:ml-auto">{scoped.length} suppliers</div>
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Supplier</th>
              <th className="px-5 py-3 text-left font-medium">Contact</th>
              {isAdmin && <th className="px-5 py-3 text-left font-medium">Branch</th>}
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Outstanding</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {scoped.map((supplier) => {
              const branch = branches.find((b) => b.id === supplier.branchId);
              return (
                <tr key={supplier.id} className="group border-b border-border/60 transition hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{supplier.companyName}<div className="text-xs text-muted-foreground">{supplier.contactPerson}</div></td>
                  <td className="px-5 py-3 text-muted-foreground">{supplier.email || "-"}<div className="num text-xs">{supplier.phone}</div></td>
                  {isAdmin && <td className="px-5 py-3 text-muted-foreground">{branch?.name ?? "-"}</td>}
                  <td className="px-5 py-3">{supplier.status}</td>
                  <td className="px-5 py-3 text-right num">{fmtMoney(supplier.openingBalanceAmount)}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => { setEditing(supplier); setOpen(true); }} className="rounded-md p-1.5 hover:bg-accent" aria-label="Edit supplier"><Pencil className="size-3.5" /></button>
                    <button type="button" onClick={async () => {
                      if (!confirm(`Delete ${supplier.companyName}?`)) return;
                      try { await deleteSupplier(supplier.id); toast.success("Supplier deleted"); } catch (e: any) { toast.error(e.message || "Failed to delete supplier"); }
                    }} className="rounded-md p-1.5 text-destructive hover:bg-accent" aria-label="Delete supplier"><Trash2 className="size-3.5" /></button>
                  </td>
                </tr>
              );
            })}
            {scoped.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-muted-foreground">No suppliers yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <SupplierDialog
          isAdmin={isAdmin}
          branches={branches}
          defaultBranchId={defaultBranchId}
          initial={editing}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              const payload = isAdmin ? data : { ...data, branchId: session!.branchId! };
              if (editing) { await updateSupplier(editing.id, payload); toast.success("Supplier updated"); }
              else { await addSupplier(payload); toast.success("Supplier created"); }
              closeDialog();
            } catch (e: any) {
              toast.error(e.message || "Failed to save supplier");
            }
          }}
        />
      )}
    </>
  );
}

function SupplierDialog({ isAdmin, branches, defaultBranchId, initial, onClose, onSave }: { isAdmin: boolean; branches: { id: string; name: string }[]; defaultBranchId: string; initial: Supplier | null; onClose: () => void; onSave: (data: Omit<Supplier, "id" | "createdAt">) => void }) {
  const phone = parsePhone(initial?.phone);
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");
  const [status, setStatus] = useState<"Active" | "Inactive">(initial?.status ?? "Active");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phoneCode, setPhoneCode] = useState(phone.code);
  const [phoneNumber, setPhoneNumber] = useState(phone.number);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [country, setCountry] = useState(initial?.country ?? "India");
  const [openingBalanceAmount, setOpeningBalanceAmount] = useState(String(initial?.openingBalanceAmount ?? 0));
  const [balanceType, setBalanceType] = useState<"Payable" | "Receivable">(initial?.balanceType ?? "Payable");
  const [balanceAsOfDate, setBalanceAsOfDate] = useState(initial?.balanceAsOfDate ?? "");
  const [paymentTerm, setPaymentTerm] = useState(initial?.paymentTerms ?? "");
  const [creditLimit, setCreditLimit] = useState(String(initial?.creditLimit ?? 0));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      branchId,
      companyName: companyName.trim(),
      contactPerson: contactPerson || undefined,
      status,
      email: email || undefined,
      phone: phoneNumber ? `${phoneCode} ${phoneNumber}` : undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      openingBalanceAmount: Number(openingBalanceAmount) || 0,
      balanceType,
      balanceAsOfDate: balanceAsOfDate || undefined,
      paymentTerms: paymentTerm || undefined,
      creditLimit: Number(creditLimit) || 0,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-paper" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{initial ? "Edit" : "New"}</div><h2 className="font-display text-2xl">{initial ? "Edit supplier" : "Add supplier"}</h2></div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-accent"><X className="size-4" /></button>
        </div>
        <form className="grid gap-5" onSubmit={submit}>
          {isAdmin && <SelectField label="Branch *" value={branchId} onChange={setBranchId} options={branches.map((b) => b.name)} values={branches.map((b) => b.id)} required />}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Company name *" value={companyName} onChange={setCompanyName} required />
            <Field label="Contact person" value={contactPerson} onChange={setContactPerson} />
            <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span><div className="flex gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"><label><input type="radio" checked={status === "Active"} onChange={() => setStatus("Active")} /> Active</label><label><input type="radio" checked={status === "Inactive"} onChange={() => setStatus("Inactive")} /> Inactive</label></div></label>
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <PhoneField code={phoneCode} value={phoneNumber} onCode={setPhoneCode} onChange={setPhoneNumber} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Address" value={address} onChange={setAddress} />
            <Field label="City" value={city} onChange={setCity} />
            <Field label="State" value={state} onChange={setState} />
            <Field label="Postal code" value={postalCode} onChange={setPostalCode} />
            <SelectField label="Country" value={country} onChange={setCountry} options={["India", "United States", "United Kingdom", "UAE", "Australia"]} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Opening balance" type="number" step="0.01" value={openingBalanceAmount} onChange={setOpeningBalanceAmount} helper="Any existing balance with this supplier" />
            <SelectField label="Balance type" value={balanceType} onChange={(v) => setBalanceType(v as "Payable" | "Receivable")} options={["Payable", "Receivable"]} helper={balanceType === "Payable" ? "Payable (We Owe)" : "Receivable (They Owe Us)"} />
            <Field label="Balance as of date" type="date" value={balanceAsOfDate} onChange={setBalanceAsOfDate} />
            <SelectField label="Payment terms" value={paymentTerm} onChange={setPaymentTerm} options={paymentTerms} />
            <Field label="Credit limit" type="number" step="0.01" value={creditLimit} onChange={setCreditLimit} helper="Maximum credit allowed for this supplier" />
          </div>
          <TextArea label="Notes" value={notes} onChange={setNotes} />
          <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button><button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90">{initial ? "Save changes" : "Create Supplier"}</button></div>
        </form>
      </div>
    </div>
  );
}

const parsePhone = (value?: string) => {
  if (!value) return { code: "+91", number: "" };
  const match = value.match(/^(\+\d+)\s*(.*)$/);
  return match ? { code: match[1], number: match[2] } : { code: "+91", number: value };
};

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-soft"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div><div className="mt-2 num text-xl font-semibold">{value}</div></div>;
}

function Field({ label, value, onChange, type = "text", required, step, helper }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string; helper?: string }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><input type={type} step={step} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" />{helper && <span className="text-xs text-muted-foreground">{helper}</span>}</label>;
}

function SelectField({ label, value, onChange, options, values, required, helper }: { label: string; value: string; onChange: (value: string) => void; options: string[]; values?: string[]; required?: boolean; helper?: string }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"><option value="">Select</option>{options.map((option, index) => <option key={values?.[index] ?? option} value={values?.[index] ?? option}>{option}</option>)}</select>{helper && <span className="text-xs text-muted-foreground">{helper}</span>}</label>;
}

function PhoneField({ code, value, onCode, onChange }: { code: string; value: string; onCode: (value: string) => void; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">Phone</span><div className="grid grid-cols-[5.5rem_1fr] gap-2"><select value={code} onChange={(e) => onCode(e.target.value)} className="rounded-md border border-border bg-background px-2 py-2 text-sm outline-none focus:border-ink">{countryCodes.map((countryCode) => <option key={countryCode}>{countryCode}</option>)}</select><input type="tel" value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" /></div></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" /></label>;
}
