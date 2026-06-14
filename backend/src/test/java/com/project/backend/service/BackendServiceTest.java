package com.project.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.project.backend.model.Document;
import com.project.backend.model.DocumentPermission;
import com.project.backend.model.User;
import com.project.backend.repository.DocumentPermissionRepository;
import com.project.backend.repository.DocumentRepository;
import com.project.backend.repository.UserRepository;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BackendServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentPermissionRepository documentPermissionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSyncService userSyncService;
    @InjectMocks
    private DocumentService documentService;

    @Test
    void testCreateDocument() {
        UUID ownerId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);
        owner.setUsername("testuser");
        owner.setEmail("test@example.com");

        Document document = new Document();
        document.setTitle("Mój testowy dokument");

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Document result = documentService.createDocument(document, ownerId);

        assertNotNull(result);
        assertEquals("Mój testowy dokument", result.getTitle());
        assertEquals(owner, result.getOwner());
        assertEquals("testuser", result.getOwner().getUsername());
        verify(documentRepository, times(1)).save(document);
        verify(userRepository, times(1)).findById(ownerId);
    }

    @Test
    void testCreateDocumentUserNotFound() {
        UUID fakeOwnerId = UUID.randomUUID();
        Document document = new Document();
        document.setTitle("Dokument widmo");

        when(userRepository.findById(fakeOwnerId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            documentService.createDocument(document, fakeOwnerId);
        });

        verify(documentRepository, never()).save(any());
    }

    @Test 
    void testShareDocument() {
        UUID docID = UUID.randomUUID();
        UUID ownerID = UUID.randomUUID();
        User testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("abc@gmail.com");
        DocumentPermission existingPermission = new DocumentPermission();
        existingPermission.setRole("STARA_ROLA");
        existingPermission.setDocumentId(docID);
        existingPermission.setUserId(ownerID);

        when(documentRepository.findById(docID)).thenReturn(Optional.of(new Document()));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(documentPermissionRepository.findByDocumentIdAndUserId(docID, testUser.getId())).thenReturn(Optional.of(existingPermission));
        when(documentPermissionRepository.save(any(DocumentPermission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        documentService.shareDocument(docID, testUser.getEmail(), "VIEWER");
        assertEquals("VIEWER", existingPermission.getRole());

        verify(documentPermissionRepository, times(1)).save(any(DocumentPermission.class));
        
    }

    @Test
    void testShareDocumentDocumentNotFound() {
        UUID docID = UUID.randomUUID();

        when(documentRepository.findById(docID)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            documentService.shareDocument(docID, "abc@gmail.com", "VIEWER");
        });

        verify(documentPermissionRepository, never()).save(any());
    }

}