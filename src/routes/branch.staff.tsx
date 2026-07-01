import { createFileRoute } from "@tanstack/react-router";
import { StaffPage } from "@/components/StaffPage";

export const Route = createFileRoute("/branch/staff")({
  component: () => <StaffPage mode="branch" />,
});
