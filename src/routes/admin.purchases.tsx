import { createFileRoute } from "@tanstack/react-router";
import { PurchaseOrdersPage } from "@/components/PurchaseOrdersPage";

export const Route = createFileRoute("/admin/purchases")({
  component: () => <PurchaseOrdersPage mode="admin" />,
});
