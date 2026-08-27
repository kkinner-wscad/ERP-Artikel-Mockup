import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERP Control Center | ELECTRIX Integration",
  description: "Mock- und Testoberfläche für die ERP-Integration mit der WSCAD ELECTRIX API.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
