import { createFileRoute } from "@tanstack/react-router";
import { BrandsPage } from "@/components/BrandsPage";

export const Route = createFileRoute("/admin/brands")({
  component: BrandsPage,
});
