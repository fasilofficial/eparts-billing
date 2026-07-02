import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — E Repair Innovative" }] }),
});

function LoginPage() {
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWith = async (nextEmail: string, nextPassword: string) => {
    setLoading(true);
    try {
      const trimmedEmail = nextEmail.trim();
      const res = await login(trimmedEmail, nextPassword);
      if (!res.ok) {
        toast.error(res.error ?? "Login failed");
        return;
      }
      await nav({ to: res.role === "admin" ? "/admin" : "/branch" });
    } catch {
      toast.error("Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signInWith(email, password);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel – visible on large screens */}
      <div className="hidden lg:flex flex-col justify-between border-r border-border bg-surface p-12">
        {/* Logo */}
        <div>
          <img src="/logo.png" alt="E Repair Innovative" className="h-24 w-auto object-contain" />
        </div>

        {/* Hero copy */}
        <div>
          <h1 className="font-display text-6xl leading-[1.05]">
            Turning Tech
            <br />
            <em className="italic text-muted-foreground">Enthusiasts</em>
            <br />
            to Experts.
          </h1>
          <p className="mt-6 max-w-md text-sm text-muted-foreground">
            Professional repair management &amp; billing — built for the team at ERepair Innovative.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} E Repair Innovative · Thiruvananthapuram, Kerala
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo – shown only below lg breakpoint */}
          <div className="lg:hidden mb-8">
            <img src="/logo.png" alt="E Repair Innovative" className="h-16 w-auto object-contain" />
          </div>
          <h2 className="font-display text-3xl">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </label>
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
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </label>
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
              aria-busy={loading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-ink py-3 text-sm text-paper transition hover:opacity-90 disabled:cursor-wait disabled:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
