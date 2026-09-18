import type { ValidationHistorique } from "@/types/document";
import StatusBadge from "./StatusBadge";

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function HistoriqueList({ historique }: { historique: ValidationHistorique[] }) {
    if (historique.length === 0) {
        return <p className="text-sm text-text-secondary">Aucun changement de statut pour le moment.</p>;
    }

    return (
        <ul className="flex flex-col gap-3">
            {historique.map((h) => (
                <li key={h.id} className="flex items-start gap-3 pb-3 border-b border-border-hairline last:border-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={h.ancienStatut} />
                        <span className="text-text-muted text-xs">→</span>
                        <StatusBadge status={h.nouveauStatut} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-text-secondary">{formatDateTime(h.dateChangement)}</p>
                        {h.commentaire && (
                            <p className="text-sm text-foreground mt-1 italic">"{h.commentaire}"</p>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}