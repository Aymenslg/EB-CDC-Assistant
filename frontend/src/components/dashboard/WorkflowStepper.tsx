import { Check, X } from "lucide-react";
import type { StatutValidation } from "@/types/document";

const STAGES: { key: StatutValidation; label: string }[] = [
    { key: "BROUILLON", label: "Brouillon" },
    { key: "EN_REVUE", label: "En revue" },
    { key: "APPROUVE", label: "Approuvé" },
];

const ORDER: StatutValidation[] = ["BROUILLON", "EN_REVUE", "APPROUVE"];

export default function WorkflowStepper({ statut }: { statut: StatutValidation }) {
    if (statut === "REJETE") {
        return (
            <div className="flex items-center gap-1.5 text-danger-text">
                <X size={13} strokeWidth={2.5} />
                <span className="text-xs font-medium">Rejeté</span>
            </div>
        );
    }

    const currentIndex = ORDER.indexOf(statut);

    return (
        <div className="flex items-center gap-1">
            {STAGES.map((stage, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                    <div key={stage.key} className="flex items-center">
                        <div
                            className={`flex items-center justify-center w-4.5 h-4.5 rounded-full text-[10px] transition-colors ${
                                done
                                    ? "bg-success-bg text-success-text"
                                    : active
                                        ? "bg-atos-blue text-white"
                                        : "bg-neutral-bg text-text-secondary"
                            }`}
                            title={stage.label}
                        >
                            {done ? <Check size={10} strokeWidth={3} /> : i + 1}
                        </div>
                        {i < STAGES.length - 1 && (
                            <div className={`w-4 h-[1.5px] ${done ? "bg-success-bg" : "bg-border-subtle"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}