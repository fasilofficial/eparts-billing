import React from "react";
import { Trash2, X, CheckSquare } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
  entityLabel?: string;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDelete,
  isDeleting = false,
  entityLabel = "items",
  className = "",
}) => {
  if (selectedCount === 0) return null;

  const isAllSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 px-4 py-2.5 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-paper">
          <CheckSquare className="size-3.5" />
          {selectedCount} selected
        </span>
        <span className="text-muted-foreground text-xs sm:text-sm">
          of {totalCount} {entityLabel}
        </span>
        {onSelectAll && !isAllSelected && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs font-medium text-primary hover:underline ml-1 cursor-pointer"
          >
            Select all {totalCount}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          {isDeleting ? "Deleting..." : `Delete (${selectedCount})`}
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          disabled={isDeleting}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          title="Clear selection"
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};
