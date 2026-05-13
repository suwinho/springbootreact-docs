package com.project.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.backend.model.Document;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByOwnerId(UUID ownerId);
}
