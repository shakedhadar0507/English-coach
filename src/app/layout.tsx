import type { Metadata, Viewport } from "next";
import "./globals.css";
import { dirOf, getMessages } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getTheme } from "@/lib/server/locale";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";

export const metadata: Metadata = {
  title: { default: "English Coach", template: "%s · English Coach" },
  description: "Personal English learning: vocabulary, grammar, listening, writing and speaking.",
  applicationName: "English Coach",
  appleWebApp: { capable: true, title: "English Coach", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4fa" },
    { media: "(prefers-color-scheme: dark)", color: "#12111a" },
  ],
};

// Resolves "system" before first paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var d=document.documentElement;if(!d.dataset.theme){d.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const theme = await getTheme();
  return (
    <html lang={locale} dir={dirOf(locale)} data-theme={theme === "system" ? undefined : theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
          <ServiceWorkerRegistrar />
        </I18nProvider>
      </body>
    </html>
  );
}
