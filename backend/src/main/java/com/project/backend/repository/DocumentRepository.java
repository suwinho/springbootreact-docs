package com.project.backend.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.project.backend.model.Document;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    Page<Document> findByOwnerId(UUID ownerId, Pageable pageable);
}
