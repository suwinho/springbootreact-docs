package com.project.backend.config;

import java.util.UUID;

import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.project.backend.repository.DocumentPermissionRepository;
import com.project.backend.repository.DocumentRepository;

@Component("docSecurity")
public class DocumentSecurity {
    
    private final DocumentPermissionRepository documentPermissionRepository;
    private final DocumentRepository documentRepository;
    public DocumentSecurity(DocumentPermissionRepository documentPermissionRepository, DocumentRepository documentRepository) {
        this.documentPermissionRepository = documentPermissionRepository;
        this.documentRepository = documentRepository;
    }

    public boolean isOwner(UUID documentId, JwtAuthenticationToken auth) {
        UUID userId = UUID.fromString(auth.getToken().getSubject());
        return documentRepository.findById(documentId)
            .map(d -> d.getOwner() != null && d.getOwner().getId().equals(userId))
            .orElse(false);
    }
    

    public boolean hasRole(UUID documentId, String requiredRole, JwtAuthenticationToken auth) {
        if (isOwner(documentId, auth)) return true;

        UUID userId = UUID.fromString(auth.getToken().getSubject());
        return documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId)
            .filter(perm -> !Boolean.TRUE.equals(perm.getIsBanned())) 
            .map(perm -> perm.getRole().equals(requiredRole) || (requiredRole.equals("VIEWER") && perm.getRole().equals("EDITOR")))
            .orElse(false);
    }

}
