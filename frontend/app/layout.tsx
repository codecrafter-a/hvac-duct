import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HVAC Duct Annotation System",
  description: "Automatically detect and annotate HVAC ducts in floor plans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
