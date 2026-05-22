import { createFileRoute } from "@tanstack/react-router";
import { PaymentAccountsPage } from "@/components/PaymentAccountsPage";

export const Route = createFileRoute("/admin/payment-accounts")({
  component: () => <PaymentAccountsPage mode="admin" />,
});
