import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/auth-context";
import { ToastProvider } from "../context/toast-context";

export const metadata: Metadata = {
  title: "Lattice — Showcasing Developer Projects",
  description: "A premium, Dribbble-inspired project sharing and exploration network for developers.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-brand-rose selection:text-white">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
