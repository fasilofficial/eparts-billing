import { createFileRoute } from "@tanstack/react-router";
import { CategoriesPage } from "@/components/CategoriesPage";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});
