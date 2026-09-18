"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Download } from "lucide-react";

import type { DocumentCdc, ValidationHistorique } from "@/types/document";
import StatusBadge from "@/components/dashboard/StatusBadge";
import StatusActions from "@/components/dashboard/StatusActions";
import HistoriqueList from "@/components/dashboard/HistoriqueList";
import WorkflowStepper from "@/components/dashboard/WorkflowStepper";
import { getDocumentById, getHistorique, downloadDocumentPdf, generateContenu } from "@/lib/api/workflowClient";
import DocumentChatWidget from "@/components/chat/DocumentChatWidget";

// Durée estimée d'une génération sur cette machine (CPU-only) — sert de base
// à la simulation de progression. Ajuste cette valeur si tu observes des temps
// de génération très différents en pratique (ex: après le fix num_ctx/num_predict).
const ESTIMATED_GENERATION_MS = 9 * 60 * 1000; // 9 minutes

export default function DocumentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [doc, setDoc] = useState<DocumentCdc | null>(null);
    const [historique, setHistorique] = useState<ValidationHistorique[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function run() {
            setLoading(true);
            try {
                const [d, h] = await Promise.all([getDocumentById(id), getHistorique(id)]);
                if (!controller.signal.aborted) {
                    setDoc(d);
                    setHistorique(h);
                    setError(null);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(err instanceof Error ? err.message : "Erreur de chargement");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        run();
        return () => controller.abort();
    }, [id, refreshKey]);

    // Nettoyage de l'interval si le composant est démonté pendant une génération en cours
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, []);

    async function handleDownloadPdf() {
        setDownloading(true);
        try {
            await downloadDocumentPdf(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du téléchargement");
        } finally {
            setDownloading(false);
        }
    }

    function startProgressSimulation() {
        setGenerationProgress(0);
        const startedAt = Date.now();

        // Courbe non linéaire : avance vite au début, ralentit en approchant
        // de la durée estimée, et ne dépasse jamais 95% tant que la réponse
        // du serveur n'est pas revenue (le vrai 100% n'arrive qu'à la fin réelle).
        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const ratio = elapsed / ESTIMATED_GENERATION_MS;
            const eased = 1 - Math.pow(1 - Math.min(ratio, 1), 2);
            const capped = Math.min(eased * 95, 95);
            setGenerationProgress(capped);
        }, 400);
    }

    function stopProgressSimulation(finalValue: number) {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setGenerationProgress(finalValue);
    }

    async function handleGenerate() {
        setGenerating(true);
        startProgressSimulation();
        try {
            const updated = await generateContenu(id);
            stopProgressSimulation(100);
            setDoc(updated);
            setError(null);
        } catch (err) {
            stopProgressSimulation(0);
            setError(err instanceof Error ? err.message : "Erreur lors de la génération du CDC");
        } finally {
            // Petit délai pour laisser la barre atteindre visuellement 100%
            // avant de masquer l'état "generating".
            setTimeout(() => setGenerating(false), 500);
        }
    }

    if (loading) return <div className="p-6 text-sm text-text-secondary">Chargement...</div>;
    if (error || !doc) return <div className="p-6 text-sm text-red-600">{error ?? "Document introuvable"}</div>;

    return (
        <div className="p-6 lg:p-7 max-w-3xl">
            <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-foreground mb-4"
            >
                <ChevronLeft size={14} /> Retour aux documents
            </button>

            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-medium text-foreground mb-2">{doc.titre}</h1>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={doc.statut} />
                        <WorkflowStepper statut={doc.statut} />
                    </div>
                </div>
                {doc.statut === "APPROUVE" && (
                    <button
                        onClick={handleDownloadPdf}
                        disabled={downloading}
                        className="flex items-center gap-1.5 bg-[#0066A1] text-white text-sm px-3.5 py-2 rounded-md hover:bg-[#0A2540] transition-colors disabled:opacity-50"
                    >
                        <Download size={15} />
                        {downloading ? "Génération..." : "Télécharger le PDF"}
                    </button>
                )}
            </div>

            <div className="bg-surface border border-border-subtle rounded-[10px] p-5 mb-5">
                {generating ? (
                    <div className="flex flex-col items-center text-center py-6 gap-3">
                        <p className="text-sm text-foreground font-medium">
                            Génération du cahier des charges en cours...
                        </p>
                        <div className="w-full max-w-sm bg-border-subtle rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-[#0066A1] transition-[width] duration-500 ease-out rounded-full"
                                style={{ width: `${generationProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-secondary">
                            {Math.round(generationProgress)}% — estimation, peut prendre plus ou moins de
                            temps selon la charge de la machine. Merci de ne pas fermer ou recharger la page.
                        </p>
                    </div>
                ) : doc.contenu ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{doc.contenu}</p>
                ) : (
                    <div className="flex flex-col items-center text-center py-6 gap-3">
                        <p className="text-sm text-text-secondary">
                            Ce document a été indexé mais son contenu CDC n&apos;a pas encore été généré.
                        </p>
                        <button
                            onClick={handleGenerate}
                            className="bg-[#0066A1] text-white text-sm px-4 py-2 rounded-md hover:bg-[#0A2540] transition-colors"
                        >
                            Générer le CDC depuis ce document
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-surface border border-border-subtle rounded-[10px] p-5 mb-5">
                <h2 className="text-sm font-medium text-foreground mb-3">Actions</h2>
                <StatusActions
                    documentId={doc.id}
                    statutActuel={doc.statut}
                    onChanged={() => setRefreshKey((k) => k + 1)}
                />
            </div>

            <div className="bg-surface border border-border-subtle rounded-[10px] p-5">
                <h2 className="text-sm font-medium text-foreground mb-3">Historique des validations</h2>
                <HistoriqueList historique={historique} />
            </div>

            <DocumentChatWidget documentId={doc.id} />
        </div>
    );
}