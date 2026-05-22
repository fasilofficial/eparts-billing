import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("billing-session-v2");
        if (raw) {
          const s = JSON.parse(raw);
          throw redirect({ to: s.role === "admin" ? "/admin" : "/branch" });
        }
      } catch (e) {
        if (e && typeof e === "object" && "to" in (e as object)) throw e;
      }
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
