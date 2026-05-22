import { createFileRoute } from "@tanstack/react-router";
import { AccountTransfersPage } from "@/components/AccountTransfersPage";

export const Route = createFileRoute("/branch/account-transfers")({
  component: () => <AccountTransfersPage mode="branch" />,
});
