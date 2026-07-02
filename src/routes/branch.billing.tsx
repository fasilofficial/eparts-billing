import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/components/BillingPage";

export const Route = createFileRoute("/branch/billing")({
  validateSearch: (search: Record<string, unknown>) => ({
    repairId: (search.repairId as string | undefined) ?? undefined,
  }),
  component: () => <BillingPage mode="branch" />,
});
