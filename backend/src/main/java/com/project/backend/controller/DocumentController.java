package com.project.backend.controller;

import com.nimbusds.jose.proc.SecurityContext;
import com.project.backend.config.DocumentRole;
import com.project.backend.dto.DocumentDTO;
import com.project.backend.model.Document;
import com.project.backend.model.DocumentPermission;
import com.project.backend.model.User;
import com.project.backend.repository.DocumentPermissionRepository;
import com.project.backend.repository.DocumentRepository;
import com.project.backend.repository.UserRepository;
import com.project.backend.service.UserSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
 
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    private final UserRepository userRepository;
    private final UserSyncService userSyncService;
    private final DocumentRepository documentRepository;
    private final DocumentPermissionRepository documentPermissionRepository;

    public DocumentController(UserSyncService userSyncService, UserRepository userRepository, DocumentRepository documentRepository, DocumentPermissionRepository documentPermissionRepository, JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.userSyncService = userSyncService;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.documentPermissionRepository = documentPermissionRepository;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    @GetMapping
    public ResponseEntity<Page<DocumentDTO>> getDocuments(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        userSyncService.userSync();
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        UUID ownerId = UUID.fromString(jwtToken.getToken().getSubject());
        Page<Document> docsList = documentRepository.findOwnedOrShared(ownerId, PageRequest.of(page,size));
        Page<DocumentDTO> dtoPage = docsList.map(doc ->{
            String myRole;
            if (doc.getOwner() != null && doc.getOwner().getId().equals(ownerId)) {
                myRole = "OWNER";
            } else {
                myRole = documentPermissionRepository
                    .findByDocumentIdAndUserId(doc.getId(), ownerId)
                    .map(DocumentPermission::getRole)
                    .orElse("VIEWER");
            }
            return new DocumentDTO(
                doc.getId(),
                doc.getTitle(),
                doc.getOwner().getUsername(),
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                myRole
            );
        }

        );
        return ResponseEntity.ok(dtoPage);
    }

    
    @PostMapping
    public ResponseEntity<Document> createDocument(@RequestBody Document document) {
        userSyncService.userSync();
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        UUID ownerId = UUID.fromString(jwtToken.getToken().getSubject());
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        document.setOwner(owner);
        Document createdDocument = documentRepository.save(document);
        return ResponseEntity.ok(createdDocument);
    }

    @PreAuthorize("@docSecurity.hasRole(#id, 'VIEWER', authentication)")
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable UUID id) {
        userSyncService.userSync();
        return documentRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("@docSecurity.hasRole(#id, 'EDITOR', authentication)")
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

    @PreAuthorize("@docSecurity.isOwner(#id, authentication)") 
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID id) {
        userSyncService.userSync();
        return documentRepository.findById(id).map(existingDocument -> {
            documentRepository.delete(existingDocument);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")    
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

        DocumentRole roleToGive;
        try {
            roleToGive = DocumentRole.valueOf(request.role().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid role, it's either VIEWER or EDITOR");
        }

        DocumentPermission perms = documentPermissionRepository
            .findByDocumentIdAndUserId(id, user.get().getId())
            .orElse(new DocumentPermission());
        perms.setUserId(user.get().getId());
        perms.setDocumentId(id);
        perms.setRole(roleToGive.name());
        documentPermissionRepository.save(perms);

        return ResponseEntity.ok().build();
        
    }


    @GetMapping("/{id}/my-role")
    public ResponseEntity<Map<String,String>> getUserRole(@PathVariable UUID id) {
        JwtAuthenticationToken jwt = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        UUID userId = UUID.fromString(jwt.getToken().getSubject());
        return documentRepository.findById(id).map(doc -> {
            String role;
            if (doc.getOwner().getId().equals(userId)) {
                role = "OWNER";
            } else {
                role = documentPermissionRepository
                    .findByDocumentIdAndUserId(id, userId)
                    .map(DocumentPermission::getRole)
                    .orElse("NONE");
            }
            return ResponseEntity.ok(Map.of("role", role));
        }).orElse(ResponseEntity.notFound().build());
    }


}
