import { createFileRoute } from "@tanstack/react-router";
import { ReturnsPage } from "@/components/ReturnsPage";

export const Route = createFileRoute("/admin/sale-returns")({
  component: () => <ReturnsPage mode="admin" type="Sale" />,
});
