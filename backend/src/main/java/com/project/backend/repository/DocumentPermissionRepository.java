package com.project.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.backend.model.DocumentPermission;

public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {
    Optional<DocumentPermission> findByDocumentIdAndUserId(UUID documentId, UUID userId);
    List<DocumentPermission> findByDocumentId(UUID documentId);
    void deleteByDocumentIdAndUserId(UUID documentId, UUID userId);
}
