import { createFileRoute } from "@tanstack/react-router";
import { RepairsPage } from "@/components/RepairsPage";

export const Route = createFileRoute("/admin/repairs")({
  component: () => <RepairsPage mode="admin" />,
});
