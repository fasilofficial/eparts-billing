import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, fmtDate, type Admin } from "@/lib/store";
import { PageHeader } from "@/components/DashboardLayout";
import { Plus, Trash2, Pencil, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/administrators")({ component: AdminAdministrators });

function AdminAdministrators() {
  const { admins, session, addAdmin, updateAdmin, deleteAdmin } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Administrators"
        description="Manage administrative accounts that have full system-wide control."
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-4" /> New administrator
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Render Environment-Variable Legacy Admin as read-only card if it's not already in db */}
        {import.meta.env.VITE_ADMIN_EMAIL && !admins.some(a => a.email === import.meta.env.VITE_ADMIN_EMAIL) && (
          <article className="group rounded-xl border border-dashed border-border bg-card/50 p-5 transition hover:shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-display text-2xl leading-tight">System Owner</div>
                  <span className="inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Env-based</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{import.meta.env.VITE_ADMIN_EMAIL}</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Privileges</div>
                <div className="text-sm font-medium">Full Access (Root)</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="text-sm text-green-600 font-medium">Read-Only</div>
              </div>
            </div>
          </article>
        )}

        {admins.map((admin) => {
          const isSelf = session?.email === admin.email;
          return (
            <article
              key={admin.id}
              className="group rounded-xl border border-border bg-card p-5 transition hover:shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-2xl leading-tight">{admin.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{admin.email}</div>
                </div>
                <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditing(admin);
                      setOpen(true);
                    }}
                    className="rounded-md p-1.5 hover:bg-accent"
                    aria-label={`Edit ${admin.name}`}
                    title="Edit administrator"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  {isSelf ? (
                    <span className="rounded bg-accent/50 px-1.5 py-1 text-[10px] font-medium text-muted-foreground flex items-center">
                      You
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete administrator ${admin.name}?`)) {
                          try {
                            await deleteAdmin(admin.id);
                            toast.success("Administrator removed");
                          } catch (e: any) {
                            toast.error(e.message || "Failed to delete administrator");
                          }
                        }
                      }}
                      className="rounded-md p-1.5 text-destructive hover:bg-accent"
                      aria-label={`Delete ${admin.name}`}
                      title="Delete administrator"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-sm font-medium">{fmtDate(admin.createdAt)}</div>
                  <div className="text-muted-foreground">Created</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Full Access</div>
                  <div className="text-muted-foreground">Permissions</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {admins.length === 0 && !import.meta.env.VITE_ADMIN_EMAIL && (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <ShieldAlert className="size-12 text-muted-foreground/65" />
          <h3 className="mt-4 font-display text-xl">No administrators found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first database-backed administrator account to manage this system securely.
          </p>
        </div>
      )}

      {open && (
        <AdminDialog
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateAdmin(editing.id, data);
                toast.success("Administrator updated successfully");
              } else {
                await addAdmin(data as Omit<Admin, "id" | "createdAt">);
                toast.success("Administrator created successfully");
              }
              setOpen(false);
            } catch (e: any) {
              toast.error(e.message || "Failed to save administrator");
            }
          }}
        />
      )}
    </>
  );
}

function AdminDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Admin | null;
  onClose: () => void;
  onSave: (d: Partial<Admin>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");

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
            <h2 className="font-display text-2xl">{initial ? "Edit administrator" : "Create administrator"}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data: Partial<Admin> = { name, email };
            if (password) {
              data.password = password;
            }
            onSave(data);
          }}
        >
          <Field label="Full Name" value={name} onChange={setName} required />
          <Field label="Email Address" value={email} onChange={setEmail} type="email" required />
          <Field 
            label={initial ? "Password (leave blank to keep current)" : "Password"} 
            value={password} 
            onChange={setPassword} 
            type="password" 
            required={!initial} 
          />
          
          <div className="rounded-md bg-accent/20 p-3 text-xs text-muted-foreground">
            {initial 
              ? "Leave the password field blank if you do not wish to change it."
              : "Make sure to save these credentials securely. The new administrator will have full access to billing, branches, and system data."}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-ink py-2.5 text-sm text-paper hover:opacity-90 mt-2"
          >
            {initial ? "Save changes" : "Create administrator"}
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
