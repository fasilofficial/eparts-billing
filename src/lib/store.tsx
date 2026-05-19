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

export interface Session {
  role: Role;
  branchId?: string;
  email: string;
}

interface StoreState {
  branches: Branch[];
  products: Product[];
  bills: Bill[];
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({ branches: [], products: [], bills: [] });
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refreshData = async () => {
    try {
      const [branchesRes, productsRes, billsRes] = await Promise.all([
        supabase.from("branches").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("bills").select("*, items:bill_items(*)").order("created_at", { ascending: false }),
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

      setState({
        branches: mappedBranches,
        products: mappedProducts,
        bills: mappedBills,
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
