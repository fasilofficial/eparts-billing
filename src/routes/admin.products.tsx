import { createFileRoute } from "@tanstack/react-router";
import { ProductInventoryPage } from "@/components/ProductInventoryPage";

export const Route = createFileRoute("/admin/products")({
  component: () => <ProductInventoryPage mode="admin" />,
});
