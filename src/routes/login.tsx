import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, ADMIN_CREDS } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Ledger" }] }),
});

function LoginPage() {
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = login(email.trim(), password);
      setLoading(false);
      if (!res.ok) {
        toast.error(res.error ?? "Login failed");
        return;
      }
      const isAdmin = email.trim() === ADMIN_CREDS.email;
      nav({ to: isAdmin ? "/admin" : "/branch" });
    }, 400);
  };

  const useDemo = (kind: "admin" | "branch") => {
    if (kind === "admin") {
      setEmail(ADMIN_CREDS.email);
      setPassword(ADMIN_CREDS.password);
    } else {
      setEmail("downtown@billing.app");
      setPassword("branch123");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between border-r border-border bg-surface p-12">
        <div className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full bg-ink" />
          <span className="tracking-widest uppercase">Ledger</span>
        </div>
        <div>
          <h1 className="font-display text-6xl leading-[1.05]">
            Billing,<br />
            <em className="italic text-muted-foreground">refined</em> across<br />
            every branch.
          </h1>
          <p className="mt-6 max-w-md text-sm text-muted-foreground">
            A quiet, premium workspace for multi-branch retail. Built for clarity,
            speed, and the kind of print-ready invoices your customers keep.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Ledger Studio</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-ink" />
            <span className="tracking-widest uppercase">Ledger</span>
          </div>
          <h2 className="font-display text-3xl">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full border-b border-border bg-transparent py-2 text-sm outline-none transition focus:border-ink"
                placeholder="you@business.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full border-b border-border bg-transparent py-2 text-sm outline-none transition focus:border-ink"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 w-full overflow-hidden rounded-md bg-ink py-3 text-sm text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Demo access</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => useDemo("admin")} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                Admin
              </button>
              <button onClick={() => useDemo("branch")} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                Branch user
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Admin · admin@billing.app / admin123<br />
              Branch · downtown@billing.app / branch123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
