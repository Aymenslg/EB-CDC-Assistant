package com.ebcdc.assistant.pdf;

import com.ebcdc.assistant.model.DocumentCdc;
import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class PdfGeneratorService {

    private static final Map<String, String> STATUT_LABELS = Map.of(
            "BROUILLON", "Brouillon",
            "EN_REVUE", "En revue",
            "APPROUVE", "Approuvé",
            "REJETE", "Rejeté"
    );

    private final TemplateEngine templateEngine;

    public PdfGeneratorService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public byte[] generateCdcPdf(DocumentCdc document) {
        Context context = new Context();
        context.setVariable("titre", document.getTitre());
        context.setVariable("reference", "CDC-" + document.getId());
        context.setVariable("statutLabel", STATUT_LABELS.getOrDefault(
                document.getStatut().name(), document.getStatut().name()));
        context.setVariable("statutClass", document.getStatut().name().toLowerCase());
        context.setVariable("generatedDate",
                "Généré le " + java.time.LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        context.setVariable("updatedDate",
                document.getUpdatedAt() != null
                        ? document.getUpdatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"))
                        : "—");
        context.setVariable("sections", CdcSectionParser.parse(document.getContenu()));
        context.setVariable("createdDate",
                document.getCreatedAt() != null
                        ? document.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        : "—");

        String html = templateEngine.process("cdc-pdf", context);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            // Police embarquée (le rendu ne doit pas dépendre des polices
            // installées sur la machine/serveur qui exécute openhtmltopdf).
            builder.useFont(
                    () -> getClass().getResourceAsStream("/fonts/PTSerif-Regular.ttf"),
                    "PT Serif", 400, BaseRendererBuilder.FontStyle.NORMAL, true);
            builder.useFont(
                    () -> getClass().getResourceAsStream("/fonts/PTSerif-Bold.ttf"),
                    "PT Serif", 700, BaseRendererBuilder.FontStyle.NORMAL, true);

            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
}