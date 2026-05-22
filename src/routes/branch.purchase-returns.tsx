import { createFileRoute } from "@tanstack/react-router";
import { ReturnsPage } from "@/components/ReturnsPage";

export const Route = createFileRoute("/branch/purchase-returns")({
  component: () => <ReturnsPage mode="branch" type="Purchase" />,
});
