import { createFileRoute } from "@tanstack/react-router";
import { PaymentAccountsPage } from "@/components/PaymentAccountsPage";

export const Route = createFileRoute("/branch/payment-accounts")({
  component: () => <PaymentAccountsPage mode="branch" />,
});
