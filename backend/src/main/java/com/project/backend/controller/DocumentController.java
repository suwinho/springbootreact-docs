package com.project.backend.controller;

import com.nimbusds.jose.proc.SecurityContext;
import com.project.backend.model.Document;
import com.project.backend.repository.DocumentRepository;
import com.project.backend.repository.UserRepository;
import com.project.backend.service.UserSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
 
    private final UserRepository userRepository;
    private final UserSyncService userSyncService;
    private final DocumentRepository documentRepository;

    public DocumentController(UserSyncService userSyncService, UserRepository userRepository, DocumentRepository documentRepository) {
        this.userSyncService = userSyncService;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
    }

    @GetMapping("")
    public ResponseEntity<List<Document>> getDocuments() {
        userSyncService.userSync();
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        UUID ownerId = UUID.fromString(jwtToken.getName());
        List<Document> docsList = documentRepository.findByOwnerId(ownerId);
        return ResponseEntity.ok(docsList);
    }

}
