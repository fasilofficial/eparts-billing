import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/DashboardLayout";
import { ExportExcelButton } from "@/components/admin/ExportExcelButton";
import { useStore, fmtMoney, type Product } from "@/lib/store";
import { Package, Pencil, Plus, ScanLine, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox } from "./ImageLightbox";
import { supabase } from "@/lib/supabase";

const units = ["Pieces", "Hours", "Days", "Kg", "Meter", "Box"];
const taxes = ["No Tax", "GST 5%", "GST 12%", "GST 18%", "GST 28%"];

export function ProductInventoryPage({ mode }: { mode: "admin" | "branch" }) {
  const { session, branches, products, addProduct, updateProduct, deleteProduct } = useStore();
  const isAdmin = mode === "admin";
  const defaultBranchId = isAdmin ? session?.defaultBranchId || branches[0]?.id || "" : session?.branchId || "";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState(isAdmin ? "all" : defaultBranchId);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    photos: string[];
    currentIndex: number;
  }>({ isOpen: false, photos: [], currentIndex: 0 });

  const scoped = useMemo(
    () =>
      products.filter((product) => {
        if (!isAdmin && product.branchId !== session?.branchId) return false;
        if (isAdmin && branchFilter !== "all" && product.branchId !== branchFilter) return false;
        return `${product.name} ${product.sku} ${product.barcode ?? ""} ${product.category ?? ""} ${product.brand ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
      }),
    [branchFilter, isAdmin, products, query, session?.branchId],
  );

  const stats = useMemo(() => {
    const stockProducts = scoped.filter((p) => (p.type ?? "Product") === "Product");
    const lowStock = stockProducts.filter((p) => p.stock > 0 && p.stock <= (p.lowStockAlert ?? 10)).length;
    const outOfStock = stockProducts.filter((p) => p.stock <= 0).length;
    const value = stockProducts.reduce((sum, p) => sum + p.stock * (p.costPrice ?? 0), 0);
    return { total: scoped.length, lowStock, outOfStock, value };
  }, [scoped]);

  const exportRows = scoped.map((p) => {
    const branch = branches.find((b) => b.id === p.branchId);
    return [p.name, p.sku, p.type ?? "Product", branch?.name ?? "", String(p.stock), String(p.sellingPrice ?? p.price), p.category ?? "", p.brand ?? ""];
  });

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title={isAdmin ? "All products & services" : "Products & services"}
        description="Manage stock-tracked products, services, pricing, brands, categories, and low-stock alerts."
        actions={
          <>
            <ExportExcelButton
              filename={isAdmin ? "products-catalog" : "branch-products"}
              headers={["Name", "SKU", "Type", "Branch", "Stock", "Selling Price", "Category", "Brand"]}
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
              <Plus className="size-4" /> Add product
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Total Products" value={String(stats.total)} />
        <Stat label="Low Stock" value={String(stats.lowStock)} />
        <Stat label="Out of Stock" value={String(stats.outOfStock)} />
        <Stat label="Inventory Value" value={fmtMoney(stats.value)} />
      </div>

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <input
          placeholder="Search name, SKU, barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink"
        />
        {isAdmin && (
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ink">
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        )}
        <div className="text-xs text-muted-foreground sm:ml-auto">{scoped.length} items</div>
      </div>

      <div className="responsive-table rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium">SKU</th>
              {isAdmin && <th className="px-5 py-3 text-left font-medium">Branch</th>}
              <th className="px-5 py-3 text-left font-medium">Type</th>
              <th className="px-5 py-3 text-right font-medium">Stock</th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {scoped.map((product) => {
              const branch = branches.find((b) => b.id === product.branchId);
              const low = (product.type ?? "Product") === "Product" && product.stock <= (product.lowStockAlert ?? 10);
              return (
                <tr key={product.id} className="group border-b border-border/60 transition hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {product.image && product.image.startsWith("http") ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLightbox({
                              isOpen: true,
                              photos: [product.image!],
                              currentIndex: 0,
                            });
                          }}
                          className="size-10 flex-shrink-0 rounded-md border border-border overflow-hidden bg-muted hover:opacity-80 transition"
                          title="Click to preview image"
                        >
                          <img src={product.image} alt="" className="size-full object-cover" />
                        </button>
                      ) : (
                        <div className="size-10 flex-shrink-0 rounded-md border border-border flex items-center justify-center bg-muted text-muted-foreground">
                          <Package className="size-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.category || "Uncategorized"} {product.brand ? `· ${product.brand}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground num">{product.sku}</td>
                  {isAdmin && <td className="px-5 py-3 text-muted-foreground">{branch?.name ?? "-"}</td>}
                  <td className="px-5 py-3">{product.type ?? "Product"}</td>
                  <td className={`px-5 py-3 text-right num ${low ? "text-destructive" : ""}`}>
                    {(product.type ?? "Product") === "Service" ? "-" : product.stock}
                  </td>
                  <td className="px-5 py-3 text-right num">{fmtMoney(product.sellingPrice ?? product.price)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button type="button" onClick={() => { setEditing(product); setOpen(true); }} className="rounded-md p-1.5 hover:bg-accent" aria-label={`Edit ${product.name}`}>
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Delete ${product.name}?`)) return;
                          try {
                            await deleteProduct(product.id);
                            toast.success("Product deleted");
                          } catch (e: any) {
                            toast.error(e.message || "Failed to delete product");
                          }
                        }}
                        className="rounded-md p-1.5 text-destructive hover:bg-accent"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {scoped.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-5 py-12 text-center text-muted-foreground">
                  No products or services found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <ProductDialog
          isAdmin={isAdmin}
          branches={branches}
          defaultBranchId={defaultBranchId}
          initial={editing}
          allProducts={products}
          onClose={closeDialog}
          onSave={async (data) => {
            try {
              const payload = isAdmin ? data : { ...data, branchId: session!.branchId! };
              if (editing) {
                await updateProduct(editing.id, payload);
                toast.success("Product updated");
              } else {
                await addProduct(payload as Omit<Product, "id">);
                toast.success("Product added");
              }
              closeDialog();
            } catch (e: any) {
              toast.error(e.message || "Failed to save product");
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

function ProductDialog({
  isAdmin,
  branches,
  defaultBranchId,
  initial,
  allProducts,
  onClose,
  onSave,
}: {
  isAdmin: boolean;
  branches: { id: string; name: string }[];
  defaultBranchId: string;
  initial: Product | null;
  allProducts: Product[];
  onClose: () => void;
  onSave: (data: Omit<Product, "id">) => void;
}) {
  const [branchId, setBranchId] = useState(initial?.branchId ?? defaultBranchId);
  const [type, setType] = useState<"Product" | "Service">(initial?.type ?? "Product");
  const [image, setImage] = useState(initial?.image ?? "");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [costPrice, setCostPrice] = useState(String(initial?.costPrice ?? 0));
  const [sellingPrice, setSellingPrice] = useState(String(initial?.sellingPrice ?? initial?.price ?? 0));
  const [tax, setTax] = useState(initial?.tax ?? "No Tax");
  const [unit, setUnit] = useState(initial?.unit ?? "Pieces");
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [lowStockAlert, setLowStockAlert] = useState(String(initial?.lowStockAlert ?? 10));
  const [trackBySerialNumbers, setTrackBySerialNumbers] = useState(initial?.trackBySerialNumbers ?? false);

  const categories = Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean))) as string[];
  const brands = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean))) as string[];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    let imageUrl = image;

    if (newFile) {
      setUploading(true);
      const toastId = toast.loading("Uploading image...");
      try {
        const fileExt = newFile.name.split('.').pop();
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const fileName = `${uniqueId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
          .from("repairs")
          .upload(filePath, newFile, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("repairs")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
        toast.dismiss(toastId);
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Image upload failed: ${err.message}`);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const cleanSku = sku.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    onSave({
      branchId,
      type,
      image: imageUrl,
      name: name.trim(),
      sku: cleanSku,
      barcode: barcode || undefined,
      category: category || undefined,
      brand: brand || undefined,
      description: description || undefined,
      isActive,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      price: Number(sellingPrice) || 0,
      tax,
      unit,
      stock: type === "Service" ? 0 : Number(stock) || 0,
      lowStockAlert: Number(lowStockAlert) || 10,
      trackBySerialNumbers: type === "Product" && trackBySerialNumbers,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-paper" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{initial ? "Edit" : "New"}</div>
            <h2 className="font-display text-2xl">{initial ? "Edit product/service" : "Add product/service"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-accent" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <form className="grid gap-5" onSubmit={submit}>
          {isAdmin && (
            <SelectField label="Branch *" value={branchId} onChange={setBranchId} options={branches.map((b) => b.name)} values={branches.map((b) => b.id)} required />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {(["Product", "Service"] as const).map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setType(option)}
                className={`rounded-xl border p-4 text-left ${type === option ? "border-ink bg-ink text-paper" : "border-border bg-background hover:bg-accent"}`}
              >
                <div className="font-medium">{option}</div>
                <div className={`mt-1 text-xs ${type === option ? "text-paper/80" : "text-muted-foreground"}`}>
                  {option === "Product" ? "Physical item with stock tracking" : "No stock tracking required"}
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Image</span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      setNewFile(file);
                      setImage(file.name);
                    }
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
                />
                {(image || newFile) && (
                  <div className="relative group size-10 flex-shrink-0 rounded-md border border-border overflow-hidden bg-muted">
                    <img
                      src={newFile ? URL.createObjectURL(newFile) : image}
                      alt=""
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage("");
                        setNewFile(null);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-ink/50 text-paper opacity-0 group-hover:opacity-100 transition"
                      title="Remove image"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <Field label="Product name *" value={name} onChange={setName} required />
            <Field label="SKU" value={sku} onChange={setSku} placeholder="Auto-generated if empty" />
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Barcode</span>
              <div className="relative">
                <ScanLine className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm outline-none focus:border-ink" />
              </div>
            </label>
            <ComboField label="Category" value={category} onChange={setCategory} options={categories} placeholder="+ create category" />
            <ComboField label="Brand" value={brand} onChange={setBrand} options={brands} placeholder="+ create brand" />
          </div>
          <TextArea label="Description" value={description} onChange={setDescription} />
          <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (Available for sale)
          </label>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Cost price *" type="number" step="0.01" value={costPrice} onChange={setCostPrice} required />
            <Field label="Selling price *" type="number" step="0.01" value={sellingPrice} onChange={setSellingPrice} required />
            <SelectField label="Tax" value={tax} onChange={setTax} options={taxes} />
            <SelectField label="Unit *" value={unit} onChange={setUnit} options={units} required />
          </div>

          {type === "Product" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Initial stock" type="number" value={stock} onChange={setStock} />
              <Field label="Low stock alert" type="number" value={lowStockAlert} onChange={setLowStockAlert} helper="Alert when stock falls below this" />
              <label className="flex items-center gap-2 self-end rounded-md border border-border bg-background px-3 py-2 text-sm">
                <input type="checkbox" checked={trackBySerialNumbers} onChange={(e) => setTrackBySerialNumbers(e.target.checked)} />
                Track by serial numbers
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
            <button type="submit" disabled={uploading} className="rounded-md bg-ink px-4 py-2 text-sm text-paper hover:opacity-90 disabled:opacity-50">
              {uploading ? "Uploading..." : (initial ? "Save changes" : "Create product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 num text-xl font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, step, helper, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string; helper?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} step={step} required={required} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" />
      {helper && <span className="text-xs text-muted-foreground">{helper}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, values, required }: { label: string; value: string; onChange: (value: string) => void; options: string[]; values?: string[]; required?: boolean }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink">
        <option value="">Select</option>
        {options.map((option, index) => (
          <option key={values?.[index] ?? option} value={values?.[index] ?? option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComboField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string }) {
  const id = `${label.toLowerCase()}-options`;
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input list={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink" />
    </label>
  );
}
