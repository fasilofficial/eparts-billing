import { useMemo, useState, type FormEvent } from "react";
import { PageHeader, Stat } from "@/components/DashboardLayout";
import { useStore, type Category } from "@/lib/store";
import { FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar } from "@/components/ui/BulkActionBar";

export function CategoriesPage() {
  const { session, categories, addCategory, updateCategory, deleteCategory, deleteCategories } =
    useStore();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"Product" | "Expense">("Product");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const isAdmin = session?.role === "admin";

  const scoped = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.type === tab &&
          c.name.toLowerCase().includes(query.toLowerCase()) &&
          (status === "All" || (status === "Active" ? c.isActive : !c.isActive)),
      ),
    [categories, query, status, tab],
  );

  const scopedIds = useMemo(() => scoped.map((c) => c.id), [scoped]);
  const isAllSelected = scoped.length > 0 && scoped.every((c) => selectedIds.includes(c.id));
  const isSomeSelected = scoped.some((c) => selectedIds.includes(c.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !scopedIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...scopedIds])));
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
        title: `Delete ${count} categor${count > 1 ? "ies" : "y"}?`,
        description: `Are you sure you want to delete ${count} selected categor${count > 1 ? "ies" : "y"}? This action cannot be undone.`,
      }))
    ) {
      return;
    }

    try {
      setIsDeletingBulk(true);
      await deleteCategories(selectedIds);
      toast.success(`${count} categor${count > 1 ? "ies" : "y"} deleted`);
      setSelectedIds([]);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete selected categories");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const total = categories.filter((c) => c.type === tab).length;
  const active = categories.filter((c) => c.type === tab && c.isActive).length;

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Manage product and expense categories"
        actions={
          isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft"
            >
              <Plus className="size-4" /> New Category
            </button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => {
            setTab("Product");
            setQuery("");
            setSelectedIds([]);
          }}
          className={`group relative rounded-2xl border p-5 text-left transition duration-300 ${
            tab === "Product"
              ? "border-blue-500 bg-blue-50/50 shadow-soft shadow-blue-100 dark:border-blue-900/50 dark:bg-blue-950/20"
              : "border-border bg-card hover:bg-muted/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${tab === "Product" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
            >
              Inventory
            </span>
            {tab === "Product" && <span className="size-2 rounded-full bg-blue-500 animate-ping" />}
          </div>
          <div className="mt-2 font-display text-2xl">Product Categories</div>
          <p className="mt-1 text-xs text-muted-foreground">
            For products, materials, and services.
          </p>
        </button>

        <button
          onClick={() => {
            setTab("Expense");
            setQuery("");
            setSelectedIds([]);
          }}
          className={`group relative rounded-2xl border p-5 text-left transition duration-300 ${
            tab === "Expense"
              ? "border-rose-500 bg-rose-50/50 shadow-soft shadow-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20"
              : "border-border bg-card hover:bg-muted/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${tab === "Expense" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
            >
              Finance & Costs
            </span>
            {tab === "Expense" && <span className="size-2 rounded-full bg-rose-500 animate-ping" />}
          </div>
          <div className="mt-2 font-display text-2xl">Expense Categories</div>
          <p className="mt-1 text-xs text-muted-foreground">
            For overheads, operational, and office costs.
          </p>
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Stat
          label="Total Categories"
          value={String(total)}
          hint={`Total ${tab.toLowerCase()} categories registered`}
        />
        <Stat
          label="Active Categories"
          value={String(active)}
          hint={`Currently operational ${tab.toLowerCase()} categories`}
        />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "Product" ? "Search categories..." : "Search expense categories..."}
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3.5 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ink w-full sm:w-auto"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div className="flex items-center gap-2 sm:ml-auto">
          {isAdmin && scoped.length > 0 && (
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              <Checkbox
                checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
              />
              <span>Select all</span>
            </label>
          )}
          <div className="text-xs text-muted-foreground">
            {scoped.length} matching categories
          </div>
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={scoped.length}
        onClearSelection={() => setSelectedIds([])}
        onSelectAll={() => setSelectedIds(scopedIds)}
        onDelete={handleBulkDelete}
        isDeleting={isDeletingBulk}
        entityLabel="categories"
        className="mb-4"
      />

      {scoped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent/50 text-muted-foreground">
            <FolderTree className="size-6 text-muted-foreground" />
          </div>
          <div className="mt-4 text-base font-semibold">No categories found</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "Product"
              ? "Product categories will appear here"
              : "Expense categories will appear here"}
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90 shadow-soft cursor-pointer"
            >
              <Plus className="size-4" />
              {tab === "Product" ? "Create Category" : "Create Expense Category"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {scoped.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                className={`group flex items-center justify-between rounded-xl border bg-card p-5 transition shadow-sm ${
                  isSelected
                    ? "border-primary/50 ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                    : "border-border hover:border-border/80 hover:shadow-soft"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
                  {isAdmin && (
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(c.id)}
                        aria-label={`Select ${c.name}`}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-base truncate">{c.name}</div>
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {c.parentCategoryId && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Parent:{" "}
                        <span className="font-medium text-foreground/75">
                          {categories.find((pc) => pc.id === c.parentCategoryId)?.name ?? "Unknown"}
                        </span>
                      </div>
                    )}
                    {c.description && (
                      <p className="mt-1.5 truncate text-xs text-muted-foreground/90">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setOpen(true);
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
                      title="Edit Category"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          !(await confirm({
                            title: "Delete category?",
                            description: `Are you sure you want to delete category ${c.name}?`,
                          }))
                        )
                          return;
                        try {
                          await deleteCategory(c.id);
                          toast.success("Category deleted");
                          setSelectedIds((prev) => prev.filter((id) => id !== c.id));
                        } catch (e: any) {
                          toast.error(e.message || "Failed to delete category");
                        }
                      }}
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <CategoryDialog
          type={tab}
          categories={categories.filter((c) => c.type === tab)}
          initial={editing}
          onClose={close}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateCategory(editing.id, data);
                toast.success("Category updated");
              } else {
                await addCategory(data);
                toast.success("Category created");
              }
              close();
            } catch (e: any) {
              toast.error(e.message || "Failed to save category");
            }
          }}
        />
      )}
    </>
  );
}

function CategoryDialog({
  type,
  categories,
  initial,
  onClose,
  onSave,
}: {
  type: "Product" | "Expense";
  categories: Category[];
  initial: Category | null;
  onClose: () => void;
  onSave: (data: Omit<Category, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [parentCategoryId, setParentCategoryId] = useState(initial?.parentCategoryId ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      name,
      parentCategoryId: parentCategoryId || undefined,
      description: description || undefined,
      isActive,
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
          <h2 className="font-display text-2xl">
            {initial ? "Edit" : "Create"} {type} Category
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent transition">
            <X className="size-4" />
          </button>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          <Field
            label="Category Name *"
            value={name}
            onChange={setName}
            required
            placeholder="e.g., Electronics or Travel"
          />

          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Parent Category
            </span>
            <select
              value={parentCategoryId}
              onChange={(e) => setParentCategoryId(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
            >
              <option value="">None (Root Category)</option>
              {categories
                .filter((c) => c.id !== initial?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>

          <TextArea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Add context or notes..."
          />

          <label className="inline-flex items-center gap-2 cursor-pointer mt-1 py-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border text-ink focus:ring-ink focus:ring-offset-0 size-4 cursor-pointer"
            />
            <span className="text-sm select-none font-medium">Active</span>
          </label>

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
              {initial ? "Save changes" : "Create category"}
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
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
      />
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
        className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
      />
    </label>
  );
}
