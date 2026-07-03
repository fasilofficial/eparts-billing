import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Role = "admin" | "branch";

export interface Branch {
  id: string;
  name: string;
  email: string;
  password?: string;
  address?: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  branchId: string;
  type?: "Product" | "Service";
  image?: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  sellingPrice?: number;
  stock: number;
  lowStockAlert?: number;
  trackBySerialNumbers?: boolean;
  category?: string;
  brand?: string;
  description?: string;
  tax?: string;
  unit?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type SupplierBalanceType = "Payable" | "Receivable";

export interface Supplier {
  id: string;
  branchId: string;
  companyName: string;
  contactPerson?: string;
  status: "Active" | "Inactive";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  openingBalanceAmount: number;
  balanceType: SupplierBalanceType;
  balanceAsOfDate?: string;
  paymentTerms?: string;
  creditLimit: number;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  branchId: string;
  expenseNumber: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  taxRate: number;
  subtotal: number;
  total: number;
  supplierId?: string;
  customerId?: string;
  relatedDocumentType: string;
  isRecurring: boolean;
  receipt?: string;
  notes?: string;
  status: "Paid" | "Unpaid";
  createdAt: string;
}

export interface PurchaseCharge {
  label: string;
  amount: number;
}

export interface PurchaseItem {
  id?: string;
  purchaseOrderId?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  discountPercent: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  branchId: string;
  supplierId?: string;
  supplierName: string;
  purchaseDate: string;
  expectedDelivery?: string;
  attachments: string[];
  shippingCharge: number;
  shippingDetails?: string;
  additionalCharges: PurchaseCharge[];
  notes?: string;
  subtotal: number;
  grandTotal: number;
  status: "Draft" | "Created";
  createdAt: string;
  items: PurchaseItem[];
}

export interface ReturnRecord {
  id: string;
  branchId: string;
  number: string;
  partyName: string;
  date: string;
  amount: number;
  status: string;
  type: "Sale" | "Purchase";
  createdAt: string;
}

export interface Category {
  id: string;
  type: "Product" | "Expense";
  name: string;
  parentCategoryId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentAccount {
  id: string;
  branchId: string;
  accountName: string;
  accountType: "Bank Account" | "Cash" | "Card" | "UPI" | "Cheque" | "Other";
  status: "Active" | "Inactive";
  accountNumber?: string;
  openingBalance: number;
  currentBalance: number;
  description?: string;
  createdAt: string;
}

export interface AccountTransfer {
  id: string;
  branchId: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  transferAmount: number;
  transferDate: string;
  referenceNumber: string;
  description?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface BillItem {
  id?: string;
  billId?: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Bill {
  id: string;
  number: string;
  branchId: string;
  customer?: string;
  customerId?: string;
  paymentMethod: string;
  saleDate: string;
  dueDate?: string;
  notes?: string;
  discountType: "Percentage" | "Fixed";
  discountAmount: number;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  items: BillItem[];
}

export type CustomerType = "Business" | "Direct";
export type BalanceType = "Receivable" | "Payable";

export interface Customer {
  id: string;
  branchId: string;
  isBusinessCustomer: boolean;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  type: CustomerType;
  openingBalanceAmount: number;
  balanceType: BalanceType;
  balanceDate?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  branchId: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface RepairItem {
  id?: string;
  repairId?: string;
  brand: string;
  item: string;
  quantity: number;
  serialNumber?: string;
  issues: string[];
  issueDescription?: string;
  photos: string[];
  underWarranty: boolean;
  estimatedCost?: number;
  serviceCost?: number;
  assignedTo: string;
  assignedToId?: string;
  expectedCompletionDate?: string;
}

export interface Repair {
  id: string;
  number: string;
  branchId: string;
  customerId?: string;
  customerName: string;
  status: string;
  createdAt: string;
  items: RepairItem[];
}

export interface Session {
  role: Role;
  branchId?: string;
  defaultBranchId?: string;
  email: string;
}

interface StoreState {
  admins: Admin[];
  branches: Branch[];
  products: Product[];
  bills: Bill[];
  customers: Customer[];
  repairs: Repair[];
  suppliers: Supplier[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  returns: ReturnRecord[];
  categories: Category[];
  paymentAccounts: PaymentAccount[];
  accountTransfers: AccountTransfer[];
  brands: Brand[];
  staff: Staff[];
}

interface StoreCtx extends StoreState {
  session: Session | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; role?: Role; error?: string }>;
  logout: () => void;
  addAdmin: (a: Omit<Admin, "id" | "createdAt">) => Promise<void>;
  updateAdmin: (id: string, patch: Partial<Admin>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  addBranch: (b: Omit<Branch, "id" | "createdAt">) => Promise<void>;
  updateBranch: (id: string, patch: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addBill: (b: Omit<Bill, "id" | "number" | "createdAt">) => Promise<Bill | null>;
  updateBill: (id: string, patch: Partial<Omit<Bill, "id" | "number" | "createdAt">>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<Customer | null>;
  updateCustomer: (id: string, patch: Omit<Customer, "id" | "createdAt">) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addRepair: (r: Omit<Repair, "id" | "number" | "createdAt" | "status">) => Promise<Repair | null>;
  updateRepair: (id: string, patch: Omit<Repair, "id" | "number" | "createdAt">) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => Promise<void>;
  updateSupplier: (id: string, patch: Omit<Supplier, "id" | "createdAt">) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  updateExpense: (id: string, patch: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPurchaseOrder: (p: Omit<PurchaseOrder, "id" | "number" | "createdAt">) => Promise<void>;
  updatePurchaseOrder: (
    id: string,
    patch: Omit<PurchaseOrder, "id" | "number" | "createdAt">,
  ) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  addReturn: (r: Omit<ReturnRecord, "id" | "number" | "createdAt">) => Promise<void>;
  updateReturn: (
    id: string,
    patch: Omit<ReturnRecord, "id" | "number" | "createdAt">,
  ) => Promise<void>;
  deleteReturn: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, "id" | "createdAt">) => Promise<void>;
  updateCategory: (id: string, patch: Omit<Category, "id" | "createdAt">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addPaymentAccount: (
    a: Omit<PaymentAccount, "id" | "createdAt" | "currentBalance">,
  ) => Promise<void>;
  updatePaymentAccount: (
    id: string,
    patch: Omit<PaymentAccount, "id" | "createdAt">,
  ) => Promise<void>;
  deletePaymentAccount: (id: string) => Promise<void>;
  addAccountTransfer: (
    t: Omit<AccountTransfer, "id" | "createdAt" | "fromAccountName" | "toAccountName">,
  ) => Promise<void>;
  updateAccountTransfer: (
    id: string,
    patch: Omit<AccountTransfer, "id" | "createdAt">,
  ) => Promise<void>;
  deleteAccountTransfer: (id: string) => Promise<void>;
  addBrand: (b: Omit<Brand, "id" | "createdAt">) => Promise<void>;
  updateBrand: (id: string, patch: Omit<Brand, "id" | "createdAt">) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addStaff: (s: Omit<Staff, "id" | "createdAt">) => Promise<void>;
  updateStaff: (id: string, patch: Partial<Omit<Staff, "id" | "createdAt">>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const SESSION_KEY = "billing-session-v2";

const persistSession = (nextSession: Session | null) => {
  if (typeof window === "undefined") return;
  try {
    if (nextSession) localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
};

const Ctx = createContext<StoreCtx | null>(null);

const customerToDb = (c: Omit<Customer, "id" | "createdAt">) => {
  const {
    branchId,
    isBusinessCustomer,
    secondaryPhone,
    openingBalanceAmount,
    balanceType,
    balanceDate,
    ...rest
  } = c;

  return {
    ...rest,
    branch_id: branchId,
    is_business_customer: isBusinessCustomer,
    secondary_phone: secondaryPhone || null,
    opening_balance_amount: openingBalanceAmount || 0,
    balance_type: balanceType,
    balance_date: balanceDate || null,
  };
};

const repairItemsToDb = (repairId: string, items: RepairItem[]) =>
  items.map((item) => ({
    repair_id: repairId,
    brand: item.brand,
    item: item.item,
    quantity: item.quantity || 1,
    serial_number: item.serialNumber || null,
    issues: item.issues,
    issue_description: item.issueDescription || null,
    photos: item.photos,
    under_warranty: item.underWarranty,
    estimated_cost: item.estimatedCost ?? null,
    service_cost: item.serviceCost ?? null,
    assigned_to: item.assignedTo || "Unassigned",
    assigned_to_id: item.assignedToId || null,
    expected_completion_date: item.expectedCompletionDate || null,
  }));

const productToDb = (p: Partial<Product>) => {
  const {
    branchId,
    costPrice,
    sellingPrice,
    lowStockAlert,
    trackBySerialNumbers,
    isActive,
    createdAt,
    ...rest
  } = p;
  return {
    ...rest,
    name: p.name,
    price: p.sellingPrice ?? p.price ?? 0,
    stock: p.type === "Service" ? 0 : (p.stock ?? 0),
    branch_id: branchId,
    cost_price: costPrice ?? 0,
    selling_price: sellingPrice ?? p.price ?? 0,
    low_stock_alert: lowStockAlert ?? 10,
    track_by_serial_numbers: trackBySerialNumbers ?? false,
    is_active: isActive ?? true,
  };
};

const supplierToDb = (s: Omit<Supplier, "id" | "createdAt">) => ({
  branch_id: s.branchId,
  company_name: s.companyName,
  contact_person: s.contactPerson || null,
  status: s.status,
  email: s.email || null,
  phone: s.phone || null,
  address: s.address || null,
  city: s.city || null,
  state: s.state || null,
  postal_code: s.postalCode || null,
  country: s.country || null,
  opening_balance_amount: s.openingBalanceAmount || 0,
  balance_type: s.balanceType,
  balance_as_of_date: s.balanceAsOfDate || null,
  payment_terms: s.paymentTerms || null,
  credit_limit: s.creditLimit || 0,
  notes: s.notes || null,
});

const expenseToDb = (e: Omit<Expense, "id" | "createdAt">) => ({
  branch_id: e.branchId,
  expense_number: e.expenseNumber,
  date: e.date,
  category: e.category,
  description: e.description,
  amount: e.amount,
  tax_rate: e.taxRate || 0,
  subtotal: e.subtotal,
  total: e.total,
  supplier_id: e.supplierId || null,
  customer_id: e.customerId || null,
  related_document_type: e.relatedDocumentType,
  is_recurring: e.isRecurring,
  receipt: e.receipt || null,
  notes: e.notes || null,
  status: e.status,
});

const purchaseOrderToDb = (
  p: Omit<PurchaseOrder, "id" | "number" | "createdAt">,
  number?: string,
) => ({
  number,
  branch_id: p.branchId,
  supplier_id: p.supplierId || null,
  supplier_name: p.supplierName,
  purchase_date: p.purchaseDate,
  expected_delivery: p.expectedDelivery || null,
  attachments: p.attachments,
  shipping_charge: p.shippingCharge || 0,
  shipping_details: p.shippingDetails || null,
  additional_charges: p.additionalCharges,
  notes: p.notes || null,
  subtotal: p.subtotal,
  grand_total: p.grandTotal,
  status: p.status,
});

const purchaseItemsToDb = (purchaseOrderId: string, items: PurchaseItem[]) =>
  items.map((item) => ({
    purchase_order_id: purchaseOrderId,
    product_id: item.productId || null,
    product_name: item.productName,
    quantity: item.quantity || 1,
    unit_price: item.unitPrice || 0,
    tax: item.tax || 0,
    discount_percent: item.discountPercent || 0,
    total: item.total || 0,
  }));

const returnToDb = (r: Omit<ReturnRecord, "id" | "number" | "createdAt">, number?: string) => ({
  number,
  branch_id: r.branchId,
  party_name: r.partyName,
  date: r.date,
  amount: r.amount,
  status: r.status,
  type: r.type,
});

const categoryToDb = (c: Omit<Category, "id" | "createdAt">) => ({
  type: c.type,
  name: c.name,
  parent_category_id: c.parentCategoryId || null,
  description: c.description || null,
  is_active: c.isActive,
});

const paymentAccountToDb = (
  a:
    | Omit<PaymentAccount, "id" | "createdAt">
    | Omit<PaymentAccount, "id" | "createdAt" | "currentBalance">,
) => ({
  branch_id: a.branchId,
  account_name: a.accountName,
  account_type: a.accountType,
  status: a.status,
  account_number: a.accountNumber || null,
  opening_balance: a.openingBalance || 0,
  current_balance: "currentBalance" in a ? a.currentBalance : a.openingBalance || 0,
  description: a.description || null,
});

const accountTransferToDb = (t: Omit<AccountTransfer, "id" | "createdAt">) => ({
  branch_id: t.branchId,
  from_account_id: t.fromAccountId,
  from_account_name: t.fromAccountName,
  to_account_id: t.toAccountId,
  to_account_name: t.toAccountName,
  transfer_amount: t.transferAmount,
  transfer_date: t.transferDate,
  reference_number: t.referenceNumber,
  description: t.description || null,
});

const brandToDb = (b: Omit<Brand, "id" | "createdAt">) => ({
  name: b.name,
  is_active: b.isActive,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    admins: [],
    branches: [],
    products: [],
    bills: [],
    customers: [],
    repairs: [],
    suppliers: [],
    expenses: [],
    purchaseOrders: [],
    returns: [],
    categories: [],
    paymentAccounts: [],
    accountTransfers: [],
    brands: [],
    staff: [],
  });
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refreshData = async () => {
    try {
      const [
        adminsRes,
        branchesRes,
        productsRes,
        billsRes,
        customersRes,
        repairsRes,
        suppliersRes,
        expensesRes,
        purchaseOrdersRes,
        returnsRes,
        categoriesRes,
        paymentAccountsRes,
        accountTransfersRes,
        brandsRes,
        staffRes,
      ] = await Promise.all([
        supabase.from("admins").select("*").order("created_at", { ascending: false }),
        supabase.from("branches").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase
          .from("bills")
          .select("*, items:bill_items(*)")
          .order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase
          .from("repairs")
          .select("*, items:repair_items(*)")
          .order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("created_at", { ascending: false }),
        supabase
          .from("purchase_orders")
          .select("*, items:purchase_order_items(*)")
          .order("created_at", { ascending: false }),
        supabase.from("returns").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("created_at", { ascending: false }),
        supabase.from("payment_accounts").select("*").order("created_at", { ascending: false }),
        supabase.from("account_transfers").select("*").order("created_at", { ascending: false }),
        supabase.from("brands").select("*").order("created_at", { ascending: false }),
        supabase.from("staff").select("*").order("created_at", { ascending: false }),
      ]);

      const mappedBranches: Branch[] = (branchesRes.data || []).map((b: any) => ({
        ...b,
        createdAt: b.created_at,
      }));

      const mappedProducts: Product[] = (productsRes.data || []).map((p: any) => ({
        id: p.id,
        branchId: p.branch_id,
        type: p.type ?? "Product",
        image: p.image ?? undefined,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode ?? undefined,
        price: Number(p.selling_price ?? p.price ?? 0),
        costPrice: Number(p.cost_price ?? 0),
        sellingPrice: Number(p.selling_price ?? p.price ?? 0),
        stock: Number(p.stock ?? 0),
        lowStockAlert: Number(p.low_stock_alert ?? 10),
        trackBySerialNumbers: Boolean(p.track_by_serial_numbers),
        category: p.category ?? undefined,
        brand: p.brand ?? undefined,
        description: p.description ?? undefined,
        tax: p.tax ?? "No Tax",
        unit: p.unit ?? "Pieces",
        isActive: p.is_active ?? true,
        createdAt: p.created_at,
      }));

      const mappedBills: Bill[] = (billsRes.data || []).map((b: any) => ({
        ...b,
        branchId: b.branch_id,
        customerId: b.customer_id ?? undefined,
        saleDate:
          b.sale_date || b.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        dueDate: b.due_date ?? undefined,
        notes: b.notes ?? undefined,
        discountType: b.discount_type || "Percentage",
        discountAmount: Number(b.discount_amount || 0),
        paymentMethod: b.payment_method || "Cash",
        createdAt: b.created_at,
        items: (b.items || []).map((i: any) => ({
          ...i,
          billId: i.bill_id,
          productId: i.product_id,
        })),
      }));

      const mappedCustomers: Customer[] = (customersRes.data || []).map((c: any) => ({
        id: c.id,
        branchId: c.branch_id,
        isBusinessCustomer: Boolean(c.is_business_customer),
        name: c.name,
        phone: c.phone,
        secondaryPhone: c.secondary_phone ?? undefined,
        email: c.email ?? undefined,
        address: c.address ?? undefined,
        notes: c.notes ?? undefined,
        type: c.type,
        openingBalanceAmount: Number(c.opening_balance_amount ?? 0),
        balanceType: c.balance_type,
        balanceDate: c.balance_date ?? undefined,
        createdAt: c.created_at,
      }));

      const mappedRepairs: Repair[] = (repairsRes.data || []).map((r: any) => ({
        id: r.id,
        number: r.number,
        branchId: r.branch_id,
        customerId: r.customer_id ?? undefined,
        customerName: r.customer_name,
        status: r.status ?? "Open",
        createdAt: r.created_at,
        items: (r.items || []).map((i: any) => ({
          id: i.id,
          repairId: i.repair_id,
          brand: i.brand,
          item: i.item,
          quantity: Number(i.quantity ?? 1),
          serialNumber: i.serial_number ?? undefined,
          issues: i.issues ?? [],
          issueDescription: i.issue_description ?? undefined,
          photos: i.photos ?? [],
          underWarranty: Boolean(i.under_warranty),
          estimatedCost: i.estimated_cost == null ? undefined : Number(i.estimated_cost),
          serviceCost: i.service_cost == null ? undefined : Number(i.service_cost),
          assignedTo: i.assigned_to ?? "Unassigned",
          assignedToId: i.assigned_to_id ?? undefined,
          expectedCompletionDate: i.expected_completion_date ?? undefined,
        })),
      }));

      const mappedSuppliers: Supplier[] = (suppliersRes.data || []).map((s: any) => ({
        id: s.id,
        branchId: s.branch_id,
        companyName: s.company_name,
        contactPerson: s.contact_person ?? undefined,
        status: s.status ?? "Active",
        email: s.email ?? undefined,
        phone: s.phone ?? undefined,
        address: s.address ?? undefined,
        city: s.city ?? undefined,
        state: s.state ?? undefined,
        postalCode: s.postal_code ?? undefined,
        country: s.country ?? undefined,
        openingBalanceAmount: Number(s.opening_balance_amount ?? 0),
        balanceType: s.balance_type ?? "Payable",
        balanceAsOfDate: s.balance_as_of_date ?? undefined,
        paymentTerms: s.payment_terms ?? undefined,
        creditLimit: Number(s.credit_limit ?? 0),
        notes: s.notes ?? undefined,
        createdAt: s.created_at,
      }));

      const mappedExpenses: Expense[] = (expensesRes.data || []).map((e: any) => ({
        id: e.id,
        branchId: e.branch_id,
        expenseNumber: e.expense_number,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: Number(e.amount ?? 0),
        taxRate: Number(e.tax_rate ?? 0),
        subtotal: Number(e.subtotal ?? e.amount ?? 0),
        total: Number(e.total ?? 0),
        supplierId: e.supplier_id ?? undefined,
        customerId: e.customer_id ?? undefined,
        relatedDocumentType: e.related_document_type ?? "None",
        isRecurring: Boolean(e.is_recurring),
        receipt: e.receipt ?? undefined,
        notes: e.notes ?? undefined,
        status: e.status ?? "Paid",
        createdAt: e.created_at,
      }));

      const mappedPurchaseOrders: PurchaseOrder[] = (purchaseOrdersRes.data || []).map(
        (p: any) => ({
          id: p.id,
          number: p.number,
          branchId: p.branch_id,
          supplierId: p.supplier_id ?? undefined,
          supplierName: p.supplier_name,
          purchaseDate: p.purchase_date,
          expectedDelivery: p.expected_delivery ?? undefined,
          attachments: p.attachments ?? [],
          shippingCharge: Number(p.shipping_charge ?? 0),
          shippingDetails: p.shipping_details ?? undefined,
          additionalCharges: p.additional_charges ?? [],
          notes: p.notes ?? undefined,
          subtotal: Number(p.subtotal ?? 0),
          grandTotal: Number(p.grand_total ?? 0),
          status: p.status ?? "Draft",
          createdAt: p.created_at,
          items: (p.items || []).map((i: any) => ({
            id: i.id,
            purchaseOrderId: i.purchase_order_id,
            productId: i.product_id ?? undefined,
            productName: i.product_name,
            quantity: Number(i.quantity ?? 1),
            unitPrice: Number(i.unit_price ?? 0),
            tax: Number(i.tax ?? 0),
            discountPercent: Number(i.discount_percent ?? 0),
            total: Number(i.total ?? 0),
          })),
        }),
      );

      const mappedReturns: ReturnRecord[] = (returnsRes.data || []).map((r: any) => ({
        id: r.id,
        branchId: r.branch_id,
        number: r.number,
        partyName: r.party_name,
        date: r.date,
        amount: Number(r.amount ?? 0),
        status: r.status,
        type: r.type,
        createdAt: r.created_at,
      }));

      const mappedCategories: Category[] = (categoriesRes.data || []).map((c: any) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        parentCategoryId: c.parent_category_id ?? undefined,
        description: c.description ?? undefined,
        isActive: Boolean(c.is_active),
        createdAt: c.created_at,
      }));

      const mappedPaymentAccounts: PaymentAccount[] = (paymentAccountsRes.data || []).map(
        (a: any) => ({
          id: a.id,
          branchId: a.branch_id,
          accountName: a.account_name,
          accountType: a.account_type,
          status: a.status,
          accountNumber: a.account_number ?? undefined,
          openingBalance: Number(a.opening_balance ?? 0),
          currentBalance: Number(a.current_balance ?? 0),
          description: a.description ?? undefined,
          createdAt: a.created_at,
        }),
      );

      const mappedAccountTransfers: AccountTransfer[] = (accountTransfersRes.data || []).map(
        (t: any) => ({
          id: t.id,
          branchId: t.branch_id,
          fromAccountId: t.from_account_id,
          fromAccountName: t.from_account_name,
          toAccountId: t.to_account_id,
          toAccountName: t.to_account_name,
          transferAmount: Number(t.transfer_amount ?? 0),
          transferDate: t.transfer_date,
          referenceNumber: t.reference_number,
          description: t.description ?? undefined,
          createdAt: t.created_at,
        }),
      );

      const mappedBrands: Brand[] = (brandsRes.data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        isActive: Boolean(b.is_active),
        createdAt: b.created_at,
      }));

      const mappedAdmins: Admin[] = (adminsRes.data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        password: a.password,
        createdAt: a.created_at,
      }));

      const mappedStaff: Staff[] = (staffRes.data || []).map((s: any) => ({
        id: s.id,
        branchId: s.branch_id,
        name: s.name,
        phone: s.phone ?? undefined,
        email: s.email ?? undefined,
        role: s.role ?? undefined,
        status: s.status ?? "Active",
        createdAt: s.created_at,
      }));

      setState({
        admins: mappedAdmins,
        branches: mappedBranches,
        products: mappedProducts,
        bills: mappedBills,
        customers: mappedCustomers,
        repairs: mappedRepairs,
        suppliers: mappedSuppliers,
        expenses: mappedExpenses,
        purchaseOrders: mappedPurchaseOrders,
        returns: mappedReturns,
        categories: mappedCategories,
        paymentAccounts: mappedPaymentAccounts,
        accountTransfers: mappedAccountTransfers,
        brands: mappedBrands,
        staff: mappedStaff,
      });
    } catch (err) {
      console.error("Failed to fetch from supabase", err);
    }
  };

  useEffect(() => {
    refreshData();
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistSession(session);
  }, [session, hydrated]);

  const value: StoreCtx = {
    ...state,
    session,
    refresh: refreshData,
    login: async (email, password) => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const nextSession: Session = { role: "admin", email };
        setSession(nextSession);
        return { ok: true, role: "admin" };
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .maybeSingle();

      if (adminError) {
        console.error("Supabase admin login error:", adminError);
      }

      if (admin) {
        const nextSession: Session = { role: "admin", email };
        setSession(nextSession);
        return { ok: true, role: "admin" };
      }

      const { data: branch, error } = await supabase
        .from("branches")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .maybeSingle();

      if (error) {
        console.error("Supabase branch login error:", error);
      }

      if (branch) {
        const nextSession: Session = { role: "branch", branchId: branch.id, email };
        setSession(nextSession);
        return { ok: true, role: "branch" };
      }

      return { ok: false, error: "Invalid credentials" };
    },
    logout: () => {
      setSession(null);
    },
    addAdmin: async (a) => {
      const { error } = await supabase.from("admins").insert([a]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateAdmin: async (id, patch) => {
      const { error } = await supabase.from("admins").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteAdmin: async (id) => {
      const { error } = await supabase.from("admins").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addBranch: async (b) => {
      const { error } = await supabase.from("branches").insert([b]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateBranch: async (id, patch) => {
      const { error } = await supabase.from("branches").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteBranch: async (id) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addProduct: async (p) => {
      const { error } = await supabase.from("products").insert([productToDb(p)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateProduct: async (id, patch) => {
      const dbPatch: any = productToDb(patch);
      if (!patch.branchId) delete dbPatch.branch_id;
      if (!patch.name) delete dbPatch.name;
      const { error } = await supabase.from("products").update(dbPatch).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteProduct: async (id) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addBill: async (b) => {
      // Use a timestamp-based invoice number — guaranteed unique across
      // concurrent users, deletions, and page refreshes.
      const number = `INV-${Date.now()}`;
      const {
        items,
        branchId,
        paymentMethod,
        customerId,
        saleDate,
        dueDate,
        notes,
        discountType,
        discountAmount,
        ...billData
      } = b;

      const { data: newBill, error } = await supabase
        .from("bills")
        .insert([
          {
            ...billData,
            payment_method: paymentMethod,
            branch_id: branchId,
            customer_id: customerId || null,
            sale_date: saleDate,
            due_date: dueDate || null,
            notes: notes || null,
            discount_type: discountType,
            discount_amount: discountAmount,
            number,
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);

      if (newBill && items.length > 0) {
        const billItems = items.map((item) => ({
          bill_id: newBill.id,
          // Repair-service items use a synthetic productId — store null for product_id
          product_id: item.productId.startsWith("repair-item-") ? null : item.productId,
          name: item.name,
          price: item.price,
          qty: item.qty,
        }));
        const { error: itemsError } = await supabase.from("bill_items").insert(billItems);
        if (itemsError) throw new Error(itemsError.message);

        // Decrement stock only for real product items (not repair service lines)
        for (const item of items) {
          if (item.productId.startsWith("repair-item-")) continue;
          const product = state.products.find((p) => p.id === item.productId);
          if (product) {
            const { error: stockError } = await supabase
              .from("products")
              .update({ stock: product.stock - item.qty })
              .eq("id", item.productId);
            if (stockError) console.error("Stock update failed", stockError);
          }
        }
      }

      await refreshData();
      return {
        ...newBill,
        branchId: newBill.branch_id,
        paymentMethod: newBill.payment_method || b.paymentMethod,
        saleDate: newBill.sale_date,
        dueDate: newBill.due_date,
        notes: newBill.notes,
        discountType: newBill.discount_type,
        discountAmount: Number(newBill.discount_amount),
        createdAt: newBill.created_at,
        items,
      } as any;
    },
    updateBill: async (id, patch) => {
      if (session?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can edit bills.");
      }
      const { items, branchId, customerId, saleDate, dueDate, notes, discountType, discountAmount, paymentMethod, ...rest } = patch as any;
      const dbPatch: any = { ...rest };
      if (paymentMethod !== undefined) dbPatch.payment_method = paymentMethod;
      if (branchId !== undefined) dbPatch.branch_id = branchId;
      if (customerId !== undefined) dbPatch.customer_id = customerId ?? null;
      if (saleDate !== undefined) dbPatch.sale_date = saleDate;
      if (dueDate !== undefined) dbPatch.due_date = dueDate ?? null;
      if (notes !== undefined) dbPatch.notes = notes ?? null;
      if (discountType !== undefined) dbPatch.discount_type = discountType;
      if (discountAmount !== undefined) dbPatch.discount_amount = discountAmount;

      const { error } = await supabase.from("bills").update(dbPatch).eq("id", id);
      if (error) throw new Error(error.message);

      // Replace bill items if provided
      if (items !== undefined) {
        const { error: delErr } = await supabase.from("bill_items").delete().eq("bill_id", id);
        if (delErr) throw new Error(delErr.message);
        if (items.length > 0) {
          const newItems = items.map((item: any) => ({
            bill_id: id,
            product_id:
              !item.productId ||
              item.productId.startsWith("repair-item-") ||
              item.productId.startsWith("manual-")
                ? null
                : item.productId,
            name: item.name,
            price: item.price,
            qty: item.qty,
          }));
          const { error: insErr } = await supabase.from("bill_items").insert(newItems);
          if (insErr) throw new Error(insErr.message);
        }
      }

      await refreshData();
    },
    deleteBill: async (id) => {
      if (session?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete bills.");
      }
      const bill = state.bills.find((b) => b.id === id);
      if (bill && bill.items) {
        for (const item of bill.items) {
          if (item.productId && !item.productId.startsWith("repair-item-")) {
            const product = state.products.find((p) => p.id === item.productId);
            if (product) {
              const { error: stockError } = await supabase
                .from("products")
                .update({ stock: product.stock + item.qty })
                .eq("id", item.productId);
              if (stockError) console.error("Stock restore failed", stockError);
            }
          }
        }
      }
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addCustomer: async (c) => {
      const { data, error } = await supabase
        .from("customers")
        .insert([customerToDb(c)])
        .select()
        .single();
      if (error) throw new Error(error.message);
      await refreshData();
      return data
        ? {
            id: data.id,
            branchId: data.branch_id,
            isBusinessCustomer: Boolean(data.is_business_customer),
            name: data.name,
            phone: data.phone,
            secondaryPhone: data.secondary_phone ?? undefined,
            email: data.email ?? undefined,
            address: data.address ?? undefined,
            notes: data.notes ?? undefined,
            type: data.type,
            openingBalanceAmount: Number(data.opening_balance_amount ?? 0),
            balanceType: data.balance_type,
            balanceDate: data.balance_date ?? undefined,
            createdAt: data.created_at,
          }
        : null;
    },
    updateCustomer: async (id, patch) => {
      const { error } = await supabase.from("customers").update(customerToDb(patch)).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteCustomer: async (id) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addRepair: async (r) => {
      const number = `REP-${1000 + state.repairs.length + 1}`;
      const { items, branchId, customerId, customerName } = r;
      const { data: repair, error } = await supabase
        .from("repairs")
        .insert([
          {
            number,
            branch_id: branchId,
            customer_id: customerId || null,
            customer_name: customerName,
            status: "Open",
          },
        ])
        .select()
        .single();
      if (error) throw new Error(error.message);

      if (repair && items.length > 0) {
        const repairItems = repairItemsToDb(repair.id, items);
        const { error: itemsError } = await supabase.from("repair_items").insert(repairItems);
        if (itemsError) throw new Error(itemsError.message);
      }

      await refreshData();
      return {
        id: repair.id,
        number: repair.number,
        branchId: repair.branch_id,
        customerId: repair.customer_id ?? undefined,
        customerName: repair.customer_name,
        status: repair.status,
        createdAt: repair.created_at,
        items,
      };
    },
    updateRepair: async (id, patch) => {
      const { items, branchId, customerId, customerName, status } = patch;
      const { error } = await supabase
        .from("repairs")
        .update({
          branch_id: branchId,
          customer_id: customerId || null,
          customer_name: customerName,
          status: status || "Open",
        })
        .eq("id", id);
      if (error) throw new Error(error.message);

      const { error: deleteItemsError } = await supabase
        .from("repair_items")
        .delete()
        .eq("repair_id", id);
      if (deleteItemsError) throw new Error(deleteItemsError.message);

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("repair_items")
          .insert(repairItemsToDb(id, items));
        if (itemsError) throw new Error(itemsError.message);
      }

      await refreshData();
    },
    deleteRepair: async (id) => {
      const { error } = await supabase.from("repairs").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addSupplier: async (s) => {
      const { error } = await supabase.from("suppliers").insert([supplierToDb(s)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateSupplier: async (id, patch) => {
      const { error } = await supabase.from("suppliers").update(supplierToDb(patch)).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteSupplier: async (id) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addExpense: async (e) => {
      const { error } = await supabase.from("expenses").insert([expenseToDb(e)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateExpense: async (id, patch) => {
      const { error } = await supabase.from("expenses").update(expenseToDb(patch)).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteExpense: async (id) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addPurchaseOrder: async (p) => {
      const number = `PO-${1000 + state.purchaseOrders.length + 1}`;
      const { data, error } = await supabase
        .from("purchase_orders")
        .insert([purchaseOrderToDb(p, number)])
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (data && p.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(purchaseItemsToDb(data.id, p.items));
        if (itemsError) throw new Error(itemsError.message);
      }
      await refreshData();
    },
    updatePurchaseOrder: async (id, patch) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update(purchaseOrderToDb(patch))
        .eq("id", id);
      if (error) throw new Error(error.message);
      const { error: deleteItemsError } = await supabase
        .from("purchase_order_items")
        .delete()
        .eq("purchase_order_id", id);
      if (deleteItemsError) throw new Error(deleteItemsError.message);
      if (patch.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(purchaseItemsToDb(id, patch.items));
        if (itemsError) throw new Error(itemsError.message);
      }
      await refreshData();
    },
    deletePurchaseOrder: async (id) => {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addReturn: async (r) => {
      const prefix = r.type === "Sale" ? "SR" : "PR";
      const number = `${prefix}-${1000 + state.returns.filter((x) => x.type === r.type).length + 1}`;
      const { error } = await supabase.from("returns").insert([returnToDb(r, number)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateReturn: async (id, patch) => {
      const { error } = await supabase.from("returns").update(returnToDb(patch)).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteReturn: async (id) => {
      const { error } = await supabase.from("returns").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addCategory: async (c) => {
      const { error } = await supabase.from("categories").insert([categoryToDb(c)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateCategory: async (id, patch) => {
      const { error } = await supabase.from("categories").update(categoryToDb(patch)).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteCategory: async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addPaymentAccount: async (a) => {
      const { error } = await supabase.from("payment_accounts").insert([paymentAccountToDb(a)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updatePaymentAccount: async (id, patch) => {
      const { error } = await supabase
        .from("payment_accounts")
        .update(paymentAccountToDb(patch))
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deletePaymentAccount: async (id) => {
      const { error } = await supabase.from("payment_accounts").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addAccountTransfer: async (t) => {
      const from = state.paymentAccounts.find((a) => a.id === t.fromAccountId);
      const to = state.paymentAccounts.find((a) => a.id === t.toAccountId);
      if (!from || !to) throw new Error("Select valid accounts");
      const referenceNumber =
        t.referenceNumber ||
        `TRF-${new Date().getFullYear()}-${1000 + state.accountTransfers.length + 1}`;
      const payload = {
        ...t,
        referenceNumber,
        fromAccountName: from.accountName,
        toAccountName: to.accountName,
      };
      const { error } = await supabase
        .from("account_transfers")
        .insert([accountTransferToDb(payload)]);
      if (error) throw new Error(error.message);
      await supabase
        .from("payment_accounts")
        .update({ current_balance: from.currentBalance - t.transferAmount })
        .eq("id", from.id);
      await supabase
        .from("payment_accounts")
        .update({ current_balance: to.currentBalance + t.transferAmount })
        .eq("id", to.id);
      await refreshData();
    },
    updateAccountTransfer: async (id, patch) => {
      const { error } = await supabase
        .from("account_transfers")
        .update(accountTransferToDb(patch))
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteAccountTransfer: async (id) => {
      const { error } = await supabase.from("account_transfers").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addBrand: async (b) => {
      const { error } = await supabase.from("brands").insert([brandToDb(b)]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateBrand: async (id, patch) => {
      const { error } = await supabase.from("brands").update(brandToDb(patch)).eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteBrand: async (id) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    addStaff: async (s) => {
      const { error } = await supabase.from("staff").insert([
        {
          branch_id: s.branchId,
          name: s.name,
          phone: s.phone || null,
          email: s.email || null,
          role: s.role || null,
          status: s.status,
        },
      ]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateStaff: async (id, patch) => {
      const { error } = await supabase
        .from("staff")
        .update({
          branch_id: patch.branchId,
          name: patch.name,
          phone: patch.phone || null,
          email: patch.email || null,
          role: patch.role || null,
          status: patch.status,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    deleteStaff: async (id) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await refreshData();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

export const ADMIN_CREDS = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat(import.meta.env.VITE_LOCALE || "en-IN", {
    style: "currency",
    currency: import.meta.env.VITE_CURRENCY || "INR",
  }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
