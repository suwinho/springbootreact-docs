package com.project.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.backend.model.DocumentPermission;

public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {
    Optional<DocumentPermission> findByDocumentIdAndUserId(UUID documentId, UUID userId);
}
