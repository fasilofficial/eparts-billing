import { createFileRoute } from "@tanstack/react-router";
import { PurchaseOrdersPage } from "@/components/PurchaseOrdersPage";

export const Route = createFileRoute("/branch/purchases")({
  component: () => <PurchaseOrdersPage mode="branch" />,
});
