import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/mobile/i18n-provider";
import { RegisterServiceWorker } from "@/components/mobile/register-sw";

export const metadata: Metadata = {
  title: { default: "Huli Ko", template: "%s · Huli Ko" },
  description: "Talaan ng huli ng mangingisda ng Marinduque.",
  applicationName: "Huli Ko",
  appleWebApp: { capable: true, title: "Huli Ko", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F7F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0F17" },
  ],
};

/** Mobile app root: 16px body text and Tagalog-first copy. Theme tokens are shared with /admin. */
export default function MobileRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <RegisterServiceWorker />
      <div className="text-base">{children}</div>
    </I18nProvider>
  );
}
