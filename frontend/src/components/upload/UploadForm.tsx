"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ingestDocument } from "@/lib/api/aiEngineClient";
import type { IngestResponse } from "@/types/rag";
import { UploadCloud, FileText, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<IngestResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    function resetFeedback() {
        setResult(null);
        setError(null);
    }

    function pickFile(f: File | null) {
        resetFeedback();
        setFile(f);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const response = await ingestDocument(file);
            setResult(response);
            setFile(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragActive(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped && dropped.type === "application/pdf") pickFile(dropped);
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-xl">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
                    dragActive
                        ? "border-atos-blue bg-atos-blue/5"
                        : "border-border-subtle bg-surface hover:border-atos-blue/50"
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => pickFile(e.target.files?.[0] || null)}
                    className="hidden"
                />
                {file ? (
                    <>
                        <FileText size={28} className="text-atos-blue" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-text-secondary">
                            {(file.size / 1024).toFixed(0)} Ko — cliquez ou déposez un autre fichier pour remplacer
                        </p>
                    </>
                ) : (
                    <>
                        <UploadCloud size={28} className="text-text-secondary" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-foreground">
                            Glissez un document EB (PDF) ici
                        </p>
                        <p className="text-xs text-text-secondary">ou cliquez pour parcourir vos fichiers</p>
                    </>
                )}
            </div>

            <div className="flex items-center gap-3 mt-4">
                <button
                    type="submit"
                    disabled={!file || loading}
                    className="flex items-center gap-2 bg-atos-blue text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-atos-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Indexation en cours..." : "Envoyer et indexer"}
                </button>
                {file && !loading && (
                    <button
                        type="button"
                        onClick={() => pickFile(null)}
                        className="text-sm text-text-secondary hover:text-foreground transition-colors"
                    >
                        Annuler
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-start gap-2 mt-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-md px-3.5 py-2.5">
                    <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className="mt-4">
                    <div className="flex items-start gap-2 bg-[#E1F5EE] border border-[#085041]/10 text-[#085041] text-sm rounded-md px-3.5 py-2.5">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>{result.filename}</strong> indexé avec succès ({result.chunks_created} chunk
                            {result.chunks_created > 1 ? "s" : ""} créé{result.chunks_created > 1 ? "s" : ""})
                        </span>
                    </div>

                    <Link
                        href={`/dashboard/${result.document_id}`}
                        className="flex items-center justify-center gap-1.5 mt-3.5 bg-foreground text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
                    >
                        Aller au document pour générer le CDC
                        <ArrowRight size={15} />
                    </Link>
                </div>
            )}
        </form>
    );
}