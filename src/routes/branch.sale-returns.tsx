import { createFileRoute } from "@tanstack/react-router";
import { ReturnsPage } from "@/components/ReturnsPage";

export const Route = createFileRoute("/branch/sale-returns")({
  component: () => <ReturnsPage mode="branch" type="Sale" />,
});
