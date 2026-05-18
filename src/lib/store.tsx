import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "branch";

export interface Branch {
  id: string;
  name: string;
  email: string;
  password: string;
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
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
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
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  addBranch: (b: Omit<Branch, "id" | "createdAt">) => void;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addBill: (b: Omit<Bill, "id" | "number" | "createdAt">) => Bill;
}

const ADMIN_EMAIL = "admin@billing.app";
const ADMIN_PASSWORD = "admin123";
const DEMO_BRANCH_EMAIL = "downtown@billing.app";
const DEMO_BRANCH_PASSWORD = "branch123";

const KEY = "billing-store-v1";
const SESSION_KEY = "billing-session-v1";

const persistSession = (nextSession: Session | null) => {
  if (typeof window === "undefined") return;
  try {
    if (nextSession) localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Demo auth should still unlock the UI if browser storage is unavailable.
  }
};

const seed = (): StoreState => {
  const b1 = {
    id: "br_1",
    name: "Downtown Flagship",
    email: "downtown@billing.app",
    password: "branch123",
    address: "12 Market Street",
    createdAt: new Date().toISOString(),
  };
  const b2 = {
    id: "br_2",
    name: "Northgate Branch",
    email: "northgate@billing.app",
    password: "branch123",
    address: "88 North Ave",
    createdAt: new Date().toISOString(),
  };
  const b3 = {
    id: "br_3",
    name: "Harbor Outlet",
    email: "harbor@billing.app",
    password: "branch123",
    address: "4 Pier Road",
    createdAt: new Date().toISOString(),
  };
  const products: Product[] = [];
  const names = [
    "Espresso Blend 250g",
    "Ceramic Mug",
    "Cold Brew Bottle",
    "Artisan Croissant",
    "Matcha Tin",
    "Reusable Tote",
    "Drip Filter Pack",
    "Single Origin 1kg",
  ];
  [b1, b2, b3].forEach((b, bi) => {
    names.forEach((n, i) => {
      products.push({
        id: `p_${bi}_${i}`,
        branchId: b.id,
        name: n,
        sku: `SKU-${bi}${i}${100 + i}`,
        price: 8 + i * 3 + bi,
        stock: (i + 1) * 5 + (i === 2 ? -10 : 0),
        category: i < 4 ? "Beverage" : "Goods",
      });
    });
  });
  const bills: Bill[] = [];
  for (let i = 0; i < 14; i++) {
    const branch = [b1, b2, b3][i % 3];
    const items: BillItem[] = [
      { productId: `p_${i % 3}_0`, name: names[0], price: 12, qty: 1 + (i % 3) },
      { productId: `p_${i % 3}_3`, name: names[3], price: 5, qty: 2 },
    ];
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const tax = +(subtotal * 0.05).toFixed(2);
    bills.push({
      id: `bl_${i}`,
      number: `INV-${1000 + i}`,
      branchId: branch.id,
      customer: ["Walk-in", "Sarah K.", "James L.", "—"][i % 4],
      items,
      subtotal,
      tax,
      total: +(subtotal + tax).toFixed(2),
      createdAt: new Date(Date.now() - i * 86400000 * 0.6).toISOString(),
    });
  }
  return { branches: [b1, b2, b3], products, bills };
};

const load = (): StoreState => {
  if (typeof window === "undefined") return { branches: [], products: [], bills: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return repairDemoStore(JSON.parse(raw));
  } catch {
    // Fall back to a fresh demo store if saved browser data is unreadable.
  }
  const s = seed();
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // The in-memory demo store is enough for the current page session.
  }
  return s;
};

const repairDemoStore = (value: unknown): StoreState => {
  if (!value || typeof value !== "object") return seed();
  const state = value as Partial<StoreState>;
  if (
    !Array.isArray(state.branches) ||
    !Array.isArray(state.products) ||
    !Array.isArray(state.bills)
  ) {
    return seed();
  }

  const seeded = seed();
  const demoBranch = seeded.branches.find((b) => b.email === DEMO_BRANCH_EMAIL);
  if (!demoBranch)
    return { branches: state.branches, products: state.products, bills: state.bills };

  const demoBranchIndex = state.branches.findIndex((b) => b.email === DEMO_BRANCH_EMAIL);
  if (demoBranchIndex >= 0) {
    return {
      branches: state.branches.map((branch, index) =>
        index === demoBranchIndex
          ? { ...demoBranch, ...branch, email: DEMO_BRANCH_EMAIL, password: DEMO_BRANCH_PASSWORD }
          : branch,
      ),
      products: state.products,
      bills: state.bills,
    };
  }

  return {
    branches: [demoBranch, ...state.branches],
    products: [...seeded.products.filter((p) => p.branchId === demoBranch.id), ...state.products],
    bills: [...seeded.bills.filter((b) => b.branchId === demoBranch.id), ...state.bills],
  };
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({ branches: [], products: [], bills: [] });
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      // Ignore unreadable stale sessions and let the user sign in again.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Keep the in-memory demo store usable even when persistence fails.
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    persistSession(session);
  }, [session, hydrated]);

  const value: StoreCtx = {
    ...state,
    session,
    login: (email, password) => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const nextSession: Session = { role: "admin", email };
        persistSession(nextSession);
        setSession(nextSession);
        return { ok: true };
      }
      let branches = state.branches;
      if (email === DEMO_BRANCH_EMAIL && password === DEMO_BRANCH_PASSWORD) {
        const repaired = repairDemoStore(state);
        branches = repaired.branches;
        if (repaired !== state) {
          setState(repaired);
          try {
            localStorage.setItem(KEY, JSON.stringify(repaired));
          } catch {
            // Demo branch login can continue with the repaired in-memory store.
          }
        }
      }
      const b = branches.find((x) => x.email === email && x.password === password);
      if (b) {
        const nextSession: Session = { role: "branch", branchId: b.id, email };
        persistSession(nextSession);
        setSession(nextSession);
        return { ok: true };
      }
      return { ok: false, error: "Invalid credentials" };
    },
    logout: () => {
      persistSession(null);
      setSession(null);
    },
    addBranch: (b) =>
      setState((s) => ({
        ...s,
        branches: [
          ...s.branches,
          { ...b, id: `br_${Date.now()}`, createdAt: new Date().toISOString() },
        ],
      })),
    updateBranch: (id, patch) =>
      setState((s) => ({
        ...s,
        branches: s.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      })),
    deleteBranch: (id) =>
      setState((s) => ({
        ...s,
        branches: s.branches.filter((b) => b.id !== id),
        products: s.products.filter((p) => p.branchId !== id),
        bills: s.bills.filter((bl) => bl.branchId !== id),
      })),
    addProduct: (p) =>
      setState((s) => ({ ...s, products: [...s.products, { ...p, id: `p_${Date.now()}` }] })),
    updateProduct: (id, patch) =>
      setState((s) => ({
        ...s,
        products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })),
    deleteProduct: (id) =>
      setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) })),
    addBill: (b) => {
      const number = `INV-${1000 + state.bills.length + 1}`;
      const bill: Bill = {
        ...b,
        id: `bl_${Date.now()}`,
        number,
        createdAt: new Date().toISOString(),
      };
      setState((s) => {
        // decrement stock
        const products = s.products.map((p) => {
          const it = b.items.find((i) => i.productId === p.id);
          return it ? { ...p, stock: p.stock - it.qty } : p;
        });
        return { ...s, bills: [bill, ...s.bills], products };
      });
      return bill;
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
export const BRANCH_DEMO_CREDS = { email: DEMO_BRANCH_EMAIL, password: DEMO_BRANCH_PASSWORD };

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
