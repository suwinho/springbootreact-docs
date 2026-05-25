package com.project.backend.dto;

import java.util.UUID;

public record DocumentMemberDTO(
    UUID userId,
    String username,
    String email,
    String displayName,
    String role,       
    Boolean isBanned
) {}