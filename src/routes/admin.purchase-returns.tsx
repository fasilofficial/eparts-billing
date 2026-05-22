import { createFileRoute } from "@tanstack/react-router";
import { ReturnsPage } from "@/components/ReturnsPage";

export const Route = createFileRoute("/admin/purchase-returns")({
  component: () => <ReturnsPage mode="admin" type="Purchase" />,
});
