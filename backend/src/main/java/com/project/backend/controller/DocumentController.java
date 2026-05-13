package com.project.backend.controller;

import com.nimbusds.jose.proc.SecurityContext;
import com.project.backend.model.Document;
import com.project.backend.model.DocumentPermission;
import com.project.backend.model.User;
import com.project.backend.repository.DocumentPermissionReposiotry;
import com.project.backend.repository.DocumentPermissionRepository;
import com.project.backend.repository.DocumentRepository;
import com.project.backend.repository.UserRepository;
import com.project.backend.service.UserSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
 
    private final UserRepository userRepository;
    private final UserSyncService userSyncService;
    private final DocumentRepository documentRepository;
    private final DocumentPermissionRepository documentPermissionRepository;

    public DocumentController(UserSyncService userSyncService, UserRepository userRepository, DocumentRepository documentRepository, DocumentPermissionReposiotry documentPermissionRepository) {
        this.userSyncService = userSyncService;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.documentPermissionRepository = documentPermissionRepository;
    }

    @GetMapping
    public ResponseEntity<List<Document>> getDocuments() {
        userSyncService.userSync();
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        UUID ownerId = UUID.fromString(jwtToken.getToken().getSubject());
        List<Document> docsList = documentRepository.findByOwnerId(ownerId);
        return ResponseEntity.ok(docsList);
    }

    @PostMapping
    public ResponseEntity<Document> createDocument(@RequestBody Document document) {
        userSyncService.userSync();
        Document createdDocument = documentRepository.save(document);
        return ResponseEntity.ok(createdDocument);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable UUID id) {
        userSyncService.userSync();
        return documentRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(@PathVariable UUID id, @RequestBody Document document) {
        userSyncService.userSync();
        return documentRepository.findById(id).map(existingDocument -> {
            existingDocument.setTitle(document.getTitle());
            existingDocument.setContent(document.getContent());
            existingDocument.setContentSnapshot(document.getContentSnapshot());
            existingDocument.setVersion(document.getVersion());
            existingDocument.setUpdatedAt(document.getUpdatedAt());
            return ResponseEntity.ok(documentRepository.save(existingDocument));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID id) {
        userSyncService.userSync();
        return documentRepository.findById(id).map(existingDocument -> {
            documentRepository.delete(existingDocument);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareDocument(@PathVariable UUID id, @RequestBody ShareRequest request) {
        userSyncService.userSync();

        Optional<Document> doc = documentRepository.findById(id);
        if (doc.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> user = userRepository.findByEmail(request.email());
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        DocumentPermission perms = new DocumentPermission();
        perms.setUserId(user.get().getId());
        perms.setDocumentId(id);
        perms.setRole(request.role());
        documentPermissionRepository.save(perms);

        return ResponseEntity.ok().build();
        
    }


}
