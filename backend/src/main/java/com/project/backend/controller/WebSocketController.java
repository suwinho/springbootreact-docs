package com.project.backend.controller;

import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Controller;

import com.project.backend.config.DocumentSecurity;
import com.project.backend.service.RedisDocumentService;

@Controller
public class WebSocketController {
    private final DocumentSecurity docSecurity;
    private final RedisDocumentService redisDocumentService;
    
    public WebSocketController(DocumentSecurity docSecurity, RedisDocumentService redisDocumentService) {
        this.docSecurity = docSecurity;
        this.redisDocumentService = redisDocumentService;
    }

    @MessageMapping("/doc/{id}/edit")
    @SendTo("/topic/doc/{id}")
    public String handle(@DestinationVariable UUID id, @Payload String msg, java.security.Principal principal) {
        System.out.println("[WS-DEBUG] WebSocket message received for doc: " + id + ", principal: " + principal);
        if (principal instanceof JwtAuthenticationToken auth) {
            if (docSecurity.hasRole(id, "EDITOR", auth)) {
                System.out.println("[WS-DEBUG] Save permitted. Saving to Redis...");
                redisDocumentService.saveToRedis(id, msg);
            } else {
                System.out.println("[WS-DEBUG] Save denied. Principal has no EDITOR permission on doc: " + id);
            }
        } else {
            System.out.println("[WS-DEBUG] Save denied. Principal is not JwtAuthenticationToken: " + principal);
        }
        return msg;
    }

}
