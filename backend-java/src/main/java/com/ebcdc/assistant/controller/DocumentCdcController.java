package com.ebcdc.assistant.controller;

import com.ebcdc.assistant.client.AiEngineClient;
import com.ebcdc.assistant.dto.ChangerStatutRequest;
import com.ebcdc.assistant.dto.GenerateFromEbRequest;
import com.ebcdc.assistant.model.*;
import com.ebcdc.assistant.repository.DocumentCdcRepository;
import com.ebcdc.assistant.repository.ValidationHistoriqueRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.ebcdc.assistant.pdf.PdfGeneratorService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/documents")
public class DocumentCdcController {

    @Autowired
    private DocumentCdcRepository documentCdcRepository;

    @Autowired
    private ValidationHistoriqueRepository validationHistoriqueRepository;

    @Autowired
    private AiEngineClient aiEngineClient;

    @Autowired
    private PdfGeneratorService pdfGeneratorService;

    private static final Map<StatutValidation, Set<StatutValidation>> TRANSITIONS_AUTORISEES =
            new EnumMap<>(StatutValidation.class);

    static {
        TRANSITIONS_AUTORISEES.put(StatutValidation.BROUILLON, EnumSet.of(StatutValidation.EN_REVUE));
        TRANSITIONS_AUTORISEES.put(StatutValidation.EN_REVUE, EnumSet.of(StatutValidation.APPROUVE, StatutValidation.REJETE));
        TRANSITIONS_AUTORISEES.put(StatutValidation.REJETE, EnumSet.of(StatutValidation.BROUILLON));
        TRANSITIONS_AUTORISEES.put(StatutValidation.APPROUVE, EnumSet.noneOf(StatutValidation.class));
    }

    @GetMapping
    public List<DocumentCdc> getAllDocuments() {
        return documentCdcRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentCdc> getDocumentById(@PathVariable Long id) {
        return documentCdcRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/statut/{statut}")
    public List<DocumentCdc> getDocumentsByStatut(@PathVariable StatutValidation statut) {
        return documentCdcRepository.findByStatut(statut);
    }

    @PostMapping
    public DocumentCdc createDocument(@RequestBody DocumentCdc document) {
        return documentCdcRepository.save(document);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentCdc> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentCdc updatedDocument) {
        return documentCdcRepository.findById(id)
                .map(existing -> {
                    existing.setTitre(updatedDocument.getTitre());
                    existing.setContenu(updatedDocument.getContenu());
                    return ResponseEntity.ok(documentCdcRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        if (!documentCdcRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        documentCdcRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate-from-eb")
    public ResponseEntity<DocumentCdc> generateFromEb(@Valid @RequestBody GenerateFromEbRequest request) {
        String prompt = "Rédige un cahier des charges structuré à partir du besoin suivant : "
                + request.getBesoin();
        String contenuGenere = aiEngineClient.askQuestion(prompt);

        DocumentCdc document = new DocumentCdc();
        document.setTitre(request.getTitre());
        document.setContenu(contenuGenere);

        DocumentCdc saved = documentCdcRepository.save(document);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @Valid @RequestBody ChangerStatutRequest request) {

        return documentCdcRepository.findById(id)
                .map(document -> {
                    StatutValidation ancienStatut = document.getStatut();
                    StatutValidation nouveauStatut = request.getNouveauStatut();

                    Set<StatutValidation> transitionsPossibles = TRANSITIONS_AUTORISEES.get(ancienStatut);
                    if (transitionsPossibles == null || !transitionsPossibles.contains(nouveauStatut)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                                "Transition non autorisée : " + ancienStatut + " -> " + nouveauStatut
                        );
                    }

                    document.setStatut(nouveauStatut);
                    DocumentCdc saved = documentCdcRepository.save(document);

                    ValidationHistorique historique = new ValidationHistorique();
                    historique.setDocumentId(id);
                    historique.setAncienStatut(ancienStatut);
                    historique.setNouveauStatut(nouveauStatut);
                    historique.setCommentaire(request.getCommentaire());
                    validationHistoriqueRepository.save(historique);

                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<List<ValidationHistorique>> getHistorique(@PathVariable Long id) {
        if (!documentCdcRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(
                validationHistoriqueRepository.findByDocumentIdOrderByDateChangementAsc(id)
        );
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        return documentCdcRepository.findById(id)
                .map(document -> {
                    byte[] pdf = pdfGeneratorService.generateCdcPdf(document);
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "attachment; filename=\"CDC-" + id + ".pdf\"")
                            .contentType(MediaType.APPLICATION_PDF)
                            .body(pdf);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/{id}/generate")
    public ResponseEntity<DocumentCdc> generateContenu(@PathVariable Long id) {
        return documentCdcRepository.findById(id)
                .map(document -> {
                    String contenuGenere = aiEngineClient.generateFromDocument(id);
                    document.setContenu(contenuGenere);
                    DocumentCdc saved = documentCdcRepository.save(document);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}