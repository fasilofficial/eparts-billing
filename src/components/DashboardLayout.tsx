import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { LogOut } from "lucide-react";

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

  return (
    <div className="flex min-h-screen bg-background">
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
            const active = path === it.to || (it.to !== "/admin" && it.to !== "/branch" && path.startsWith(it.to));
            const exactRoot = (it.to === "/admin" || it.to === "/branch") && path === it.to;
            const isActive = exactRoot || active;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{it.label}</span>
                {isActive && <span className="ml-auto size-1.5 rounded-full bg-ink" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => { logout(); nav({ to: "/login" }); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-ink" />
            <span className="tracking-widest uppercase">Ledger</span>
          </div>
          <button onClick={() => { logout(); nav({ to: "/login" }); }} className="text-xs text-muted-foreground">
            Sign out
          </button>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        {eyebrow && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>}
        <h1 className="mt-1 font-display text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl num">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
