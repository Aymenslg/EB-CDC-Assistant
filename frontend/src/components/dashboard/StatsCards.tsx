import { FileStack, Clock3, CheckCircle2, XCircle } from "lucide-react";
import type { DocumentCdc } from "@/types/document";

export default function StatsCards({ documents }: { documents: DocumentCdc[] }) {
    const total = documents.length;
    const enRevue = documents.filter((d) => d.statut === "EN_REVUE").length;
    const approuves = documents.filter((d) => d.statut === "APPROUVE").length;
    const rejetes = documents.filter((d) => d.statut === "REJETE").length;

    const cards = [
        { label: "Total", value: total, icon: FileStack, tint: "text-text-secondary" },
        { label: "En revue", value: enRevue, icon: Clock3, tint: "text-warning-text" },
        { label: "Approuvés", value: approuves, icon: CheckCircle2, tint: "text-success-text" },
        { label: "Rejetés", value: rejetes, icon: XCircle, tint: "text-danger-text" },
    ];

    return (
        <div className="grid grid-cols-4 gap-2.5 mb-4.5">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className="bg-surface border border-border-subtle rounded-[10px] p-3.5 hover:border-border-strong transition-colors"
                >
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] text-text-secondary">{c.label}</p>
                        <c.icon size={14} className={c.tint} />
                    </div>
                    <p className="text-xl font-medium text-foreground font-mono">{c.value}</p>
                </div>
            ))}
        </div>
    );
}