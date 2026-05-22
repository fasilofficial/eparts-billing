import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/components/CustomersPage";

export const Route = createFileRoute("/admin/customers")({
  component: () => <CustomersPage mode="admin" />,
});
