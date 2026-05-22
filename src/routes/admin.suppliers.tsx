import { createFileRoute } from "@tanstack/react-router";
import { SuppliersPage } from "@/components/SuppliersPage";

export const Route = createFileRoute("/admin/suppliers")({
  component: () => <SuppliersPage mode="admin" />,
});
