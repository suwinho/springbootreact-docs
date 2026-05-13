package com.project.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import com.project.backend.model.User;
import com.project.backend.repository.UserRepository;

@Service
public class UserSyncService {
    private final UserRepository userRepository;

    public UserSyncService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void userSync() {
        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context.getAuthentication();
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) authentication;
        Jwt jwt = jwtToken.getToken();
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String name = jwt.getClaimAsString("name");
        Optional<User> user = userRepository.findById(UUID.fromString(jwt.getSubject()));
        if (user.isEmpty()) {
            User newUser = new User();
            newUser.setId(UUID.fromString(jwt.getSubject()));
            newUser.setUsername(username);
            newUser.setDisplayName(username);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setEmail(email);
            userRepository.save(newUser);
        }
    }
}
