import { QrCode } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";

export default function TraceNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <header className="flex items-center gap-2">
          <AppLogo />
          <p className="text-sm font-semibold">MarAIne</p>
        </header>
        <div className="space-y-3 rounded-xl border bg-card px-5 py-6 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <QrCode className="size-5" aria-hidden />
          </span>
          <h1 className="text-lg font-semibold">This QR code is not recognised</h1>
          <p className="text-sm text-muted-foreground">
            The code may be mistyped, damaged or from another system. Ask the seller for the catch&apos;s MarAIne label, or contact the Municipal
            Agriculture Office.
          </p>
          <p className="text-xs text-muted-foreground">Hindi makilala ang QR code na ito.</p>
        </div>
      </div>
    </main>
  );
}
