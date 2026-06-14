package com.project.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import com.project.backend.config.DocumentRole;
import com.project.backend.dto.DocumentDTO;
import com.project.backend.dto.DocumentMemberDTO;
import com.project.backend.model.Document;
import com.project.backend.model.DocumentPermission;
import com.project.backend.model.User;
import com.project.backend.repository.DocumentPermissionRepository;
import com.project.backend.repository.DocumentRepository;
import com.project.backend.repository.UserRepository;

@Service
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final DocumentPermissionRepository documentPermissionRepository;
    private final UserRepository userRepository;

    public DocumentService(DocumentRepository documentRepository,
                           DocumentPermissionRepository documentPermissionRepository,
                           UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.documentPermissionRepository = documentPermissionRepository;
        this.userRepository = userRepository;
    }

    public void updateContent(UUID documentId, @Payload String content) {
        Document doc = documentRepository.findById(documentId).orElseThrow();
        doc.setContent(content);
        documentRepository.save(doc);
    }

    public Page<DocumentDTO> getDocuments(UUID ownerId, Pageable pageable) {
        Page<Document> docsList = documentRepository.findOwnedOrShared(ownerId, pageable);
        return docsList.map(doc -> {
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
        });
    }

    public Document createDocument(Document document, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        document.setOwner(owner);
        return documentRepository.save(document);
    }

    public Optional<Document> getDocument(UUID id) {
        return documentRepository.findById(id);
    }

    public Optional<Document> updateDocument(UUID id, Document document) {
        return documentRepository.findById(id).map(existingDocument -> {
            existingDocument.setTitle(document.getTitle());
            existingDocument.setContent(document.getContent());
            existingDocument.setContentSnapshot(document.getContentSnapshot());
            existingDocument.setVersion(document.getVersion());
            existingDocument.setUpdatedAt(document.getUpdatedAt());
            return documentRepository.save(existingDocument);
        });
    }

    public boolean deleteDocument(UUID id) {
        return documentRepository.findById(id).map(existingDocument -> {
            documentRepository.delete(existingDocument);
            return true;
        }).orElse(false);
    }

    public void shareDocument(UUID documentId, String email, String role) {
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DocumentRole roleToGive;
        try {
            roleToGive = DocumentRole.valueOf(role.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role, it's either VIEWER or EDITOR");
        }

        DocumentPermission perms = documentPermissionRepository
            .findByDocumentIdAndUserId(documentId, user.getId())
            .orElse(new DocumentPermission());
        perms.setUserId(user.getId());
        perms.setDocumentId(documentId);
        perms.setRole(roleToGive.name());
        documentPermissionRepository.save(perms);
    }

    public String getUserRole(UUID documentId, UUID userId) {
        return documentRepository.findById(documentId).map(doc -> {
            if (doc.getOwner().getId().equals(userId)) {
                return "OWNER";
            } else {
                return documentPermissionRepository
                    .findByDocumentIdAndUserId(documentId, userId)
                    .filter(perm -> !Boolean.TRUE.equals(perm.getIsBanned()))
                    .map(DocumentPermission::getRole)
                    .orElse("NONE");
            }
        }).orElse(null);
    }

    public List<DocumentMemberDTO> getMembers(UUID documentId) {
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        List<DocumentMemberDTO> members = new ArrayList<>();

        User owner = doc.getOwner();
        members.add(new DocumentMemberDTO(
            owner.getId(), owner.getUsername(), owner.getEmail(), owner.getDisplayName(), "OWNER", false
        ));

        List<DocumentPermission> perms = documentPermissionRepository.findByDocumentId(documentId);
        for (DocumentPermission perm : perms) {
            userRepository.findById(perm.getUserId()).ifPresent(user -> members.add(new DocumentMemberDTO(
                user.getId(), user.getUsername(), user.getEmail(), user.getDisplayName(), perm.getRole(), perm.getIsBanned()
            )));
        }
        return members;
    }

    public boolean banMember(UUID documentId, UUID userId) {
        return documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId)
            .map(perm -> {
                perm.setIsBanned(true);
                documentPermissionRepository.save(perm);
                return true;
            }).orElse(false);
    }

    public boolean unbanMember(UUID documentId, UUID userId) {
        return documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId)
            .map(perm -> {
                perm.setIsBanned(false);
                documentPermissionRepository.save(perm);
                return true;
            }).orElse(false);
    }

    public boolean changeMemberRole(UUID documentId, UUID userId, String newRole) {
        try {
            DocumentRole.valueOf(newRole.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid role");
        }
        return documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId)
            .map(perm -> {
                perm.setRole(newRole.toUpperCase());
                documentPermissionRepository.save(perm);
                return true;
            }).orElse(false);
    }
}
