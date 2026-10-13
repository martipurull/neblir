import "./globals.css";
import { loadDocumentTheme } from "@/app/lib/loadDocumentTheme";
import { themeDocumentStyle, themeTokens } from "@/app/lib/theme";
import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { SerwistProvider } from "./serwist-provider";

export const metadata: Metadata = {
  applicationName: "Neblir",
  title: {
    default: "Neblir",
    template: "%s | Neblir",
  },
  description: "A homebrewed sci-fi TTRPG set in a starless world.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Neblir",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await loadDocumentTheme();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: themeTokens(theme).toolbar,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await loadDocumentTheme();
  return (
    <html lang="en" data-theme={theme} style={themeDocumentStyle(theme)}>
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">
          <Providers>{children}</Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}
