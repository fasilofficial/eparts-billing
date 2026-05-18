import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export function SortableTableHead({
  label,
  active,
  direction,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={cn("px-5 py-3 font-medium", className)}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 uppercase tracking-widest transition hover:text-foreground"
      >
        {label}
        <Icon className={cn("size-3.5", active ? "text-foreground" : "text-muted-foreground/60")} />
      </button>
    </th>
  );
}
