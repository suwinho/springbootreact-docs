package com.project.backend.controller;

import com.project.backend.dto.DocumentDTO;
import com.project.backend.dto.DocumentMemberDTO;
import com.project.backend.model.Document;
import com.project.backend.service.DocumentService;
import com.project.backend.service.UserSyncService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final UserSyncService userSyncService;

    public DocumentController(DocumentService documentService, UserSyncService userSyncService) {
        this.documentService = documentService;
        this.userSyncService = userSyncService;
    }

    private UUID getCurrentUserId() {
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString(jwtToken.getToken().getSubject());
    }

    @GetMapping
    public ResponseEntity<Page<DocumentDTO>> getDocuments(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        userSyncService.userSync();
        UUID ownerId = getCurrentUserId();
        Page<DocumentDTO> dtoPage = documentService.getDocuments(ownerId, PageRequest.of(page, size));
        return ResponseEntity.ok(dtoPage);
    }

    @PostMapping
    public ResponseEntity<Document> createDocument(@RequestBody Document document) {
        userSyncService.userSync();
        UUID ownerId = getCurrentUserId();
        Document createdDocument = documentService.createDocument(document, ownerId);
        return ResponseEntity.ok(createdDocument);
    }

    @PreAuthorize("@docSecurity.hasRole(#id, 'VIEWER', authentication)")
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable UUID id) {
        userSyncService.userSync();
        return documentService.getDocument(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("@docSecurity.hasRole(#id, 'EDITOR', authentication)")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(@PathVariable UUID id, @RequestBody Document document) {
        userSyncService.userSync();
        return documentService.updateDocument(id, document)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID id) {
        userSyncService.userSync();
        if (documentService.deleteDocument(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")
    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareDocument(@PathVariable UUID id, @RequestBody ShareRequest request) {
        userSyncService.userSync();
        try {
            documentService.shareDocument(id, request.email(), request.role());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/my-role")
    public ResponseEntity<Map<String, String>> getUserRole(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        String role = documentService.getUserRole(id, userId);
        if (role == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("role", role));
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")
    public ResponseEntity<List<DocumentMemberDTO>> getMembers(@PathVariable UUID id) {
        try {
            List<DocumentMemberDTO> members = documentService.getMembers(id);
            return ResponseEntity.ok(members);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/members/{userId}/ban")
    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")
    public ResponseEntity<?> banMember(@PathVariable UUID id, @PathVariable UUID userId) {
        if (documentService.banMember(id, userId)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/members/{userId}/unban")
    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")
    public ResponseEntity<?> unbanMember(@PathVariable UUID id, @PathVariable UUID userId) {
        if (documentService.unbanMember(id, userId)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/members/{userId}/role")
    @PreAuthorize("@docSecurity.isOwner(#id, authentication)")
    public ResponseEntity<?> changeMemberRole(@PathVariable UUID id, @PathVariable UUID userId, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        try {
            if (documentService.changeMemberRole(id, userId, newRole)) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
