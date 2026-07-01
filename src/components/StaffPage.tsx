import { useState, useMemo } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { useStore, type Staff, type Repair, type RepairItem } from "@/lib/store";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, UserCheck, Phone, Mail, Award, Landmark } from "lucide-react";
import { toast } from "sonner";

interface StaffFormData {
  branchId: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}

const emptyStaffForm = (defaultBranchId: string): StaffFormData => ({
  branchId: defaultBranchId,
  name: "",
  phone: "",
  email: "",
  role: "Technician",
  status: "Active",
});

export function StaffPage({ mode }: { mode: "admin" | "branch" }) {
  const {
    session,
    branches,
    staff,
    repairs,
    addStaff,
    updateStaff,
    deleteStaff,
    updateRepair,
  } = useStore();

  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedStaff, setExpandedStaff] = useState<Record<string, boolean>>({});

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (!isAdmin && s.branchId !== defaultBranchId) return false;
      if (isAdmin && branchFilter !== "all" && s.branchId !== branchFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [staff, isAdmin, branchFilter, defaultBranchId, statusFilter]);

  const toggleExpand = (id: string) => {
    setExpandedStaff((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to get workload (repair items assigned to a staff)
  const getStaffWorkload = (staffId: string) => {
    const workload: { repair: Repair; item: RepairItem }[] = [];
    repairs.forEach((repair) => {
      repair.items.forEach((item) => {
        if (item.assignedToId === staffId) {
          workload.push({ repair, item });
        }
      });
    });
    return workload;
  };

  const handleSave = async (data: StaffFormData) => {
    try {
      if (editing) {
        await updateStaff(editing.id, data);
        toast.success("Staff updated");
      } else {
        await addStaff(data);
        toast.success("Staff created");
      }
      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save staff");
    }
  };

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Are you sure you want to delete ${s.name}?`)) return;
    try {
      await deleteStaff(s.id);
      toast.success("Staff member removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete staff");
    }
  };

  const handleStatusChange = async (repair: Repair, newStatus: string) => {
    try {
      await updateRepair(repair.id, {
        branchId: repair.branchId,
        customerId: repair.customerId,
        customerName: repair.customerName,
        status: newStatus,
        items: repair.items,
      });
      toast.success(`Repair ${repair.number} status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Team Management"
        title="Staff & Workload"
        description="Add staff members under branches, assign them repairs, and monitor their active tasks."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-4" /> New staff member
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        >
          <option value="all">All status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">
          {filteredStaff.length} staff members found
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStaff.map((s) => {
          const branch = branches.find((b) => b.id === s.branchId);
          const workload = getStaffWorkload(s.id);
          const activeWorkload = workload.filter(
            (w) => w.repair.status !== "Delivered" && w.repair.status !== "Cancelled"
          );
          const isExpanded = !!expandedStaff[s.id];

          return (
            <article
              key={s.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft transition hover:shadow-soft"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl">{s.name}</h2>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground font-medium">
                      {s.role}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.status === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {s.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" /> {s.phone}
                      </span>
                    )}
                    {s.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" /> {s.email}
                      </span>
                    )}
                    {branch && (
                      <span className="flex items-center gap-1 font-medium">
                        <Landmark className="size-3" /> {branch.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:text-right">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Workload</div>
                    <div className="num text-lg font-bold">
                      {activeWorkload.length} task{activeWorkload.length !== 1 && "s"}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                      className="rounded-md p-1.5 hover:bg-accent"
                      title="Edit staff"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="rounded-md p-1.5 text-destructive hover:bg-accent"
                      title="Delete staff"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Workload Section */}
              <div className="mt-4 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => toggleExpand(s.id)}
                  className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Award className="size-4" />
                    {isExpanded ? "Hide Assigned Tasks" : `View Assigned Tasks (${workload.length})`}
                  </span>
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 grid gap-2">
                    {workload.map(({ repair, item }, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{repair.number}</span>
                            <span className="text-muted-foreground font-medium">
                              {repair.customerName}
                            </span>
                          </div>
                          <div className="font-medium text-foreground">
                            {item.brand} {item.item}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                            <span>Issues: {item.issues.join(", ")}</span>
                            {item.expectedCompletionDate && (
                              <span>· Due: {item.expectedCompletionDate}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">Status:</span>
                          <select
                            value={repair.status}
                            onChange={(e) => handleStatusChange(repair, e.target.value)}
                            className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold outline-none focus:border-ink"
                          >
                            <option>Open</option>
                            <option>In Progress</option>
                            <option>Waiting for Parts</option>
                            <option>Ready</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {workload.length === 0 && (
                      <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg bg-background">
                        No tasks assigned to this staff member.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {filteredStaff.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            No staff members found.
          </div>
        )}
      </div>

      {open && (
        <StaffDialog
          isAdmin={isAdmin}
          branches={branches}
          initial={editing}
          defaultBranchId={defaultBranchId}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function StaffDialog({
  isAdmin,
  branches,
  initial,
  defaultBranchId,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  initial: Staff | null;
  defaultBranchId: string;
  onClose: () => void;
  onSave: (data: StaffFormData) => void;
}) {
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState(initial?.role ?? "Technician");
  const [status, setStatus] = useState<"Active" | "Inactive">(initial?.status ?? "Active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      toast.error("Please select a branch");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    onSave({
      branchId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      role: role.trim(),
      status,
    });
  };

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
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              {initial ? "Edit Profile" : "New Registration"}
            </div>
            <h2 className="font-display text-2xl">{initial ? "Edit staff member" : "Add staff member"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {isAdmin && (
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Branch *</span>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Full Name *</span>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Role / Title</span>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Technician, Senior Repairman"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Phone Number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@erepair.in"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink font-medium"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 font-medium"
            >
              {initial ? "Save changes" : "Register staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
