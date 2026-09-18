"use client";

import Link from "next/link";
import { ChevronRight, FileX2, Plus } from "lucide-react";
import type { DocumentCdc } from "@/types/document";
import WorkflowStepper from "./WorkflowStepper";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function DocumentTable({ documents }: { documents: DocumentCdc[] }) {
    if (documents.length === 0) {
        return (
            <div className="bg-surface border border-border-subtle rounded-[10px] py-14 flex flex-col items-center gap-3">
                <FileX2 size={28} className="text-text-secondary" />
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground mb-0.5">
                        Aucun cahier des charges pour l'instant
                    </p>
                    <p className="text-xs text-text-secondary">
                        Générez votre premier CDC à partir d'une expression de besoin.
                    </p>
                </div>
                <button className="flex items-center gap-1.5 bg-atos-blue text-white text-xs px-3 py-1.5 rounded-md hover:bg-atos-blue-dark transition-colors mt-1">
                    <Plus size={13} />
                    Générer depuis un EB
                </button>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-border-subtle rounded-[10px] overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
                <thead>
                <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-[11px] uppercase tracking-wide">
                        Titre
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-[11px] uppercase tracking-wide">
                        Étape
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary text-[11px] uppercase tracking-wide">
                        Modifié le
                    </th>
                    <th className="px-4 py-2.5" />
                </tr>
                </thead>
                <tbody>
                {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-border-hairline last:border-0 hover:bg-background transition-colors">
                        <td className="p-0">
                            <Link href={`/dashboard/${doc.id}`} className="flex items-center px-4 py-3 text-foreground font-medium">
                                {doc.titre}
                            </Link>
                        </td>
                        <td className="px-4 py-3">
                            <WorkflowStepper statut={doc.statut} />
                        </td>
                        <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                            {formatDate(doc.updatedAt)}
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary">
                            <Link href={`/dashboard/${doc.id}`}>
                                <ChevronRight size={15} />
                            </Link>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}