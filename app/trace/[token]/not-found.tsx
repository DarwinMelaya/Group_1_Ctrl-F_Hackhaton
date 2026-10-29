import { Fish, QrCode } from "lucide-react";

export default function TraceNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <header className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-teal text-teal-foreground">
            <Fish className="size-4" aria-hidden />
          </span>
          <p className="text-sm font-semibold">Huli Ko</p>
        </header>
        <div className="space-y-3 rounded-xl border bg-card px-5 py-6 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <QrCode className="size-5" aria-hidden />
          </span>
          <h1 className="text-lg font-semibold">This QR code is not recognised</h1>
          <p className="text-sm text-muted-foreground">
            The code may be mistyped, damaged or from another system. Ask the seller for the catch&apos;s Huli Ko label, or contact the Municipal
            Agriculture Office.
          </p>
          <p className="text-xs text-muted-foreground">Hindi makilala ang QR code na ito.</p>
        </div>
      </div>
    </main>
  );
}
