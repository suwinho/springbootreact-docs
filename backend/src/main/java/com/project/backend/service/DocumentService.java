package com.project.backend.service;

import java.util.UUID;

import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import com.project.backend.model.Document;
import com.project.backend.repository.DocumentRepository;

@Service
public class DocumentService {
    private final DocumentRepository documentRepository;

    public DocumentService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public void updateContent(UUID documentId, @Payload String content) {
        Document doc = documentRepository.findById(documentId).orElseThrow();
        doc.setContent(content);
        documentRepository.save(doc);
    }
}
