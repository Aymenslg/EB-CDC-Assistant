"use client";

import { useState } from "react";
import { Check, X, RotateCcw, ArrowRight, Loader2 } from "lucide-react";
import type { StatutValidation } from "@/types/document";
import { changerStatut } from "@/lib/api/workflowClient";

type ActionStyle = "primary" | "success" | "danger" | "neutral";

const TRANSITIONS: Record <
StatutValidation,
    { target: StatutValidation; label: string; needsComment: boolean; icon: typeof Check; style: ActionStyle }[]
    > = {
              BROUILLON: [
                { target: "EN_REVUE", label: "Envoyer en revue", needsComment: false, icon: ArrowRight, style: "primary" },
              ],
              EN_REVUE: [
                { target: "APPROUVE", label: "Approuver", needsComment: false, icon: Check, style: "success" },
                { target: "REJETE", label: "Rejeter", needsComment: true, icon: X, style: "danger" },
              ],
              APPROUVE: [],
              REJETE: [
                { target: "EN_REVUE", label: "Renvoyer en revue", needsComment: false, icon: RotateCcw, style: "primary" },
              ],
            };

const STYLE_CLASSES: Record<ActionStyle, string> = {
  primary: "bg-[#0066A1] text-white hover:bg-[#0A2540]",
  success: "bg-[#085041] text-white hover:bg-[#063D31]",
  danger: "bg-[#791F1F] text-white hover:bg-[#5E1818]",
  neutral: "bg-transparent text-text-secondary border border-border-subtle hover:bg-background",
};

export default function StatusActions({
  documentId,
  statutActuel,
  onChanged,
}: {
  documentId: number;
  statutActuel: StatutValidation;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<StatutValidation | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const options = TRANSITIONS[statutActuel];

  async function handleTransition(target: StatutValidation, needsComment: boolean, comment?: string) {
    if (needsComment && pendingTarget !== target) {
      setPendingTarget(target);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changerStatut(documentId, target, comment);
      setPendingTarget(null);
      setCommentaire("");
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur inconnue — vérifiez que le service backend est bien démarré."
      );
    } finally {
      setLoading(false);
    }
  }

  if (statutActuel === "APPROUVE") {
    return (
      <div className="flex items-center gap-2 text-sm text-[#085041]">
        <Check size={16} />
        <span>Document approuvé — aucune action supplémentaire disponible.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isPending = pendingTarget === opt.target;
          return (
            <button
              key={opt.target}
              disabled={loading}
              onClick={() => handleTransition(opt.target, opt.needsComment)}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isPending ? "ring-2 ring-offset-1 ring-[#0066A1]" : ""
              } ${STYLE_CLASSES[opt.style]}`}
            >
              {loading && isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Icon size={14} />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>

      {pendingTarget && (
        <div className="flex flex-col gap-2.5 p-3.5 bg-background rounded-md border border-border-subtle">
          <label className="text-xs font-medium text-text-secondary">
            Motif du rejet <span className="text-[#791F1F]">*</span>
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Expliquez la raison du rejet pour le demandeur..."
            className="text-sm border border-border-subtle rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#0066A1]"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              disabled={loading || commentaire.trim().length === 0}
              onClick={() => handleTransition(pendingTarget, true, commentaire)}
              className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-md bg-[#791F1F] text-white hover:bg-[#5E1818] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              Confirmer le rejet
            </button>
            <button
              onClick={() => {
                setPendingTarget(null);
                setCommentaire("");
              }}
              className="text-sm px-3.5 py-1.5 rounded-md border border-border-subtle text-text-secondary hover:bg-background transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

        {error && (
            <p className="text-xs text-[#791F1F] bg-[#FCEBEB] border border-[#791F1F]/15 rounded-md px-3 py-2">
                {error}
            </p>
        )}
    </div>
  );
}
