import { useMemo } from "react";
import { useStore, fmtMoney } from "@/lib/store";
import { Trophy, Medal } from "lucide-react";

export function BranchLeaderboard({ currentBranchId }: { currentBranchId?: string }) {
  const { branches, bills } = useStore();

  const leaderboard = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return branches
      .map((branch) => {
        const revenue = bills
          .filter(
            (b) =>
              b.branchId === branch.id && new Date(b.createdAt).getTime() >= monthStart.getTime(),
          )
          .reduce((sum, b) => sum + b.total, 0);
        return { id: branch.id, name: branch.name, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [branches, bills]);

  const currentRank = leaderboard.findIndex((b) => b.id === currentBranchId) + 1;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Branch leaderboard</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Top performers this month — keep climbing.
          </p>
        </div>
        {currentRank > 0 && (
          <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] num">
            You&apos;re #{currentRank}
          </span>
        )}
      </div>

      <ol className="mt-5 space-y-2">
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isCurrent = entry.id === currentBranchId;
          return (
            <li
              key={entry.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                isCurrent ? "border-ink/30 bg-ink/5" : "border-border/60 bg-background/50"
              }`}
            >
              <RankBadge rank={rank} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{entry.name}</div>
                {isCurrent && (
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Your branch
                  </div>
                )}
              </div>
              <div className="text-sm num font-medium">{fmtMoney(entry.revenue)}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900">
        <Trophy className="size-4" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
        <Medal className="size-4" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-900">
        <Medal className="size-4" />
      </span>
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-xs num text-muted-foreground">
      {rank}
    </span>
  );
}
