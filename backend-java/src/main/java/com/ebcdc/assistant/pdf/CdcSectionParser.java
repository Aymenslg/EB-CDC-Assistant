package com.ebcdc.assistant.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CdcSectionParser {

    private static final Pattern SECTION_PATTERN = Pattern.compile(
            "^(?:#{1,3}\\s*(.+)|\\d+[.)]\\s*([A-ZÀ-Ü][^:\\n]{2,60}):?|([A-ZÀ-Ü][A-Za-zà-ÿ\\s'\\-]{2,60}):)\\s*$"
    );

    // Point de départ d'une puce, où qu'elle soit dans la ligne (utilisé pour découper
    // une ligne contenant plusieurs puces collées : "• A. • B. • C." ou "+ A. + B."
    // "+" ajouté en filet de sécurité : le LLM utilise parfois "+" au lieu de "-"
    // malgré la consigne stricte du prompt.
    private static final Pattern BULLET_SPLIT = Pattern.compile("(?=[•▪●‣]|(?<=\\s)-\\s|(?<=\\s)\\*\\s|(?<=\\s)\\+\\s|^\\+\\s)");
    private static final Pattern BULLET_START = Pattern.compile("^[•▪●‣\\-*+]\\s+(.+)$");

    private static final Pattern BOLD_PATTERN = Pattern.compile("\\*\\*(.+?)\\*\\*|__(.+?)__");
    private static final Pattern ITALIC_PATTERN = Pattern.compile("(?<!\\*)\\*(?!\\*)(.+?)(?<!\\*)\\*(?!\\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)");
    private static final Pattern CODE_PATTERN = Pattern.compile("`([^`]+)`");
    private static final Pattern HEADING_HASH_PATTERN = Pattern.compile("^#{1,6}\\s*");

    // Liste blanche des 16 titres attendus (imposés par build_cdc_prompt côté ai-engine).
    // Sert de filet de sécurité pour les alternatives 2 et 3 du SECTION_PATTERN (titres
    // numérotés ou capitalisés-avec-":" sans "## "), qui sinon capturent aussi de simples
    // phrases d'intro du LLM ("Le périmètre du projet comprend :") comme si c'était un
    // nouveau titre de section.
    private static final List<String> KNOWN_TITLES = List.of(
            "présentation du projet", "contexte", "problématique", "objectifs",
            "périmètre du projet", "besoins fonctionnels", "besoins non fonctionnels",
            "fonctionnalités attendues", "exigences techniques", "exigences de sécurité",
            "architecture et conception", "tests et validation", "contraintes et planning",
            "risques", "maintenance et évolutions", "conclusion"
    );

    public static List<PdfSection> parse(String contenu) {
        List<PdfSection> sections = new ArrayList<>();
        if (contenu == null || contenu.isBlank()) {
            return sections;
        }

        String currentTitle = null;
        List<String> currentLines = new ArrayList<>();

        for (String rawLine : contenu.replace("\r\n", "\n").split("\n")) {
            String stripped = rawLine.strip();
            Matcher sectionMatch = stripped.isEmpty() ? null : SECTION_PATTERN.matcher(stripped);
            boolean matched = sectionMatch != null && sectionMatch.matches();

            String candidateTitle = null;
            boolean isMarkdownHeading = false;

            if (matched) {
                candidateTitle = cleanInlineMarkdown(firstNonNull(
                        sectionMatch.group(1), sectionMatch.group(2), sectionMatch.group(3)));
                isMarkdownHeading = sectionMatch.group(1) != null; // alternative 1 = "## ..."
            }

            if (matched && (isMarkdownHeading || isKnownTitle(candidateTitle))) {
                if (currentTitle != null || !currentLines.isEmpty()) {
                    sections.add(buildSection(currentTitle, currentLines));
                }
                currentTitle = candidateTitle;
                currentLines = new ArrayList<>();
            } else if (stripped.isEmpty()) {
                currentLines.add(""); // marque une coupure de paragraphe
            } else {
                // Soit une ligne de texte normal, soit une ligne qui matchait le
                // pattern "titre" mais qui n'est pas dans la liste blanche (donc
                // traitée comme du texte courant, pas comme un nouveau titre).
                for (String piece : BULLET_SPLIT.split(stripped)) {
                    String p = piece.strip();
                    if (!p.isEmpty()) currentLines.add(p);
                }
            }
        }

        if (currentTitle != null || !currentLines.isEmpty()) {
            sections.add(buildSection(currentTitle, currentLines));
        }

        if (sections.isEmpty()) {
            sections.add(new PdfSection("Contenu", List.of(cleanInlineMarkdown(contenu.strip()))));
        }

        return sections;
    }

    /**
     * Normalise et compare un titre candidat à la liste blanche des 16 titres
     * attendus, en tolérant les accents et une reformulation en préfixe
     * (ex: "Les objectifs du projet" ne matchera pas "objectifs" en startsWith,
     * donc on reste volontairement strict sur l'égalité pour éviter de repêcher
     * les phrases d'intro qu'on veut justement exclure).
     */
    private static boolean isKnownTitle(String candidate) {
        if (candidate == null) return false;
        String normalized = normalize(candidate.strip());
        return KNOWN_TITLES.stream().anyMatch(known -> normalized.equals(normalize(known)));
    }

    private static String normalize(String text) {
        return text.toLowerCase()
                .replaceAll("[àâä]", "a")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[îï]", "i")
                .replaceAll("[ôö]", "o")
                .replaceAll("[ùûü]", "u")
                .replaceAll("\\s+", " ")
                .strip();
    }

    /**
     * Regroupe des lignes en paragraphes :
     * - une ligne vide termine le paragraphe courant
     * - une ligne qui commence par une puce devient TOUJOURS son propre paragraphe
     *   (jamais fusionnée avec la précédente ni la suivante), pour que chaque item
     *   d'une liste ressorte sur sa propre ligne dans le PDF final.
     * - les lignes de texte normal (repliées par le LLM) s'accumulent ensemble.
     */
    private static PdfSection buildSection(String title, List<String> lines) {
        List<String> paragraphs = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String line : lines) {
            if (line.isEmpty()) {
                flush(paragraphs, current);
                continue;
            }
            Matcher bulletMatch = BULLET_START.matcher(line);
            boolean isBullet = bulletMatch.matches();

            if (isBullet) {
                flush(paragraphs, current); // termine le paragraphe de texte en cours, s'il y en a un
                paragraphs.add("•  " + cleanInlineMarkdown(bulletMatch.group(1)));
                continue;
            }

            if (current.length() > 0) current.append(" ");
            current.append(line);
        }
        flush(paragraphs, current);

        List<String> cleaned = new ArrayList<>();
        for (String para : paragraphs) {
            if (para.startsWith("•  ")) {
                cleaned.add(para); // déjà nettoyé au moment de l'ajout
            } else {
                cleaned.add(cleanInlineMarkdown(para));
            }
        }

        return new PdfSection(title == null ? "Contenu" : title.strip(), cleaned);
    }

    private static void flush(List<String> paragraphs, StringBuilder current) {
        String text = current.toString().strip();
        if (!text.isEmpty()) paragraphs.add(text);
        current.setLength(0);
    }

    private static String cleanInlineMarkdown(String text) {
        if (text == null) return null;
        String result = text;
        result = HEADING_HASH_PATTERN.matcher(result).replaceFirst("");
        result = BOLD_PATTERN.matcher(result).replaceAll(mr ->
                Matcher.quoteReplacement(firstNonNull(mr.group(1), mr.group(2))));
        result = ITALIC_PATTERN.matcher(result).replaceAll(mr ->
                Matcher.quoteReplacement(firstNonNull(mr.group(1), mr.group(2))));
        result = CODE_PATTERN.matcher(result).replaceAll(mr ->
                Matcher.quoteReplacement(mr.group(1)));
        return result.strip();
    }

    private static String firstNonNull(String... values) {
        for (String v : values) if (v != null) return v;
        return null;
    }
}