package com.ebcdc.assistant.repository;

import com.ebcdc.assistant.model.ValidationHistorique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ValidationHistoriqueRepository extends JpaRepository<ValidationHistorique, Long> {
    List<ValidationHistorique> findByDocumentIdOrderByDateChangementAsc(Long documentId);
}