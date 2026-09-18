"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { useSearch } from "@/context/SearchContext";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Documents",
    "/chat": "Chat RAG",
    "/upload": "Import EB",
};

export default function Topbar() {
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] ?? "";
    const { query, setQuery } = useSearch();

    return (
        <header className="h-[52px] bg-surface border-b border-border-subtle flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-2 bg-background rounded-md px-3 py-1.5 w-[220px]">
                <Search size={15} className="text-text-secondary" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Rechercher ${title ? `dans ${title.toLowerCase()}` : "un document"}`}
                    className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-text-secondary w-full"
                />
            </div>
            <div className="flex items-center gap-4">
                <Bell size={17} className="text-text-secondary" />
                <div className="w-px h-4.5 bg-border-subtle" />
                <span className="text-xs text-text-secondary">Atos Maroc</span>
            </div>
        </header>
    );
}