package com.project.backend.config;

import java.util.List;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import com.project.backend.model.Document;
import com.project.backend.service.RedisDocumentService;

@Component
public class WebSocketEventListener {
    private final RedisDocumentService redisDocumentService;
    private final SimpMessageSendingOperations msg;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final com.project.backend.repository.DocumentRepository documentRepository;

    public WebSocketEventListener(RedisDocumentService redisDocumentService, 
                                  SimpMessageSendingOperations msg,
                                  org.springframework.data.redis.core.StringRedisTemplate redisTemplate,
                                  com.project.backend.repository.DocumentRepository documentRepository) {
        this.redisDocumentService = redisDocumentService;
        this.msg = msg;
        this.redisTemplate = redisTemplate;
        this.documentRepository = documentRepository;
    }

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();
        String username = "Anonim";
        if (accessor.getUser() instanceof JwtAuthenticationToken jwtAuth) {
            String preferredUsername = jwtAuth.getToken().getClaimAsString("preferred_username");
            if (preferredUsername != null) {
                username = preferredUsername;
            } else {
                String nameClaim = jwtAuth.getToken().getClaimAsString("name");
                if (nameClaim != null) {
                    username = nameClaim;
                } else {
                    username = jwtAuth.getName();
                }
            }
        }

        if (destination != null && destination.startsWith("/topic/doc/")) {
            if (destination.endsWith("/presence")) {
                String docId = destination.replace("/topic/doc/", "").replace("/presence", "");
                List<String> users = redisDocumentService.getOnlineUsers(docId).stream().distinct().toList();
                msg.convertAndSend("/topic/doc/" + docId + "/presence", users);
                return;
            }
            String docId = destination.replace("/topic/doc/", "");
            redisDocumentService.addSession(sessionId, docId, username);
            List<String> users = redisDocumentService.getOnlineUsers(docId).stream().distinct().toList();
            msg.convertAndSend("/topic/doc/" + docId + "/presence", users);

            String currentContent = redisTemplate.opsForValue().get("document:" + docId + ":content");
            if (currentContent == null) {
                try {
                    java.util.UUID documentUUID = java.util.UUID.fromString(docId);
                    Document doc = documentRepository.findById(documentUUID).orElse(null);
                    if (doc != null && doc.getContent() != null) {
                        currentContent = doc.getRawContent();
                        if (currentContent != null) {
                            redisTemplate.opsForValue().set("document:" + docId + ":content", currentContent);
                        }
                    }
                } catch (Exception e) {
                }
            }
            if (currentContent != null && !currentContent.isEmpty() && !currentContent.equals("{}")) {
                msg.convertAndSend("/topic/doc/" + docId, currentContent);
            }
        }
    }

    @EventListener
    public void handleSessionDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        String docId = redisDocumentService.removeSessionAndGetDocumentId(sessionId);
        if (docId != null) {
            List<String> users = redisDocumentService.getOnlineUsers(docId).stream().distinct().toList();
            msg.convertAndSend("/topic/doc/" + docId + "/presence", users);
        }
    }
}
