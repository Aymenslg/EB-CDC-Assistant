from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import shutil
from app.core.config import settings
from app.core.ollama_client import generate_response, generate_response_stream
from app.rag.ingestion import ingest_pdf
from app.rag.vector_store import build_vector_store, get_connection
from app.rag.retriever import retrieve_relevant_chunks
from app.models.schemas import AskRequest, AskResponse, IngestResponse
from app.models.schemas import GenerateRequest, GenerateResponse
from app.rag.vector_store import build_vector_store, get_connection, get_all_chunks_for_document



router = APIRouter()

@router.post("/generate", response_model=GenerateResponse)
def generate_from_text(request: GenerateRequest):
    """
    Génère une réponse directement à partir d'un texte fourni,
    sans recherche RAG — utilisé pour la génération de CDC à partir
    d'un besoin brut (texte déjà complet, pas besoin de retrieval).
    """
    instruction = (
        "Sois détaillé et complet dans chaque section. Développe chaque point "
        "avec des explications concrètes plutôt que des listes très courtes. "
        f"Besoin exprimé : {request.question}"
    )
    prompt = build_cdc_prompt(instruction, request.context or "")
    answer = generate_response(prompt)
    return {"answer": answer}


def create_document_cdc(titre: str) -> int:
    """
    Crée une ligne minimale dans document_cdc (titre + statut BROUILLON)
    et retourne son id, pour que les chunks du PDF uploadé aient un
    document_id valide à référencer.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO document_cdc (titre, statut, created_at, updated_at)
                VALUES (%s, 'BROUILLON', NOW(), NOW())
                RETURNING id
                """,
                (titre,),
            )
            document_id = cur.fetchone()[0]
        conn.commit()
        return document_id
    finally:
        conn.close()


@router.post("/ingest", response_model=IngestResponse)
def ingest_document(file: UploadFile = File(...)):
    """
    Reçoit un PDF, crée un document_cdc associé, l'ingère
    (extraction + découpage), puis insère ses chunks dans pgvector
    en les rattachant à ce document_id.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Le fichier doit être un PDF")

    settings.RAW_PDFS_DIR.mkdir(parents=True, exist_ok=True)
    saved_path = settings.RAW_PDFS_DIR / file.filename
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Le titre du CDC ne doit pas garder l'extension du fichier uploadé
    titre_sans_extension = Path(file.filename).stem
    document_id = create_document_cdc(titre=titre_sans_extension)

    chunks = ingest_pdf(saved_path)
    build_vector_store(document_id, chunks)

    return {
        "filename": file.filename,
        "chunks_created": len(chunks),
        "status": "indexed",
        "document_id": document_id,
    }


@router.post("/generate-from-document/{document_id}", response_model=GenerateResponse)
def generate_from_document(document_id: int):
    """
    Génère un CDC complet (16 sections) à partir de TOUT le
    contenu indexé d'un document (pas une recherche par question) —
    utilisé après l'upload d'un EB.
    """
    chunks = get_all_chunks_for_document(document_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Aucun contenu indexé pour ce document")

    context = "\n\n".join(chunks)
    instruction = (
        "Rédige un cahier des charges complet et clair à partir du besoin "
        "ci-dessous, en couvrant chaque section selon les règles de contenu données."
    )
    prompt = build_cdc_prompt(instruction, context)
    answer = generate_response(prompt)
    return {"answer": answer}


def build_cdc_prompt(instruction: str, context: str) -> str:
    """
    Prompt dédié à la génération de CDC structurés (utilisé par
    /generate et /generate-from-document).
    Impose un format de sortie strict et détectable par CdcSectionParser
    côté backend Java : chaque section commence par "## Titre" seul sur
    sa ligne, entourée de lignes vides, sans aucun symbole Markdown à
    l'intérieur du texte (pas de **gras**, pas de listes à tirets sauf
    besoin réel).
    """
    return f"""Tu es un consultant expert en rédaction de cahiers des charges (CDC) professionnels.
