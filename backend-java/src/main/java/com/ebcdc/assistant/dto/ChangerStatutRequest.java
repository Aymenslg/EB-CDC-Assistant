package com.ebcdc.assistant.dto;

import com.ebcdc.assistant.model.StatutValidation;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangerStatutRequest {

    @NotNull(message = "Le nouveau statut est obligatoire")
    private StatutValidation nouveauStatut;

    private String commentaire; // optionnel, ex: raison d'un rejet
}