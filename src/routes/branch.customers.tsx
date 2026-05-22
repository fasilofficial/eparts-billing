import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/components/CustomersPage";

export const Route = createFileRoute("/branch/customers")({
  component: () => <CustomersPage mode="branch" />,
});
