"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Upload } from "lucide-react";



const NAV_ITEMS = [
    { href: "/dashboard", label: "Documents", icon: LayoutDashboard },
    { href: "/upload", label: "Import EB", icon: Upload },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-[216px] bg-atos-navy flex flex-col gap-0.5 py-5 px-3.5 flex-shrink-0">
            <div className="flex items-center gap-2.5 px-2 pb-5.5">
                <div className="w-6.5 h-6.5 rounded-md bg-atos-blue flex items-center justify-center text-[12px] font-medium text-white">
                    EB
                </div>
                <span className="text-white text-[13px] font-medium tracking-tight">EB / CDC Assistant</span>
            </div>

            <p className="text-[11px] text-white/40 uppercase tracking-wide px-2.5 mb-1.5">
                Espace de travail
            </p>

            {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                            active ? "bg-atos-blue text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </Link>
                );
            })}

            <div className="mt-auto flex items-center gap-2 pt-3 px-2 border-t border-white/10">
                <div className="w-6 h-6 rounded-full bg-atos-blue flex items-center justify-center text-[10px] font-medium text-white">
                    A
                </div>
                <div>
                    <p className="text-white/90 text-xs leading-tight">Aymen</p>
                    <p className="text-white/40 text-[10px] leading-tight">Stagiaire IA / Data</p>
                </div>
            </div>
        </aside>
    );
}