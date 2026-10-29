import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold">Wala ang pahinang ito</h1>
      <p className="text-base text-muted-foreground">This page does not exist. Check the address, or go back to the start.</p>
      <div className="mt-2 grid w-full grid-cols-2 gap-3">
        <Link href="/app" className="flex h-14 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40">
          Huli Ko app
        </Link>
        <Link href="/admin" className="flex h-14 items-center justify-center rounded-xl border text-base font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/40">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