Réponds UNIQUEMENT à partir du contexte ci-dessous. N'invente rien.
Si une information précise n'y figure pas, indique-le clairement dans la section
concernée (par exemple : "Ce point n'est pas précisé dans le besoin exprimé et
devra être clarifié avec le client.") plutôt que d'inventer un chiffre ou un fait.

RÈGLES DE FORMAT À RESPECTER STRICTEMENT :
1. Découpe ta réponse en sections. Chaque titre de section doit être seul sur sa
   ligne, précédé de "## " (deux dièses puis un espace), par exemple :
   ## Contexte
2. Laisse toujours une ligne vide avant et après chaque titre de section.
3. À l'intérieur d'une section, écris des paragraphes normaux en texte simple.
   N'utilise JAMAIS d'astérisques, de underscores ou de dièses à l'intérieur
   du texte (pas de **gras**, pas de *italique*, pas de # dans les phrases).
4. Pour une liste d'éléments à l'intérieur d'une section, mets un élément par
   ligne en commençant STRICTEMENT par "- " (un tiret suivi d'un espace).
   N'utilise JAMAIS "+" ni "*" ni "•" comme puce — uniquement "- ".
5. Utilise exactement ces 16 sections, dans cet ordre, en les adaptant au besoin :
   ## Présentation du projet
   ## Contexte
   ## Problématique
   ## Objectifs
   ## Périmètre du projet
   ## Besoins fonctionnels
   ## Besoins non fonctionnels
   ## Fonctionnalités attendues
   ## Exigences techniques
   ## Exigences de sécurité
   ## Architecture et conception
   ## Tests et validation
   ## Contraintes et planning
   ## Risques
   ## Maintenance et évolutions
   ## Conclusion
6. N'écris JAMAIS deux fois un titre identique ou reformulé (par exemple, n'écris
   pas "## Risques" puis plus loin "## Les risques suivants ont été identifiés" —
   c'est le MÊME sujet, une seule fois). Chacune des 16 sections listées ci-dessous
   apparaît EXACTEMENT UNE FOIS dans ta réponse, dans l'ordre donné, jamais répétée
   sous une formulation différente.
7. Juste après un titre "## ...", ne mets JAMAIS de phrase d'annonce isolée sur
   sa propre ligne, comme "Le périmètre du projet comprend :" ou "Les objectifs
   du projet sont :". Va directement au contenu : soit un paragraphe normal, soit
   directement la liste à tirets, sans reformuler le titre en phrase de transition.
8. Ne répète jamais plusieurs fois la même idée avec des mots différents à
   l'intérieur d'une section — chaque phrase doit apporter une information nouvelle.
9. Les 16 sections doivent TOUTES être rédigées jusqu'à la fin, y compris
   "Maintenance et évolutions" et "Conclusion". Mieux vaut réduire légèrement une
   section que de laisser le document s'arrêter avant la fin.

RÈGLES DE CONTENU — CHAQUE SECTION DOIT ÊTRE DÉTAILLÉE ET CONCRÈTE :
- Chaque section doit contenir 5 à 7 phrases développées, ou 6 à 9 points détaillés
  si le sujet s'y prête (par exemple les besoins fonctionnels) — va au-delà du
  simple constat, explique le "pourquoi" et le "comment" à chaque fois que le
  contexte le permet, avec des détails concrets (chiffres, exemples, cas d'usage,
  acteurs impliqués) plutôt que des généralités ("l'application doit être rapide",
  "l'application doit être sécurisée").
- "Présentation du projet" : nomme le projet, le client, le contexte métier
  général en une ou deux phrases, puis résume précisément ce que le projet va
  livrer concrètement (type d'application, utilisateurs concernés, valeur métier
  apportée), distinct de la section Contexte qui suit.
- "Contexte" : décrit la situation actuelle et ses limites concrètes (chiffres, délais,
  outils utilisés aujourd'hui, volumes traités si mentionnés) — pas les objectifs,
  juste l'état des lieux détaillé.
- "Problématique" : formule explicitement le ou les problèmes que la situation actuelle
  pose, en développant les conséquences concrètes de chaque problème (sur les délais,
  la qualité, la charge de travail, la satisfaction des utilisateurs), sous forme de
  constat argumenté.
- "Objectifs" : liste des objectifs mesurables et distincts (pas une reformulation du
  contexte), en précisant pour chacun un critère de réussite concret quand c'est possible.
- "Périmètre du projet" : précise en détail ce qui est inclus ET ce qui est explicitement
  exclu du projet (si non précisé dans le besoin, propose un périmètre raisonnable en le
  signalant comme une hypothèse à valider), avec les justifications de ces choix.
- "Besoins fonctionnels" : ce que le système doit FAIRE, du point de vue métier/utilisateur,
  détaillé par acteur si plusieurs profils sont concernés (une liste à tirets, un besoin
  détaillé par ligne, pas juste un mot-clé).
- "Besoins non fonctionnels" : performance, disponibilité, ergonomie, accessibilité,
  scalabilité, compatibilité — distincts des besoins fonctionnels, distincts aussi des
  Exigences techniques qui suivent (ici c'est le niveau de qualité attendu, pas la techno),
  avec des seuils ou critères concrets quand c'est possible plutôt que des adjectifs vagues.
- "Fonctionnalités attendues" : ne recopie PAS les puces de "Besoins fonctionnels".
  Décris plutôt la traduction concrète en écrans/actions utilisateur, avec le déroulé
  du parcours utilisateur pour chaque fonctionnalité clé (ex: "un formulaire de demande
  avec un calendrier de sélection des dates, un champ de motif, et un bouton d'envoi qui
  déclenche une notification au manager") — le COMMENT détaillé plutôt que le QUOI déjà
  couvert dans Besoins fonctionnels.
- "Exigences techniques" : technologies, hébergement, compatibilité navigateur/mobile,
  authentification, intégrations avec l'existant, en détaillant les contraintes
  techniques précises mentionnées ou raisonnablement déductibles du besoin.
- "Exigences de sécurité" : confidentialité des données, chiffrement, contrôle d'accès,
  journalisation/audit, conformité si mentionnée, en précisant pour chaque point le
  niveau de sensibilité des données concernées.
- "Architecture et conception" : propose une architecture cohérente et détaillée avec
  les exigences techniques (couches, composants principaux, flux de données entre eux) —
  reste raisonnable si le besoin ne détaille pas ce point, mais développe une proposition
  argumentée plutôt qu'une simple liste de mots-clés.
- "Tests et validation" : types de tests à prévoir (fonctionnels, sécurité, charge,
  recette utilisateur) en précisant ce que chaque type de test doit couvrir, et les
  critères d'acceptation du projet.
- "Contraintes et planning" : délais, budget, ressources internes disponibles, avec le
  détail des contraintes qui en découlent sur l'organisation du projet.
- "Risques" : identifie 3 à 5 risques réalistes (techniques, organisationnels, délais,
  adoption utilisateur) avec, pour chacun, une explication de son impact potentiel et
  une piste de mitigation détaillée.
- "Maintenance et évolutions" : qui maintient le système après livraison, le type de
  maintenance prévu (corrective, évolutive), et deux ou trois évolutions futures
  envisageables avec une brève justification de leur intérêt.
- "Conclusion" : synthèse fidèle et complète de l'ensemble du document (enjeux, valeur
  attendue, prochaines étapes), pas une simple répétition de la section Objectifs.

Contexte (besoin exprimé) :
{context}

Instruction : {instruction}

Rédige maintenant le cahier des charges complet en respectant strictement
le format et les règles de contenu ci-dessus :"""


def build_prompt(question: str, context: str) -> str:
    """
    Construit le prompt envoyé au LLM à partir du contexte RAG et de la question.
    Utilisé par /ask et /ask/stream (questions-réponses courtes, pas de
    génération de document structuré). Mêmes règles de fiabilité
    (ne pas halluciner, dire "je ne sais pas" si l'info manque), formulées
    en peu de tokens pour accélérer le traitement du prompt sur CPU.
    """
    return f"""Tu es un assistant qui structure des besoins en cahier des charges (CDC).
Réponds UNIQUEMENT à partir du contexte ci-dessous. N'invente rien.
Si l'information n'y est pas, réponds : "Le document ne contient pas assez d'informations pour répondre précisément."

Contexte :
{context}

Question : {question}

Réponse :"""


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    """
    Reçoit une question (optionnellement ciblée sur un document précis
    via document_id), récupère les chunks pertinents via RAG,
    puis génère une réponse avec le LLM en se basant dessus.
    """
    relevant_chunks = retrieve_relevant_chunks(request.question, request.document_id)
    context = "\n\n".join(relevant_chunks)
    prompt = build_prompt(request.question, context)
    answer = generate_response(prompt)
    return {
        "question": request.question,
        "answer": answer,
        "sources_used": len(relevant_chunks),
    }


@router.post("/ask/stream")
def ask_question_stream(request: AskRequest):
    """
    Version streamée de /ask : la réponse est envoyée au frontend
    token par token, au fur et à mesure de la génération par le LLM.
    """
    relevant_chunks = retrieve_relevant_chunks(request.question, request.document_id)
    context = "\n\n".join(relevant_chunks)
    prompt = build_prompt(request.question, context)
    return StreamingResponse(
        generate_response_stream(prompt),
        media_type="text/plain",
    )