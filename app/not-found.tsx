import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-base text-muted-foreground">This page does not exist. Check the address, or go back to the dashboard.</p>
      <Link
        href="/admin"
        className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40"
      >
        Dashboard
      </Link>
    </main>
  );
}
