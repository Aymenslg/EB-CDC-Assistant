package com.ebcdc.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateFromEbRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "Le besoin ne peut pas être vide")
    @Size(min = 20, message = "Le besoin doit contenir au moins 20 caractères")
    private String besoin;
}