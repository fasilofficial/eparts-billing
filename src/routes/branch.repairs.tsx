import { createFileRoute } from "@tanstack/react-router";
import { RepairsPage } from "@/components/RepairsPage";

export const Route = createFileRoute("/branch/repairs")({
  component: () => <RepairsPage mode="branch" />,
});
