import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { LogOut, Menu, X } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardLayout({
  items,
  workspaceLabel,
  workspaceName,
  children,
}: {
  items: NavItem[];
  workspaceLabel: string;
  workspaceName: string;
  children: ReactNode;
}) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { logout } = useStore();
  const nav = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const signOut = () => {
    logout();
    nav({ to: "/login" });
  };
  const isActive = (to: string) => {
    const active = path === to || (to !== "/admin" && to !== "/branch" && path.startsWith(to));
    const exactRoot = (to === "/admin" || to === "/branch") && path === to;
    return exactRoot || active;
  };

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-ink" />
            <span className="tracking-widest uppercase">Ledger</span>
          </div>
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{workspaceLabel}</div>
            <div className="mt-1 font-display text-xl leading-tight">{workspaceName}</div>
          </div>
        </div>
        <nav className="flex-1 px-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive(it.to)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{it.label}</span>
                {isActive(it.to) && <span className="ml-auto size-1.5 rounded-full bg-ink" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md border border-border bg-card p-2 text-foreground"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>
          <div className="min-w-0 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{workspaceLabel}</div>
            <div className="truncate text-sm font-medium">{workspaceName}</div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md border border-border bg-card p-2 text-muted-foreground"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 md:px-10 md:py-12">{children}</div>
      </main>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative flex h-full w-[min(22rem,88vw)] flex-col border-r border-border bg-sidebar shadow-paper">
            <div className="flex items-start justify-between px-5 py-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-2 rounded-full bg-ink" />
                  <span className="tracking-widest uppercase">Ledger</span>
                </div>
                <div className="mt-5 text-[10px] uppercase tracking-widest text-muted-foreground">{workspaceLabel}</div>
                <div className="mt-1 truncate font-display text-2xl leading-tight">{workspaceName}</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 px-3">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${
                      isActive(it.to)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{it.label}</span>
                    {isActive(it.to) && <span className="ml-auto size-1.5 rounded-full bg-ink" />}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 backdrop-blur md:hidden">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                title={it.label}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] leading-none transition ${
                  active ? "bg-ink text-paper" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="w-full truncate text-center">{mobileLabel(it.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:mb-10 sm:flex-row sm:items-end sm:pb-6">
      <div className="min-w-0">
        {eyebrow && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>}
        <h1 className="mt-1 break-words font-display text-3xl leading-tight sm:text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex w-full gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 break-words font-display text-2xl num sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function mobileLabel(label: string) {
  if (label.includes("Reports")) return "Reports";
  if (label === "New bill") return "Bill";
  return label;
}
