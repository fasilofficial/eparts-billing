import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { LayoutDashboard, Building2, Package, Boxes, Receipt, ReceiptText, Users, Wrench, Truck, ShoppingCart, WalletCards, RotateCcw, FolderTree, BadgeCheck, Landmark, ArrowLeftRight } from "lucide-react";

const items: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/branches", label: "Branches", icon: Building2 },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/repairs", label: "Repairs", icon: Wrench },
  { to: "/admin/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/admin/purchase-returns", label: "Purchase Returns", icon: RotateCcw },
  { to: "/admin/expenses", label: "Expenses", icon: WalletCards },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/brands", label: "Brands", icon: BadgeCheck },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/billing", label: "New bill", icon: ReceiptText },
  { to: "/admin/sale-returns", label: "Sale Returns", icon: RotateCcw },
  { to: "/admin/payment-accounts", label: "Payment Accounts", icon: Landmark },
  { to: "/admin/account-transfers", label: "Transfers", icon: ArrowLeftRight },
  { to: "/admin/bills", label: "Billing & Reports", icon: Receipt },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("billing-session-v2");
      if (!raw) throw redirect({ to: "/login" });
      const s = JSON.parse(raw);
      if (s.role !== "admin") throw redirect({ to: "/branch" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <DashboardLayout items={items} workspaceLabel="Workspace" workspaceName="Headquarters">
      <Outlet />
    </DashboardLayout>
  );
}
