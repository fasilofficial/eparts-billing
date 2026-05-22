import { createFileRoute } from "@tanstack/react-router";
import { AccountTransfersPage } from "@/components/AccountTransfersPage";

export const Route = createFileRoute("/admin/account-transfers")({
  component: () => <AccountTransfersPage mode="admin" />,
});
