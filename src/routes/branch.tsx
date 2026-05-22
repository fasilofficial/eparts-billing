import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { LayoutDashboard, Package, Boxes, ReceiptText, BarChart3, Users, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";

const items: NavItem[] = [
  { to: "/branch", label: "Overview", icon: LayoutDashboard },
  { to: "/branch/customers", label: "Customers", icon: Users },
  { to: "/branch/repairs", label: "Repairs", icon: Wrench },
  { to: "/branch/products", label: "Products", icon: Package },
  { to: "/branch/inventory", label: "Inventory", icon: Boxes },
  { to: "/branch/billing", label: "New bill", icon: ReceiptText },
  { to: "/branch/reports", label: "Bills & Reports", icon: BarChart3 },
];

export const Route = createFileRoute("/branch")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("billing-session-v2");
      if (!raw) throw redirect({ to: "/login" });
      const s = JSON.parse(raw);
      if (s.role !== "branch") throw redirect({ to: "/admin" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: BranchLayout,
});

function BranchLayout() {
  const { session, branches } = useStore();
  const branch = branches.find((b) => b.id === session?.branchId);
  return (
    <DashboardLayout items={items} workspaceLabel="Branch" workspaceName={branch?.name ?? "Branch"}>
      <Outlet />
    </DashboardLayout>
  );
}
