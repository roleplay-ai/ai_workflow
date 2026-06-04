import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudgeable AI Work Studio",
  description: "Practical AI workflows for everyday work",
  icons: {
    icon: "/nudgeable-icon.png",
    apple: "/nudgeable-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
