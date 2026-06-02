package com.project.backend.controller;

import com.project.backend.repository.DocumentRepository;
import com.project.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public HealthController(DocumentRepository documentRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @GetMapping("/api/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long documentCount = documentRepository.count();
        long userCount = userRepository.count();
        
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "documents", documentCount,
            "users", userCount
        ));
    }
}
