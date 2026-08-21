import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Logo } from "@/components/logo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const raghero = localFont({
  src: "./fonts/Raghero-Regular.otf",
  variable: "--font-raghero",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://live-discovery-tool.netlify.app"),
  title: "Live Discovery Session Tool",
  description: "Live workshop-facilitation tool",
  openGraph: {
    title: "Live Discovery Session Tool",
    description: "Live workshop-facilitation tool",
    siteName: "Studio Ruffle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${raghero.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Logo />
        {children}
      </body>
    </html>
  );
}
