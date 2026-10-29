"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { traceUrl } from "@/lib/trace";

/** QR code for a catch's public trace page, with a download for printed labels. */
export function CatchQr({ token, label }: { token: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const target = traceUrl(token, window.location.origin);
    setUrl(target);
    QRCode.toString(target, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#14304F", light: "#FFFFFF" } })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, [token]);

  function download() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `huliko-qr-${token}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const localOnly = /\/\/(localhost|127\.0\.0\.1)/.test(url);

  return (
    <div className="flex gap-4">
      <div
        className="size-28 shrink-0 overflow-hidden rounded-md border bg-white p-1"
        role="img"
        aria-label={`QR code for ${label}`}
        // qrcode renders a self-contained SVG string from our own URL.
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <div className="min-w-0 space-y-2 text-xs">
        <p className="break-all font-mono text-muted-foreground">{url}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 size-3.5" /> Open public page
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={download} disabled={!svg}>
            <Download className="mr-1.5 size-3.5" /> Download QR
          </Button>
        </div>
        {localOnly && (
          <p className="text-muted-foreground">
            Phones cannot open localhost. Set NEXT_PUBLIC_SITE_URL to this computer&apos;s network address to scan it during a demo.
          </p>
        )}
      </div>
    </div>
  );
}
