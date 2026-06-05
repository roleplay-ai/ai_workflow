import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudgeable AI Work Studio",
  description: "Practical AI workflows for everyday work",
  icons: {
    icon: [{ url: "/nudgeable-icon.png", type: "image/png" }],
    apple: [{ url: "/nudgeable-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
