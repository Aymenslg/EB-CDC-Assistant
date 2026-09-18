"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/api/workflowClient";
import type { DocumentCdc } from "@/types/document";
import { useSearch } from "@/context/SearchContext";
import StatsCards from "@/components/dashboard/StatsCards";
import DocumentTable from "@/components/dashboard/DocumentTable";
export default function DashboardPage() {
    const [documents, setDocuments] = useState<DocumentCdc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { query } = useSearch();
    useEffect(() => {
        getDocuments()
            .then((docs) => {
                // Le plus récemment importé/créé en premier (id croissant à la création,
                // donc id décroissant = ordre d'import le plus récent d'abord).
                const sorted = [...docs].sort((a, b) => b.id - a.id);
                setDocuments(sorted);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);
    const filteredDocuments = documents.filter((d) =>
        d.titre.toLowerCase().includes(query.toLowerCase())
    );
    return (
        <div className="p-6 lg:p-7">
            <div className="flex items-baseline justify-between mb-4.5">
                <div>
                    <h1 className="text-[17px] font-medium text-foreground mb-0.5">
                        Cahiers des charges
                    </h1>
                    <p className="text-xs text-text-secondary">Suivi du workflow de validation</p>
                </div>
                <Link
                    href="/upload"
                    className="flex items-center gap-1.5 bg-atos-blue text-white text-sm px-3.5 py-2 rounded-md hover:bg-atos-blue-dark transition-colors"
                >
                    <Plus size={15} />
                    Générer depuis un EB
                </Link>
            </div>
            {loading && (
                <div className="flex items-center gap-2 text-sm text-text-secondary py-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-atos-blue animate-[dot-bounce_1.2s_infinite]" />
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-atos-blue animate-[dot-bounce_1.2s_infinite]"
                        style={{ animationDelay: "0.15s" }}
                    />
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-atos-blue animate-[dot-bounce_1.2s_infinite]"
                        style={{ animationDelay: "0.3s" }}
                    />
                    <span className="ml-1">Chargement des documents</span>
                </div>
            )}
            {error && (
                <p className="text-sm text-danger-text bg-danger-bg border border-danger-bg rounded-md px-3 py-2 mb-4">
                    {error}
                </p>
            )}
            {!loading && !error && (
                <>
                    <StatsCards documents={documents} />
                    <DocumentTable documents={filteredDocuments} />
                </>
            )}
        </div>
    );
}