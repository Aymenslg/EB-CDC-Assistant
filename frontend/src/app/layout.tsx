import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    weight: ["400", "500"],
});

export const metadata: Metadata = {
    title: "EB/CDC Assistant — Atos Maroc",
    description: "Assistant RAG pour l'automatisation des workflows EB/CDC — Atos Maroc",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
        <body className="min-h-full flex bg-background text-foreground">
        <SearchProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </SearchProvider>
        </body>
        </html>
    );
}