import { createFileRoute } from "@tanstack/react-router";
import { SuppliersPage } from "@/components/SuppliersPage";

export const Route = createFileRoute("/branch/suppliers")({
  component: () => <SuppliersPage mode="branch" />,
});
