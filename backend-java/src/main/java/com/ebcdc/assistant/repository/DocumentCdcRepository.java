

package com.ebcdc.assistant.repository;

import com.ebcdc.assistant.model.DocumentCdc;
import com.ebcdc.assistant.model.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCdcRepository extends JpaRepository<DocumentCdc, Long> {

    List<DocumentCdc> findByStatut(StatutValidation statut);
}