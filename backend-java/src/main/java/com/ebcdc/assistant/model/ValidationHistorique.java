package com.ebcdc.assistant.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "validation_historique")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ValidationHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ancien_statut", nullable = false)
    private StatutValidation ancienStatut;

    @Enumerated(EnumType.STRING)
    @Column(name = "nouveau_statut", nullable = false)
    private StatutValidation nouveauStatut;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "date_changement")
    private LocalDateTime dateChangement;

    @PrePersist
    protected void onCreate() {
        this.dateChangement = LocalDateTime.now();
    }
}