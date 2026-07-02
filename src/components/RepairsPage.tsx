import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { useStore, fmtDate, fmtMoney, type Repair, type RepairItem } from "@/lib/store";
import { Pencil, Plus, Trash2, Wrench, X, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ImageLightbox } from "./ImageLightbox";

const defaultIssues = ["Screen Broken", "Battery Issue", "Charging Problem", "Water Damage"];

type DraftItem = RepairItem & { draftIssue: string; newFiles?: File[] };
type RepairFormData = {
  branchId: string;
  customerId?: string;
  customerName: string;
  status: string;
  items: RepairItem[];
};

const emptyItem = (): DraftItem => ({
  brand: "",
  item: "",
  quantity: 1,
  serialNumber: "",
  issues: [],
  issueDescription: "",
  photos: [],
  underWarranty: false,
  estimatedCost: undefined,
  serviceCost: undefined,
  assignedTo: "Unassigned",
  expectedCompletionDate: "",
  draftIssue: "",
});

export function RepairsPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, customers, repairs, addRepair, updateRepair, deleteRepair } = useStore();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Repair | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [expectedFrom, setExpectedFrom] = useState("");
  const [expectedTo, setExpectedTo] = useState("");
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    photos: string[];
    currentIndex: number;
  }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
  });

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  const scopedRepairs = useMemo(
    () =>
      repairs.filter((repair) => {
        if (!isAdmin && repair.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && repair.branchId !== branchFilter) return false;
        if (statusFilter !== "all" && repair.status !== statusFilter) return false;
        if (customerFilter !== "all" && repair.customerName !== customerFilter) return false;

        if (createdFrom) {
          const t = new Date(repair.createdAt).getTime();
          if (t < new Date(createdFrom).getTime()) return false;
        }
        if (createdTo) {
          const t = new Date(repair.createdAt).getTime();
          if (t > new Date(createdTo).getTime() + 86400000) return false;
        }

        if (expectedFrom || expectedTo) {
          const hasExpectedCompletionMatch = repair.items.some((item) => {
            if (!item.expectedCompletionDate) return false;
            const t = new Date(item.expectedCompletionDate).getTime();
            if (expectedFrom && t < new Date(expectedFrom).getTime()) return false;
            if (expectedTo && t > new Date(expectedTo).getTime() + 86400000) return false;
            return true;
          });
          if (!hasExpectedCompletionMatch) return false;
        }

        const itemText = repair.items.map((item) => `${item.brand} ${item.item} ${item.serialNumber ?? ""}`).join(" ");
        return `${repair.number} ${repair.customerName} ${itemText}`.toLowerCase().includes(query.toLowerCase());
      }),
    [branchFilter, isAdmin, query, repairs, session?.branchId, statusFilter, customerFilter, createdFrom, createdTo, expectedFrom, expectedTo],
  );

  return (
    <>
      <PageHeader
        eyebrow="Repairs"
        title="Repairs & Jobs"
        description="Create and track repair jobs with multiple devices, issues, photos, costs, and branch ownership."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-4" /> New repair
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input
          placeholder="Search repair number, customer, item..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
        {isAdmin && (
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCustomerFilter("all");
            }}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-accent cursor-pointer"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          Filter
          {(statusFilter !== "all" || customerFilter !== "all" || createdFrom || createdTo || expectedFrom || expectedTo) && (
            <span className="ml-1 flex size-2 rounded-full bg-ink animate-pulse" />
          )}
        </button>
        <div className="text-xs text-muted-foreground sm:ml-auto">{scopedRepairs.length} repairs</div>
      </div>

      <div className="grid gap-3">
        {scopedRepairs.map((repair) => {
          const branch = branches.find((b) => b.id === repair.branchId);
          const estimate = repair.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
          return (
            <article key={repair.id} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl">{repair.number}</h2>
                    <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {repair.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {repair.customerName} · {branch?.name ?? "Unknown branch"} · {fmtDate(repair.createdAt)}
                  </div>
                </div>
                <div className="flex shrink-0 items-start justify-between gap-3 sm:block sm:text-right">
                  <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estimate</div>
                  <div className="num text-lg">{fmtMoney(estimate)}</div>
                  </div>
                  <div className="flex gap-1 sm:mt-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(repair);
                        setOpen(true);
                      }}
                      className="rounded-md p-1.5 hover:bg-accent"
                      aria-label={`Edit ${repair.number}`}
                      title="Edit repair"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Delete ${repair.number}?`)) return;
                        try {
                          await deleteRepair(repair.id);
                          toast.success("Repair deleted");
                        } catch (e: any) {
                          toast.error(e.message || "Failed to delete repair");
                        }
                      }}
                      className="rounded-md p-1.5 text-destructive hover:bg-accent"
                      aria-label={`Delete ${repair.number}`}
                      title="Delete repair"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {repair.items.map((item, index) => (
                  <div key={item.id ?? index} className="rounded-md border border-border/70 bg-background px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {item.brand} {item.item} x{item.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.assignedTo}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.issues.join(", ")}
                      {item.serialNumber && <span> · SN {item.serialNumber}</span>}
                    </div>
                    {item.photos && item.photos.length > 0 && (
                      <div className="mt-2.5 space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Attached Photos:</div>
                        <div className="flex flex-wrap gap-2">
                          {item.photos.map((photo, pIdx) => {
                            const isUrl = photo.startsWith("http");
                            return isUrl ? (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  const urls = repair.items.flatMap((it) => it.photos).filter((p) => p.startsWith("http"));
                                  const idx = urls.indexOf(photo);
                                  setLightbox({
                                    isOpen: true,
                                    photos: urls,
                                    currentIndex: idx >= 0 ? idx : 0,
                                  });
                                }}
                                className="block size-14 rounded-md border border-border overflow-hidden bg-muted hover:opacity-80 transition"
                                title="Click to preview image"
                              >
                                <img src={photo} alt="" className="size-full object-cover" />
                              </button>
                            ) : (
                              <span key={pIdx} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-mono border border-border text-muted-foreground">
                                📄 {photo} (Legacy)
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
        {scopedRepairs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            No repairs yet.
          </div>
        )}
      </div>

      {open && (
        <RepairDialog
          isAdmin={isAdmin}
          branches={branches}
          customers={customers}
          initial={editing}
          defaultBranchId={defaultBranchId}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateRepair(editing.id, data);
                toast.success("Repair updated");
              } else {
                await addRepair(data);
                toast.success("Repair created");
              }
              closeDialog();
            } catch (e: any) {
              toast.error(e.message || "Failed to save repair");
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

      {filterOpen && (
        <FilterModal
          status={statusFilter}
          customer={customerFilter}
          createdFrom={createdFrom}
          createdTo={createdTo}
          expectedFrom={expectedFrom}
          expectedTo={expectedTo}
          customers={customers.filter((c) => {
            if (!isAdmin && c.branchId !== session?.branchId) return false;
            if (isAdmin && branchFilter !== "all" && c.branchId !== branchFilter) return false;
            return true;
          })}
          onStatus={setStatusFilter}
          onCustomer={setCustomerFilter}
          onCreatedFrom={setCreatedFrom}
          onCreatedTo={setCreatedTo}
          onExpectedFrom={setExpectedFrom}
          onExpectedTo={setExpectedTo}
          onClose={() => setFilterOpen(false)}
          onClear={() => {
            setStatusFilter("all");
            setCustomerFilter("all");
            setCreatedFrom("");
            setCreatedTo("");
            setExpectedFrom("");
            setExpectedTo("");
          }}
        />
      )}
    </>
  );
}

function RepairDialog({
  isAdmin,
  branches,
  customers,
  initial,
  defaultBranchId,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  customers: { id: string; name: string; phone: string; branchId: string }[];
  initial: Repair | null;
  defaultBranchId: string;
  onClose: () => void;
  onSave: (data: RepairFormData) => void;
}) {
  const { staff } = useStore();
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [customerQuery, setCustomerQuery] = useState(initial?.customerName ?? "");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [status, setStatus] = useState(initial?.status ?? "Open");
  const [items, setItems] = useState<DraftItem[]>(
    initial?.items.length ? initial.items.map((item) => ({ ...item, draftIssue: "" })) : [emptyItem()],
  );
  const [uploading, setUploading] = useState(false);

  const branchStaff = useMemo(() => {
    return staff.filter((s) => s.branchId === branchId && s.status === "Active");
  }, [staff, branchId]);

  const branchCustomers = customers.filter((customer) => customer.branchId === branchId);
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const customerOptions = branchCustomers
    .filter((customer) => `${customer.name} ${customer.phone}`.toLowerCase().includes(customerQuery.toLowerCase()))
    .slice(0, 6);

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      toast.error("Select a branch");
      return;
    }
    const customerName = selectedCustomer?.name || customerQuery.trim();
    if (!customerName) {
      toast.error("Select or type a customer");
      return;
    }

    if (items.some((item) => !item.brand.trim() || !item.item.trim() || item.issues.filter(Boolean).length === 0)) {
      toast.error("Every item needs brand, item name, and at least one issue");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading images...");

    try {
      const cleanItems = await Promise.all(items.map(async ({ draftIssue, newFiles, ...item }) => {
        let photos = [...(item.photos || [])];

        if (newFiles && newFiles.length > 0) {
          const uploadPromises = newFiles.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const uniqueId = Math.random().toString(36).substring(2, 9);
            const fileName = `${uniqueId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error } = await supabase.storage
              .from("repairs")
              .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (error) throw error;

            const { data: urlData } = supabase.storage
              .from("repairs")
              .getPublicUrl(filePath);

            return { originalName: file.name, publicUrl: urlData.publicUrl };
          });

          const uploadedFiles = await Promise.all(uploadPromises);

          // Replace local filenames with their public URLs in the photos array
          photos = photos.map((photo) => {
            const uploaded = uploadedFiles.find((u) => u.originalName === photo);
            return uploaded ? uploaded.publicUrl : photo;
          });
        }

        return {
          ...item,
          brand: item.brand.trim(),
          item: item.item.trim(),
          quantity: Number(item.quantity) || 1,
          estimatedCost: item.estimatedCost == null ? undefined : Number(item.estimatedCost),
          serviceCost: item.serviceCost == null ? undefined : Number(item.serviceCost),
          issues: item.issues.filter(Boolean),
          photos,
        };
      }));

      toast.dismiss(toastId);
      onSave({ branchId, customerId: selectedCustomer?.id, customerName, status, items: cleanItems });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-5xl rounded-xl border border-border bg-card p-6 shadow-paper" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {initial ? "Edit" : "New"}
            </div>
            <h2 className="font-display text-2xl">{initial ? `Edit ${initial.number}` : "Create repair"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <form className="grid gap-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2 items-start">
            {isAdmin && (
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Branch *</span>
                <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink">
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Customer *</span>
              <input
                required
                list="repair-customers"
                value={selectedCustomer ? selectedCustomer.name : customerQuery}
                onChange={(e) => {
                  setCustomerId("");
                  setCustomerQuery(e.target.value);
                }}
                placeholder="Search existing or type new customer"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <datalist id="repair-customers">
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.phone}
                  </option>
                ))}
              </datalist>
              {customerOptions.length > 0 && !selectedCustomer && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {customerOptions.map((customer) => (
                    <button
                      type="button"
                      key={customer.id}
                      onClick={() => {
                        setCustomerId(customer.id);
                        setCustomerQuery(customer.name);
                      }}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                    >
                      {customer.name}
                    </button>
                  ))}
                </div>
              )}
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink">
                <option>Open</option>
                <option>In Progress</option>
                <option>Waiting for Parts</option>
                <option>Ready</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4">
            {items.map((item, index) => (
              <section key={index} className="rounded-xl border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="size-4" />
                    <h3 className="font-medium">Repair item {index + 1}</h3>
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} className="rounded-md p-1.5 text-destructive hover:bg-accent" aria-label="Remove item">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Brand *" value={item.brand} onChange={(value) => updateItem(index, { brand: value })} required />
                  <Field label="Item *" value={item.item} onChange={(value) => updateItem(index, { item: value })} required />
                  <Field label="Quantity" type="number" value={String(item.quantity)} onChange={(value) => updateItem(index, { quantity: Number(value) || 1 })} />
                  <Field label="Serial number / barcode" value={item.serialNumber ?? ""} onChange={(value) => updateItem(index, { serialNumber: value })} />
                  <Field label="Estimated cost" type="number" step="0.01" value={String(item.estimatedCost ?? "")} onChange={(value) => updateItem(index, { estimatedCost: value === "" ? undefined : Number(value) })} />
                  <Field label="Service cost" type="number" step="0.01" value={String(item.serviceCost ?? "")} onChange={(value) => updateItem(index, { serviceCost: value === "" ? undefined : Number(value) })} />
                  <label className="grid gap-1.5">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Assigned to</span>
                    <select
                      value={item.assignedToId || (item.assignedTo !== "Unassigned" ? item.assignedTo : "Unassigned")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Unassigned") {
                          updateItem(index, { assignedTo: "Unassigned", assignedToId: undefined });
                        } else {
                          const selected = branchStaff.find((s) => s.id === val);
                          if (selected) {
                            updateItem(index, { assignedTo: selected.name, assignedToId: selected.id });
                          }
                        }
                      }}
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {branchStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.role ? `(${s.role})` : ""}
                        </option>
                      ))}
                      {item.assignedTo && item.assignedTo !== "Unassigned" && !branchStaff.some((s) => s.id === item.assignedToId) && (
                        <option value={item.assignedTo} disabled>
                          {item.assignedTo} (Legacy)
                        </option>
                      )}
                    </select>
                  </label>
                  <Field label="Expected completion" type="date" value={item.expectedCompletionDate ?? ""} onChange={(value) => updateItem(index, { expectedCompletionDate: value })} />
                  <label className="flex items-center gap-2 self-end rounded-md border border-border bg-card px-3 py-2 text-sm">
                    <input type="checkbox" checked={item.underWarranty} onChange={(e) => updateItem(index, { underWarranty: e.target.checked })} />
                    Under warranty
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <IssuePicker item={item} onChange={(patch) => updateItem(index, patch)} />
                  <div className="grid gap-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Add Photos (up to 10)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []).slice(0, 10);
                          const existingPhotos = item.photos || [];
                          const newNames = files.map((file) => file.name);
                          updateItem(index, {
                            photos: [...existingPhotos, ...newNames],
                            newFiles: [...(item.newFiles || []), ...files]
                          });
                        }}
                        className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
                      />
                    </label>

                    {((item.photos && item.photos.length > 0) || (item.newFiles && item.newFiles.length > 0)) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.photos && item.photos
                          .filter((photo) => !item.newFiles?.some((f) => f.name === photo))
                          .map((photo, pIdx) => {
                            const isUrl = photo.startsWith("http");
                          return (
                            <div key={`existing-${pIdx}`} className="relative group size-16 rounded-md border border-border overflow-hidden bg-muted">
                              {isUrl ? (
                                <img src={photo} alt="" className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex flex-col items-center justify-center p-1 text-[8px] text-center text-muted-foreground break-all">
                                  <span>📄</span>
                                  <span className="truncate w-full">{photo}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPhotos = item.photos.filter((_, i) => i !== pIdx);
                                  updateItem(index, { photos: updatedPhotos });
                                }}
                                className="absolute top-0.5 right-0.5 rounded-full bg-ink/75 text-paper p-0.5 opacity-0 group-hover:opacity-100 transition"
                                title="Remove photo"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          );
                        })}

                        {item.newFiles && item.newFiles.map((file, fIdx) => {
                          const localUrl = URL.createObjectURL(file);
                          return (
                            <div key={`new-${fIdx}`} className="relative group size-16 rounded-md border border-border overflow-hidden bg-muted">
                              <img src={localUrl} alt="" className="size-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-ink/60 text-[8px] text-paper text-center truncate py-0.5">New</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedNewFiles = item.newFiles?.filter((_, i) => i !== fIdx) || [];
                                  const updatedPhotos = item.photos.filter((p) => p !== file.name);
                                  updateItem(index, { newFiles: updatedNewFiles, photos: updatedPhotos });
                                }}
                                className="absolute top-0.5 right-0.5 rounded-full bg-ink/75 text-paper p-0.5 opacity-0 group-hover:opacity-100 transition"
                                title="Remove photo"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <label className="mt-4 grid gap-1.5">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Issue description</span>
                  <textarea value={item.issueDescription ?? ""} onChange={(e) => updateItem(index, { issueDescription: e.target.value })} className="min-h-24 rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink" />
                </label>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])} className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">
              <Plus className="size-4" /> Add another item
            </button>
            <button type="submit" disabled={uploading} className="rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:ml-auto disabled:opacity-50">
              {uploading ? "Uploading..." : (initial ? "Save changes" : "Create repair")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IssuePicker({ item, onChange }: { item: DraftItem; onChange: (patch: Partial<DraftItem>) => void }) {
  const toggle = (issue: string) => {
    onChange({
      issues: item.issues.includes(issue)
        ? item.issues.filter((existing) => existing !== issue)
        : [...item.issues, issue],
    });
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Issues *</span>
      <div className="flex flex-wrap gap-2">
        {defaultIssues.map((issue) => (
          <button
            type="button"
            key={issue}
            onClick={() => toggle(issue)}
            className={`rounded-md border px-2 py-1 text-xs ${
              item.issues.includes(issue) ? "border-ink bg-ink text-paper" : "border-border hover:bg-accent"
            }`}
          >
            {issue}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={item.draftIssue}
          onChange={(e) => onChange({ draftIssue: e.target.value })}
          placeholder="Custom issue"
          className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => {
            const issue = item.draftIssue.trim();
            if (!issue) return;
            onChange({ issues: [...item.issues, issue], draftIssue: "" });
          }}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          Add
        </button>
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
        className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}

function FilterModal({
  status,
  customer,
  createdFrom,
  createdTo,
  expectedFrom,
  expectedTo,
  customers,
  onStatus,
  onCustomer,
  onCreatedFrom,
  onCreatedTo,
  onExpectedFrom,
  onExpectedTo,
  onClose,
  onClear,
}: {
  status: string;
  customer: string;
  createdFrom: string;
  createdTo: string;
  expectedFrom: string;
  expectedTo: string;
  customers: { id: string; name: string }[];
  onStatus: (v: string) => void;
  onCustomer: (v: string) => void;
  onCreatedFrom: (v: string) => void;
  onCreatedTo: (v: string) => void;
  onExpectedFrom: (v: string) => void;
  onExpectedTo: (v: string) => void;
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
          <h2 className="font-display text-2xl">Repair Filters</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => onStatus(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink font-semibold"
            >
              <option value="all">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Parts">Waiting for Parts</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Customer</span>
            <select
              value={customer}
              onChange={(e) => onCustomer(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink font-semibold"
            >
              <option value="all">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Created From</span>
              <input
                type="date"
                value={createdFrom}
                onChange={(e) => onCreatedFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full font-semibold"
              />
            </label>
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Created To</span>
              <input
                type="date"
                value={createdTo}
                onChange={(e) => onCreatedTo(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full font-semibold"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Expected From</span>
              <input
                type="date"
                value={expectedFrom}
                onChange={(e) => onExpectedFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full font-semibold"
              />
            </label>
            <label className="grid gap-1.5 font-sans">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Expected To</span>
              <input
                type="date"
                value={expectedTo}
                onChange={(e) => onExpectedTo(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink w-full font-semibold"
              />
            </label>
          </div>

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
