import type { StatutValidation } from "@/types/document";

const STATUS_CONFIG: Record<StatutValidation, { label: string; bg: string; text: string }> = {
    BROUILLON: { label: "Brouillon", bg: "#F1EFE8", text: "#444441" },
    EN_REVUE: { label: "En revue", bg: "#FAEEDA", text: "#854F0B" },
    APPROUVE: { label: "Approuvé", bg: "#E1F5EE", text: "#085041" },
    REJETE: { label: "Rejeté", bg: "#FCEBEB", text: "#791F1F" },
};

export default function StatusBadge({ status }: { status: StatutValidation }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: config.bg, color: config.text }}
        >
      {config.label}
    </span>
    );
}