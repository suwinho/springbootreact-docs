package com.project.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {
    
    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    private final DocumentSecurity docSecurity;

    public WebSocketConfiguration(JwtDecoder jwtDecoder, JwtAuthenticationConverter jwtAuthenticationConverter, DocumentSecurity docSecurity) {
        this.jwtDecoder = jwtDecoder;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
        this.docSecurity = docSecurity;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry brokerRegistry) {
        brokerRegistry.setApplicationDestinationPrefixes("/app");
        brokerRegistry.enableSimpleBroker("/topic");

    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor.getCommand() == StompCommand.CONNECT) {
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                        try {
                            Jwt jwt = jwtDecoder.decode(token);
                            Authentication auth = jwtAuthenticationConverter.convert(jwt);
                            accessor.setUser(auth);
                        } catch (Exception e) {
                            throw new MessageDeliveryException("Invalid token");
                        }
                    }
                } else if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
                    String destination = accessor.getDestination();
                    if (destination != null && destination.startsWith("/topic/doc/")) {
                        String docIdStr = destination.replace("/topic/doc/", "");
                        if (docIdStr.endsWith("/presence")) {
                            docIdStr = docIdStr.replace("/presence", "");
                        }
                        try {
                            java.util.UUID docId = java.util.UUID.fromString(docIdStr);
                            Authentication auth = (Authentication) accessor.getUser();
                            if (auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
                                if (!docSecurity.hasRole(docId, "VIEWER", jwtAuth)) {
                                    throw new MessageDeliveryException("Access denied: You do not have permission to access this document");
                                }
                            } else {
                                throw new MessageDeliveryException("Unauthorized");
                            }
                        } catch (Exception e) {
                            throw new MessageDeliveryException("Access denied");
                        }
                    }
                }
                return message;
            }
        });
    }

}
