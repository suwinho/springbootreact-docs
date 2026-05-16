package com.project.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisDocumentService {
    private final StringRedisTemplate redisTemplate;

    public RedisDocumentService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveToRedis(UUID documentId, String content) {
        redisTemplate.opsForValue().set("document:" + documentId + ":content", content);
        redisTemplate.opsForSet().add("dirty-docs", documentId.toString());
    }

    public void addSession(String sessionId, String documentId, String username) {
        redisTemplate.opsForValue().set("ws:session:" + sessionId, documentId);
        redisTemplate.opsForHash().put("doc:" + documentId + ":sessions", sessionId, username);
    }

    public String removeSessionAndGetDocumentId(String sessionId) {
        String docId = redisTemplate.opsForValue().get("ws:session:" + sessionId);
        if (docId != null) {
            redisTemplate.opsForHash().delete("doc:" + docId + ":sessions", sessionId);
            redisTemplate.delete("ws:session:" + sessionId);
        }
        return docId;
    }

    public List<String> getOnlineUsers(String documentId) {
        return redisTemplate.opsForHash().values("doc:" + documentId + ":sessions").stream().map(Object::toString).toList();
    }
    
}
