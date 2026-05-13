package com.project.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.backend.model.DocumentPermission;

public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {
    
}
