import { createFileRoute } from "@tanstack/react-router";
import { StaffPage } from "@/components/StaffPage";

export const Route = createFileRoute("/admin/staff")({
  component: () => <StaffPage mode="admin" />,
});
