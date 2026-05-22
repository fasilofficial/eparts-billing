import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/components/BillingPage";

export const Route = createFileRoute("/admin/billing")({
  component: () => <BillingPage mode="admin" />,
});
