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
    public String handle(@DestinationVariable UUID id, @Payload String msg, JwtAuthenticationToken auth) {
        if (docSecurity.hasRole(id, "EDITOR", auth)) {
            redisDocumentService.saveToRedis(id, msg);
        }
        return msg;
    }

}
