package com.project.backend.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.project.backend.model.Document;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    Page<Document> findByOwnerId(UUID ownerId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Document d WHERE d.owner.id = :userId OR d.id IN (SELECT dp.documentId FROM DocumentPermission dp WHERE dp.userId = :userId)")
    Page<Document> findOwnedOrShared(@org.springframework.data.repository.query.Param("userId") UUID userId, Pageable pageable);
}
