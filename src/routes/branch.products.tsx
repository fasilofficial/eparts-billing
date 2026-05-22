import { createFileRoute } from "@tanstack/react-router";
import { ProductInventoryPage } from "@/components/ProductInventoryPage";

export const Route = createFileRoute("/branch/products")({
  component: () => <ProductInventoryPage mode="branch" />,
});
