import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ConfirmProvider";

import appCss from "../styles.css?url";

const isSpaBuild = import.meta.env.VITE_SPA_BUILD === "true";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This page wandered off the ledger.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "E Repair Innovative — Turning Tech Enthusiasts to Expert's" },
      {
        name: "description",
        content:
          "E Repair Innovative — Professional repair management & billing platform. Thiruvananthapuram, Kerala.",
      },
      {
        property: "og:title",
        content: "E Repair Innovative — Turning Tech Enthusiasts to Expert's",
      },
      {
        name: "twitter:title",
        content: "E Repair Innovative — Turning Tech Enthusiasts to Expert's",
      },
      {
        property: "og:description",
        content:
          "E Repair Innovative — Professional repair management & billing platform. Thiruvananthapuram, Kerala.",
      },
      {
        name: "twitter:description",
        content:
          "E Repair Innovative — Professional repair management & billing platform. Thiruvananthapuram, Kerala.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    // Vite injects CSS in index.html for SPA builds; only SSR needs this link.
    links: isSpaBuild ? [] : [{ rel: "stylesheet", href: appCss }],
  }),
  ...(isSpaBuild ? {} : { shellComponent: RootShell }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <ConfirmProvider>
          {isSpaBuild ? <HeadContent /> : null}
          <Outlet />
          <Toaster />
        </ConfirmProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}
