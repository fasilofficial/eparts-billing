import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import { LayoutDashboard, Building2, Package, Boxes, Receipt } from "lucide-react";

const items: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/branches", label: "Branches", icon: Building2 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/bills", label: "Billing & Reports", icon: Receipt },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("billing-session-v1");
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
