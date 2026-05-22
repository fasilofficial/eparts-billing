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

export interface Product {
  id: string;
  branchId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category?: string;
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
  paymentMethod: string;
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
  branches: Branch[];
  products: Product[];
  bills: Bill[];
  customers: Customer[];
  repairs: Repair[];
}

interface StoreCtx extends StoreState {
  session: Session | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addBranch: (b: Omit<Branch, "id" | "createdAt">) => Promise<void>;
  updateBranch: (id: string, patch: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addBill: (b: Omit<Bill, "id" | "number" | "createdAt">) => Promise<Bill | null>;
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<Customer | null>;
  updateCustomer: (id: string, patch: Omit<Customer, "id" | "createdAt">) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addRepair: (r: Omit<Repair, "id" | "number" | "createdAt" | "status">) => Promise<Repair | null>;
  updateRepair: (id: string, patch: Omit<Repair, "id" | "number" | "createdAt">) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
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
    expected_completion_date: item.expectedCompletionDate || null,
  }));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    branches: [],
    products: [],
    bills: [],
    customers: [],
    repairs: [],
  });
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refreshData = async () => {
    try {
      const [branchesRes, productsRes, billsRes, customersRes, repairsRes] = await Promise.all([
        supabase.from("branches").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("bills").select("*, items:bill_items(*)").order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("repairs").select("*, items:repair_items(*)").order("created_at", { ascending: false }),
      ]);

      const mappedBranches: Branch[] = (branchesRes.data || []).map((b: any) => ({
        ...b,
        createdAt: b.created_at
      }));

      const mappedProducts: Product[] = (productsRes.data || []).map((p: any) => ({
        ...p,
        branchId: p.branch_id
      }));

      const mappedBills: Bill[] = (billsRes.data || []).map((b: any) => ({
        ...b,
        branchId: b.branch_id,
        paymentMethod: b.payment_method || "Cash",
        createdAt: b.created_at,
        items: (b.items || []).map((i: any) => ({
          ...i,
          billId: i.bill_id,
          productId: i.product_id
        }))
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
        createdAt: c.created_at
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
          expectedCompletionDate: i.expected_completion_date ?? undefined,
        }))
      }));

      setState({
        branches: mappedBranches,
        products: mappedProducts,
        bills: mappedBills,
        customers: mappedCustomers,
        repairs: mappedRepairs,
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
        return { ok: true };
      }
      
      const { data: branch, error } = await supabase
        .from("branches")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .maybeSingle();
        
      if (error) {
        console.error("Supabase login error:", error);
      }
        
      if (branch) {
        const nextSession: Session = { role: "branch", branchId: branch.id, email };
        setSession(nextSession);
        return { ok: true };
      }
      
      return { ok: false, error: "Invalid credentials" };
    },
    logout: () => {
      setSession(null);
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
      const { branchId, ...rest } = p;
      const { error } = await supabase.from("products").insert([{ ...rest, branch_id: branchId }]);
      if (error) throw new Error(error.message);
      await refreshData();
    },
    updateProduct: async (id, patch) => {
      const dbPatch: any = { ...patch };
      if (patch.branchId) {
        dbPatch.branch_id = patch.branchId;
        delete dbPatch.branchId;
      }
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
      const number = `INV-${1000 + state.bills.length + 1}`;
      const { items, branchId, paymentMethod, ...billData } = b;
      
      const { data: newBill, error } = await supabase
        .from("bills")
        .insert([{ ...billData, payment_method: paymentMethod, branch_id: branchId, number }])
        .select()
        .single();
        
      if (error) throw new Error(error.message);
        
      if (newBill && items.length > 0) {
        const billItems = items.map(item => ({
          bill_id: newBill.id,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          qty: item.qty
        }));
        const { error: itemsError } = await supabase.from("bill_items").insert(billItems);
        if (itemsError) throw new Error(itemsError.message);
        
        // Decrement stock for each item
        for (const item of items) {
          const product = state.products.find(p => p.id === item.productId);
          if (product) {
            const { error: stockError } = await supabase.from("products").update({ stock: product.stock - item.qty }).eq("id", item.productId);
            if (stockError) console.error("Stock update failed", stockError);
          }
        }
      }
      
      await refreshData();
      return {
        ...newBill,
        branchId: newBill.branch_id,
        paymentMethod: newBill.payment_method || b.paymentMethod,
        createdAt: newBill.created_at,
        items
      } as any;
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
        .insert([{
          number,
          branch_id: branchId,
          customer_id: customerId || null,
          customer_name: customerName,
          status: "Open",
        }])
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

      const { error: deleteItemsError } = await supabase.from("repair_items").delete().eq("repair_id", id);
      if (deleteItemsError) throw new Error(deleteItemsError.message);

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("repair_items").insert(repairItemsToDb(id, items));
        if (itemsError) throw new Error(itemsError.message);
      }

      await refreshData();
    },
    deleteRepair: async (id) => {
      const { error } = await supabase.from("repairs").delete().eq("id", id);
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
    currency: import.meta.env.VITE_CURRENCY || "INR" 
  }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
