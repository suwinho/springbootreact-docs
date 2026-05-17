package com.project.backend.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


@Component
public class DocumentSyncScheduler {
    private final StringRedisTemplate redisTemplate;
    private final DocumentService documentService;

    public DocumentSyncScheduler(StringRedisTemplate redisTemplate, DocumentService documentService) {
        this.redisTemplate = redisTemplate;
        this.documentService = documentService;
    }
    @Scheduled(fixedRate = 5000)
    public void saveDocsToDb() {
        List<String> dirtyDocsId = redisTemplate.opsForSet().pop("dirty-docs", 100);
        if (dirtyDocsId == null) {
            return;
        }

        for (String idStr : dirtyDocsId) {
            String content = redisTemplate.opsForValue().get("document:" + idStr + ":content");
            UUID docId = UUID.fromString(idStr);
            documentService.updateContent(docId, content); 
            
        }
    }
}
